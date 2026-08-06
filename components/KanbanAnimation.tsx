'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import AnimatedCount from '@/components/AnimatedCount';

// Unlike the site's other one-shot mockups (CountUpPercent, MatchingAnimation),
// this one is a perpetual loop: it starts once the board scrolls into view,
// then keeps cycling forever through a fixed 4-beat sequence that always
// returns to its exact starting counts (2 À faire / 3 Envoyé / 2 Entretien),
// so it reads as a constant, steady workflow instead of a one-off demo that
// resets. Only one offer moves at a time, never several at once, and which
// card within a column moves isn't always the same position (top/middle/
// bottom all happen).
//
// Card movement is a manual FLIP (First, Last, Invert, Play), but scoped
// per-beat rather than board-wide: each beat explicitly lists which card
// ids it's touching (the one moving, plus any siblings that shift to fill
// the gap it leaves behind) via commit()'s `movedIds` argument. Only those
// ids get measured and transformed. Earlier versions re-measured every card
// on the board on every state change — including cards mid-transition from
// an unrelated, still-in-flight beat — which could catch a card at its
// current animated (not resting) position and "correct" it against the
// wrong baseline, sending it to an absurd offset. Scoping to exactly the
// ids each beat names removes that class of bug entirely: a card is only
// ever measured/transformed by the beat that actually moves it.
type Variant = 'slate' | 'amber' | 'green';

type CardData = {
  id: string;
  schoolBadge?: boolean;
  title: string;
  company: string;
  location: string;
  interviewPill?: string;
  // The card's own displayed color — kept as the column it came from while
  // sliding, only switched to the destination color once it has actually
  // landed (see the recolor() calls in beat3/beat4). recolor() is a plain
  // DOM class swap, not a state commit: it never touches `columns`, so it
  // can never trigger the FLIP effect below or interfere with an in-flight
  // move.
  variant: Variant;
};

type Columns = { todo: CardData[]; sent: CardData[]; interview: CardData[] };

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

function makeCard(cycle: number, variant: Variant): CardData {
  const t = POOL[cycle % POOL.length];
  return { id: `${t.company}-${t.title}-${cycle}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), variant, ...t };
}

// Starting point: 2 in "À faire", 3 in "Envoyé", 2 in "Entretien" — the
// loop below always returns here exactly, so it can repeat forever
// without ever drifting or needing a reset.
function initialColumns(): Columns {
  return {
    interview: [0, 1].map((c) => ({ ...makeCard(c, 'green'), interviewPill: PILL_DATES[c % PILL_DATES.length] })),
    sent: [2, 3, 4].map((c) => makeCard(c, 'amber')),
    todo: [5, 6].map((c) => makeCard(c, 'slate')),
  };
}

const BEAT_PAUSE = 2600;
const EXIT_DURATION = 500;
const MOVE_DURATION = 1100;
// recolor() must fire strictly after the move's own inline transition has
// been released (see releaseTransitionAfter) — releasing it is what lets
// the CSS class's "background 1s linear" transition actually take over.
// Firing recolor at exactly MOVE_DURATION races that release (which
// itself lands a beat late, via transitionend + a small fallback
// margin), so the color swap would land while the inline style still
// read "transition: transform ...", skipping it straight to the end
// color with no visible fade. This margin comfortably clears that.
const RECOLOR_DELAY = MOVE_DURATION + 200;
const ENTRANCE_DURATION = 900;

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
        <span className={`card-link card-link--generate${card.variant !== 'slate' ? ' is-hidden' : ''}`}><Icon name="sparkles" />Générer CV</span>
      </div>
      {card.interviewPill && (
        <span className={`card-interview-pill landing-kanban-pill${pillRevealed ? ' is-revealed' : ''}`}>
          <Icon name="calendar" />{card.interviewPill}
        </span>
      )}
    </div>
  );
}

// Distinct ids from the real cards: makeCard()'s id is derived only from
// the pool template + cycle number, and the gauge would otherwise reuse
// the same cycles as the real initial columns, colliding on the same
// data-flip-id. The FLIP/entrance logic below explicitly skips any id
// starting with "gauge-", so this hidden board never gets measured or
// animated at all.
function gaugeCard(cycle: number, variant: Variant): CardData {
  return { ...makeCard(cycle, variant), id: `gauge-${cycle}` };
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
          {[0, 1, 2].map((i) => <Card key={i} card={gaugeCard(i, 'slate')} pillRevealed />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--amber">
          <Icon name="hourglass" /><span className="column-header-label">Envoyé</span><span className="column-header-count">0</span>
        </div>
        <div className="card-list">
          {[3, 4, 5].map((i) => <Card key={i} card={gaugeCard(i, 'amber')} pillRevealed />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--green">
          <Icon name="target" /><span className="column-header-label">Entretien</span><span className="column-header-count">0</span>
        </div>
        <div className="card-list">
          {[6, 7, 8].map((i) => <Card key={i} card={{ ...gaugeCard(i, 'green'), interviewPill: PILL_DATES[i % PILL_DATES.length] }} pillRevealed />)}
        </div>
      </div>
    </div>
  );
}

export default function KanbanAnimation() {
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [revealedPills, setRevealedPills] = useState<Set<string>>(() => new Set(initialColumns().interview.map((c) => c.id)));
  const [boardMinHeight, setBoardMinHeight] = useState<number | undefined>(undefined);
  const boardRef = useRef<HTMLDivElement>(null);
  const gaugeRef = useRef<HTMLDivElement>(null);

  // Mutable pipeline state read/written synchronously by the beat loop —
  // React state (`columns`) mirrors it for rendering, but the loop's own
  // scheduling never depends on when a render actually commits.
  const pipelineRef = useRef<Columns>(columns);
  const cycleRef = useRef(7);
  const dateIdxRef = useRef(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ids the FLIP effect is allowed to touch for the commit about to
  // render, and their pre-mutation ("First") rects — populated by
  // commit() right before it mutates, consumed and cleared by the effect
  // right after. Any card whose id isn't in this set is left completely
  // untouched by that render, however many other cards changed around it.
  const movedIdsRef = useRef<Set<string>>(new Set());
  const firstRectsRef = useRef<Map<string, DOMRect>>(new Map());
  // ids ever rendered — anything not in here yet is a brand-new card and
  // gets the fade/scale-in entrance instead of a FLIP move. Pre-seeded
  // with the starting cards so the mockup is already fully in place,
  // static, the moment it scrolls into view — only offers added later by
  // the loop itself (beat1) get the entrance animation.
  const seenIdsRef = useRef<Set<string>>(new Set([...columns.todo, ...columns.sent, ...columns.interview].map((c) => c.id)));

  useLayoutEffect(() => {
    if (!gaugeRef.current) return;
    setBoardMinHeight(gaugeRef.current.getBoundingClientRect().height);
  }, []);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // `movedIds` lists every card this particular change is allowed to
    // reposition — the one moving, plus any siblings left behind in its
    // old column that shift to close the gap. Rects for those ids are
    // captured here, synchronously, before the mutation, so the FLIP
    // effect has an accurate "First" position to animate from.
    function commit(mutate: (cols: Columns) => void, movedIds: string[] = []) {
      const board = boardRef.current;
      if (board) {
        movedIds.forEach((id) => {
          const cardEl = board.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);
          if (cardEl) firstRectsRef.current.set(id, cardEl.getBoundingClientRect());
        });
      }
      movedIdsRef.current = new Set(movedIds);
      const next: Columns = {
        todo: pipelineRef.current.todo.slice(),
        sent: pipelineRef.current.sent.slice(),
        interview: pipelineRef.current.interview.slice(),
      };
      mutate(next);
      pipelineRef.current = next;
      setColumns(next);
    }

    // A real commit (not a DOM hack): both the background color and the
    // "Générer CV" collapse are driven declaratively off card.variant in
    // the Card component/CSS, so they survive a card remounting into a
    // different column's own <div className="card-list"> (React treats
    // that as a fresh element, not the same node moved — any styling
    // applied by directly poking the DOM would be lost the moment that
    // happens, then reappear once poked again, which is exactly the
    // flash previously seen on "Générer CV" when a card changed column).
    // Passing no movedIds means this render leaves every card's position
    // alone — safe now that the FLIP effect only ever touches ids it's
    // explicitly told to.
    function recolor(id: string, variant: Variant) {
      commit((cols) => {
        for (const key of ['todo', 'sent', 'interview'] as const) {
          const idx = cols[key].findIndex((c) => c.id === id);
          if (idx !== -1) cols[key][idx] = { ...cols[key][idx], variant };
        }
      });
    }

    function fadeOut(id: string, done: () => void) {
      const leavingEl = boardRef.current?.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);
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
    // (top) one; alternating between top/middle/bottom keeps it from
    // reading as a fixed, predictable conveyor.
    function pickIndex(len: number) {
      return Math.floor(Math.random() * len);
    }

    function idsExcept(cards: CardData[], idx: number) {
      return cards.filter((_, i) => i !== idx).map((c) => c.id);
    }

    // A fixed 4-beat loop, always returning to the exact starting counts
    // (2 À faire / 3 Envoyé / 2 Entretien), one offer moving at a time:
    //   1. a fresh offer appears in "À faire" (3)
    //   2. an offer already in "Entretien" leaves — Entretien drops to 1
    //   3. an "Envoyé" offer slides into "Entretien" — back to 2, Envoyé
    //      drops to 2
    //   4. an "À faire" offer slides into "Envoyé" — back to the starting
    //      counts (2/3/2)
    function beat1() {
      commit((cols) => { cols.todo.push(makeCard(cycleRef.current++, 'slate')); });
      timeoutsRef.current.push(setTimeout(beat2, BEAT_PAUSE));
    }
    function beat2() {
      const idx = pickIndex(pipelineRef.current.interview.length);
      const placed = pipelineRef.current.interview[idx];
      const remainingIds = idsExcept(pipelineRef.current.interview, idx);
      fadeOut(placed.id, () => {
        commit((cols) => { cols.interview.splice(idx, 1); }, remainingIds);
        timeoutsRef.current.push(setTimeout(beat3, BEAT_PAUSE));
      });
    }
    function beat3() {
      const idx = pickIndex(pipelineRef.current.sent.length);
      const promoted = pipelineRef.current.sent[idx];
      const remainingIds = idsExcept(pipelineRef.current.sent, idx);
      commit((cols) => {
        cols.sent.splice(idx, 1);
        // Still amber here — recolored to green only once it lands.
        cols.interview.push({ ...promoted, interviewPill: PILL_DATES[dateIdxRef.current++ % PILL_DATES.length] });
      }, [...remainingIds, promoted.id]);
      timeoutsRef.current.push(setTimeout(() => {
        recolor(promoted.id, 'green');
        setRevealedPills((prevSet) => new Set(prevSet).add(promoted.id));
      }, RECOLOR_DELAY));
      timeoutsRef.current.push(setTimeout(beat4, BEAT_PAUSE));
    }
    function beat4() {
      const idx = pickIndex(pipelineRef.current.todo.length);
      const promoted = pipelineRef.current.todo[idx];
      const remainingIds = idsExcept(pipelineRef.current.todo, idx);
      commit((cols) => {
        cols.todo.splice(idx, 1);
        cols.sent.push(promoted);
      }, [...remainingIds, promoted.id]);
      timeoutsRef.current.push(setTimeout(() => {
        recolor(promoted.id, 'amber');
      }, RECOLOR_DELAY));
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

  // Runs after every render where `columns` changed. Two independent
  // things happen here, and neither touches a card outside its own case:
  //   - any id in movedIdsRef (set by the commit that just ran) gets its
  //     "Last" rect measured and FLIP-animated from the "First" rect
  //     commit() captured beforehand.
  //   - any id never seen before gets a fade/scale-in entrance instead.
  // A card touched by neither is left completely alone, so a move that's
  // still mid-transition from an earlier beat can never get re-measured
  // and "corrected" by a later, unrelated commit.
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const moved = movedIdsRef.current;
    const firsts = firstRectsRef.current;

    board.querySelectorAll<HTMLElement>('[data-flip-id]').forEach((cardEl) => {
      const id = cardEl.dataset.flipId!;
      if (id.startsWith('gauge-')) return;

      const isNew = !seenIdsRef.current.has(id);
      seenIdsRef.current.add(id);
      if (reduceMotion) return;

      // Once the transform/opacity transition below finishes, the inline
      // `transition` is cleared back to '' — leaving it pinned to
      // "transform ...ms ..." (or "opacity ...ms ..., transform ...ms
      // ...") would otherwise permanently shadow the CSS class's own
      // `background 1s linear` transition (inline styles always win over
      // a stylesheet rule), which is why the color swap looked instant
      // no matter how the CSS was tuned: every card that had ever moved
      // or entered still had a stale inline transition blocking it.
      function releaseTransitionAfter(duration: number) {
        const timeoutId = setTimeout(clear, duration + 80);
        cardEl.addEventListener('transitionend', clear, { once: true });
        function clear() {
          clearTimeout(timeoutId);
          cardEl.removeEventListener('transitionend', clear);
          cardEl.style.transition = '';
        }
      }

      if (isNew) {
        cardEl.style.transition = 'none';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.92) translateY(18px)';
        // Two rAFs: one to let the "from" state above actually paint
        // before the transition is re-enabled, one to then trigger it —
        // a single rAF can land before that first paint on some
        // browsers and skip straight to the end state with no motion.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            cardEl.style.transition = `opacity ${ENTRANCE_DURATION}ms ease, transform ${ENTRANCE_DURATION}ms cubic-bezier(0.34, 1.4, 0.64, 1)`;
            cardEl.style.opacity = '1';
            cardEl.style.transform = '';
            releaseTransitionAfter(ENTRANCE_DURATION);
          });
        });
        return;
      }

      if (!moved.has(id)) return;
      const first = firsts.get(id);
      if (!first) return;
      const last = cardEl.getBoundingClientRect();
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        cardEl.style.transition = 'none';
        cardEl.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            cardEl.style.transition = `transform ${MOVE_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1)`;
            cardEl.style.transform = '';
            releaseTransitionAfter(MOVE_DURATION);
          });
        });
      }
    });

    movedIdsRef.current = new Set();
    firsts.clear();
  }, [columns]);

  return (
    <div className="landing-kanban-board" ref={boardRef} style={boardMinHeight ? { minHeight: boardMinHeight } : undefined}>
      <GaugeBoard gaugeRef={(el) => { gaugeRef.current = el; }} />
      <div className="column">
        <div className="column-header column-header--slate">
          <Icon name="circle-dashed" />
          <span className="column-header-label">À faire</span>
          <AnimatedCount className="column-header-count" value={columns.todo.length} />
        </div>
        <div className="card-list">
          {columns.todo.map((card) => <Card key={card.id} card={card} pillRevealed={false} />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--amber">
          <Icon name="hourglass" />
          <span className="column-header-label">Envoyé</span>
          <AnimatedCount className="column-header-count" value={columns.sent.length} />
        </div>
        <div className="card-list">
          {columns.sent.map((card) => <Card key={card.id} card={card} pillRevealed={false} />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--green">
          <Icon name="target" />
          <span className="column-header-label">Entretien</span>
          <AnimatedCount className="column-header-count" value={columns.interview.length} />
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
