'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

// Unlike the site's other one-shot mockups (CountUpPercent, MatchingAnimation),
// this one is a perpetual loop: it starts once the board scrolls into view,
// then keeps cycling forever rather than settling into a final state. Each
// column is capped at 3 cards at all times — nothing is ever added without
// something else leaving first — so it reads as a constant, steady workflow
// instead of a one-off demo that resets.
//
// Every "tick" of the loop is one synchronized step through the whole
// pipeline: the oldest interview card leaves (placed/archived), the oldest
// sent card is promoted into that freed interview slot with a new time
// slot, the oldest todo card is promoted into that freed sent slot, and a
// fresh offer fills the gap left in "À faire". One combined state update,
// so the three columns always move together.
//
// Card movement is a manual FLIP (First, Last, Invert, Play): every .card
// gets measured via getBoundingClientRect right after each state change,
// the delta from its previous position is applied as an instant transform,
// then cleared next frame with a transition, so it glides from where it
// was to where it now is instead of snapping. A card with no previous rect
// fades/scales in; a card about to leave is faded out imperatively just
// before it's actually removed from state, rather than popping out.
type Variant = 'slate' | 'amber' | 'green';

type CardData = {
  id: string;
  schoolBadge?: boolean;
  title: string;
  company: string;
  location: string;
  interviewPill?: string;
  // The card's own displayed color — kept as the column it came from
  // while it's sliding, and only switched to the new column's color once
  // it has actually landed (see the color-swap timeouts in beat3/beat4),
  // rather than snapping to the destination color the instant it moves.
  variant: Variant;
};

type Template = { title: string; company: string; location: string; schoolBadge?: boolean };

const POOL: Template[] = [
  { title: 'Alternance Marketing Digital', company: "L'Oréal", location: 'Clichy', schoolBadge: true },
  { title: 'Assistant chef de projet', company: 'Decathlon', location: 'Paris 15e' },
  { title: 'Alternance Growth Marketing', company: 'Doctolib', location: 'Paris 9e', schoolBadge: true },
  { title: 'Alternance Communication', company: 'Nike', location: 'Paris 8e', schoolBadge: true },
  { title: 'Alternant CRM & Data Marketing', company: 'Sephora', location: 'Neuilly-sur-Seine' },
  { title: 'Chargé de Projet Marketing', company: 'Rocket School', location: 'Paris 8e' },
  { title: 'Chargé de communication', company: 'BlaBlaCar', location: 'Paris 11e' },
  { title: 'Alternance RH', company: 'Sephora', location: 'Neuilly-sur-Seine' },
  { title: 'Assistant Chef de Produit', company: "L'Oréal", location: 'Clichy' },
];

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
// Fixed day-of-month anchors + hours: deterministic, not random, so the
// same dates show up all month regardless of when the page is loaded —
// each anchor is nudged forward to the nearest weekday.
const DAY_ANCHORS = [4, 7, 11, 14, 19];
const HOURS = ['18h00', '10h30', '11h00', '14h00', '9h30'];

function buildPillDates(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return DAY_ANCHORS.map((day, i) => {
    const d = new Date(year, month, day);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return `Le ${d.getDate()} ${MONTHS_FR[d.getMonth()]} à ${HOURS[i]}`;
  });
}

const PILL_DATES = buildPillDates();

function makeCard(cycle: number, variant: Variant = 'slate'): CardData {
  const t = POOL[cycle % POOL.length];
  return { id: `${t.company}-${t.title}-${cycle}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), variant, ...t };
}

// Starting point: 2 in "À faire", 3 in "Envoyé", 2 in "Entretien" — the
// loop below always returns here exactly, so it can repeat forever
// without ever drifting or needing a reset.
function initialColumns() {
  return {
    interview: [0, 1].map((c) => ({ ...makeCard(c, 'green'), interviewPill: PILL_DATES[c % PILL_DATES.length] })),
    sent: [2, 3, 4].map((c) => makeCard(c, 'amber')),
    todo: [5, 6].map((c) => makeCard(c, 'slate')),
  };
}

const BEAT_PAUSE = 2600;
const EXIT_DURATION = 500;

function Card({ card, pillRevealed }: { card: CardData; pillRevealed: boolean }) {
  return (
    <div className={`card card--${card.variant}`} data-flip-id={card.id}>
      {card.schoolBadge && <span className="card-school-badge"><Icon name="graduation-cap" />Proposée par l&apos;école</span>}
      <div className="card-heading">
        <span className="card-title">{card.title}</span>
        <span className="card-heading-sep"> chez </span>
        <span className="card-company">{card.company}</span>
      </div>
      <div className="card-meta-row">
        <span className="card-meta-item"><Icon name="map-pin" />{card.location}</span>
      </div>
      <div className="card-link-row">
        <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
        <span className="card-link card-link--generate"><Icon name="sparkles" />Générer CV</span>
      </div>
      {card.interviewPill && (
        <span className={`card-interview-pill landing-kanban-pill${pillRevealed ? ' is-revealed' : ''}`}>
          <Icon name="calendar" />{card.interviewPill}
        </span>
      )}
    </div>
  );
}

// An offscreen copy of all three real columns, each holding 3 cards (the
// fixed cap), measured once on mount to lock in the board's height. Needs
// all three side by side rather than just one: "Entretien" cards carry a
// date pill that "À faire"/"Envoyé" cards don't, so a single generic
// column underestimates how tall the board can actually get once a real
// interview column fills up with pills.
function GaugeBoard({ gaugeRef }: { gaugeRef: (el: HTMLDivElement | null) => void }) {
  return (
    <div className="landing-kanban-board" ref={gaugeRef} aria-hidden style={{ visibility: 'hidden', position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: -1 }}>
      <div className="column">
        <div className="column-header column-header--slate">
          <Icon name="circle-dashed" /><span className="column-header-label">À faire</span><span className="column-header-count">0</span>
        </div>
        <div className="card-list">
          {[0, 1, 2].map((i) => <Card key={i} card={makeCard(i, 'slate')} pillRevealed />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--amber">
          <Icon name="hourglass" /><span className="column-header-label">Envoyé</span><span className="column-header-count">0</span>
        </div>
        <div className="card-list">
          {[3, 4, 5].map((i) => <Card key={i} card={makeCard(i, 'amber')} pillRevealed />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--green">
          <Icon name="target" /><span className="column-header-label">Entretien</span><span className="column-header-count">0</span>
        </div>
        <div className="card-list">
          {[6, 7, 8].map((i) => <Card key={i} card={{ ...makeCard(i, 'green'), interviewPill: PILL_DATES[i % PILL_DATES.length] }} pillRevealed />)}
        </div>
      </div>
    </div>
  );
}

export default function KanbanAnimation() {
  const [columns, setColumns] = useState(initialColumns);
  const [revealedPills, setRevealedPills] = useState<Set<string>>(() => new Set(initialColumns().interview.map((c) => c.id)));
  const [boardMinHeight, setBoardMinHeight] = useState<number | undefined>(undefined);
  const boardRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());
  // Mutable pipeline state read/written synchronously by the tick loop —
  // React state (`columns`) mirrors it for rendering, but the loop's own
  // scheduling never depends on when a render actually commits.
  const pipelineRef = useRef(columns);
  const cycleRef = useRef(7);
  const dateIdxRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useLayoutEffect(() => {
    if (!gaugeRef.current) return;
    setBoardMinHeight(gaugeRef.current.getBoundingClientRect().height);
  }, []);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function commit(mutate: (cols: { todo: CardData[]; sent: CardData[]; interview: CardData[] }) => void) {
      const next = {
        todo: pipelineRef.current.todo.slice(),
        sent: pipelineRef.current.sent.slice(),
        interview: pipelineRef.current.interview.slice(),
      };
      mutate(next);
      pipelineRef.current = next;
      setColumns(next);
    }

    // Swaps a card's displayed color once it has actually landed in its
    // new column, rather than the moment it starts sliding there — the
    // move itself always happens in the old color first.
    function recolor(id: string, variant: Variant) {
      commit((cols) => {
        for (const key of ['todo', 'sent', 'interview'] as const) {
          const idx = cols[key].findIndex((c) => c.id === id);
          if (idx !== -1) cols[key][idx] = { ...cols[key][idx], variant };
        }
      });
    }

    function fadeOut(id: string, done: () => void) {
      const board = boardRef.current;
      const leavingEl = board?.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);
      if (leavingEl && !reduceMotion) {
        leavingEl.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.65, 0, 0.35, 1)';
        leavingEl.style.opacity = '0';
        leavingEl.style.transform = 'scale(0.92)';
        timeoutsRef.current.push(setTimeout(done, EXIT_DURATION));
      } else {
        done();
      }
    }

    // Which card within a column moves next — not always the oldest
    // (top) one, alternating between top/middle/bottom keeps it from
    // reading as a fixed, predictable conveyor.
    function pickIndex(len: number) {
      return Math.floor(Math.random() * len);
    }

    // Un cycle qui revient toujours à l'état de base exact (2 À faire /
    // 3 Envoyé / 2 Entretien), chaque offre se déplaçant une par une,
    // jamais deux en même temps, et pas toujours la même position dans
    // la colonne (parfois celle du haut, parfois du milieu, parfois du
    // bas) :
    //   1. une nouvelle offre apparaît dans "À faire" (3)
    //   2. une offre déjà en "Entretien" en sort — Entretien passe à 1
    //   3. une offre "Envoyé" glisse vers "Entretien" — Entretien revient
    //      à 2, Envoyé passe à 2
    //   4. une offre "À faire" glisse vers "Envoyé" — retour à l'état de
    //      base (2/3/2)
    function beat1() {
      commit((cols) => { cols.todo.push(makeCard(cycleRef.current++)); });
      timeoutsRef.current.push(setTimeout(beat2, BEAT_PAUSE));
    }
    function beat2() {
      const idx = pickIndex(pipelineRef.current.interview.length);
      const placed = pipelineRef.current.interview[idx];
      fadeOut(placed.id, () => {
        commit((cols) => { cols.interview.splice(idx, 1); });
        timeoutsRef.current.push(setTimeout(beat3, BEAT_PAUSE));
      });
    }
    function beat3() {
      const idx = pickIndex(pipelineRef.current.sent.length);
      const promoted = pipelineRef.current.sent[idx];
      commit((cols) => {
        cols.sent.splice(idx, 1);
        // Still amber here — recolored to green only once it lands (below).
        cols.interview.push({ ...promoted, interviewPill: PILL_DATES[dateIdxRef.current++ % PILL_DATES.length] });
      });
      timeoutsRef.current.push(setTimeout(() => {
        recolor(promoted.id, 'green');
        setRevealedPills((prevSet) => new Set(prevSet).add(promoted.id));
      }, 1100));
      timeoutsRef.current.push(setTimeout(beat4, BEAT_PAUSE));
    }
    function beat4() {
      const idx = pickIndex(pipelineRef.current.todo.length);
      const promoted = pipelineRef.current.todo[idx];
      commit((cols) => {
        cols.todo.splice(idx, 1);
        cols.sent.push(promoted);
      });
      timeoutsRef.current.push(setTimeout(() => {
        recolor(promoted.id, 'amber');
      }, 1100));
      timeoutsRef.current.push(setTimeout(beat1, BEAT_PAUSE));
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timeoutsRef.current.push(setTimeout(beat1, BEAT_PAUSE));
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Runs after every render where `columns` changed — by then the DOM
  // already reflects the new column contents, so getBoundingClientRect
  // here reads the "Last" position for every card still on screen.
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cardEls = board.querySelectorAll<HTMLElement>('[data-flip-id]');
    cardEls.forEach((el) => {
      const id = el.dataset.flipId!;
      const last = el.getBoundingClientRect();
      const first = rectsRef.current.get(id);
      if (reduceMotion) {
        rectsRef.current.set(id, last);
        return;
      }
      if (first) {
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          // Two rAFs: one to let the transform above actually paint
          // before the transition is re-enabled, one to then trigger it —
          // a single rAF can land before that first paint on some
          // browsers and the "from" state never renders, skipping
          // straight to the end position with no visible motion.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.transition = 'transform 1.1s cubic-bezier(0.65, 0, 0.35, 1)';
              el.style.transform = '';
            });
          });
        }
      } else {
        el.style.transition = 'none';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.92) translateY(18px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.9s ease, transform 0.9s cubic-bezier(0.34, 1.4, 0.64, 1)';
            el.style.opacity = '1';
            el.style.transform = '';
          });
        });
      }
      rectsRef.current.set(id, last);
    });
  }, [columns]);

  return (
    <div className="landing-kanban-board" ref={boardRef} style={boardMinHeight ? { minHeight: boardMinHeight } : undefined}>
      <GaugeBoard gaugeRef={(el) => { gaugeRef.current = el; }} />
      <div className="column">
        <div className="column-header column-header--slate">
          <Icon name="circle-dashed" />
          <span className="column-header-label">À faire</span>
          <span className="column-header-count">{columns.todo.length}</span>
        </div>
        <div className="card-list">
          {columns.todo.map((card) => <Card key={card.id} card={card} pillRevealed={false} />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--amber">
          <Icon name="hourglass" />
          <span className="column-header-label">Envoyé</span>
          <span className="column-header-count">{columns.sent.length}</span>
        </div>
        <div className="card-list">
          {columns.sent.map((card) => <Card key={card.id} card={card} pillRevealed={false} />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--green">
          <Icon name="target" />
          <span className="column-header-label">Entretien</span>
          <span className="column-header-count">{columns.interview.length}</span>
        </div>
        <div className="card-list">
          {columns.interview.map((card) => (
            <Card key={card.id} card={card} pillRevealed={revealedPills.has(card.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
