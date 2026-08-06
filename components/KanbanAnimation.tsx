'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import AnimatedCount from '@/components/AnimatedCount';
import { useCalendarSync } from '@/components/CalendarSyncContext';

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

type PillInfo = { text: string; day: number };

// `day` (the nudged, real day-of-month) is what HeroCalendar's own
// CalendarSyncContext lookup matches against — both mockups compute the
// nudge from the same DAY_ANCHORS, so they always agree on which real
// date an interview pill refers to.
function buildPillDates(): PillInfo[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  // Nudging each anchor independently isn't quite enough on its own: two
  // anchors a few days apart can both land on the same weekday after
  // their own nudge and collide. `usedDays` keeps every date already
  // claimed so a colliding anchor keeps stepping forward (skipping
  // weekends too) until it lands on a genuinely free weekday.
  const usedDays = new Set<number>();
  return DAY_ANCHORS.map((day, i) => {
    const d = new Date(year, month, day);
    while (d.getDay() === 0 || d.getDay() === 6 || usedDays.has(d.getDate())) d.setDate(d.getDate() + 1);
    usedDays.add(d.getDate());
    return { text: `Le ${d.getDate()} ${MONTHS_FR[d.getMonth()]} à ${HOURS[i]}`, day: d.getDate() };
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
    interview: [0, 1].map((c) => ({ ...makeCard(c, 'green'), interviewPill: PILL_DATES[c % PILL_DATES.length].text })),
    sent: [2, 3, 4].map((c) => makeCard(c, 'amber')),
    todo: [5, 6].map((c) => makeCard(c, 'slate')),
  };
}

const BEAT_PAUSE = 2600;
const EXIT_DURATION = 400;
const MOVE_DURATION = 400;
// recolor() must fire strictly after the move's own inline transition has
// been released (see releaseTransitionAfter) — releasing it is what lets
// the CSS class's "background 1s linear" transition actually take over.
// Firing recolor at exactly MOVE_DURATION races that release (which
// itself lands a beat late, via transitionend + a small fallback
// margin), so the color swap would land while the inline style still
// read "transition: transform ...", skipping it straight to the end
// color with no visible fade. This margin comfortably clears that.
const RECOLOR_DELAY = MOVE_DURATION + 200;
const ENTRANCE_DURATION = 400;

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
          {[6, 7, 8].map((i) => <Card key={i} card={{ ...gaugeCard(i, 'green'), interviewPill: PILL_DATES[i % PILL_DATES.length].text }} pillRevealed />)}
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
  const calendarSync = useCalendarSync();

  // The two interview cards present at mount need to register with the
  // calendar too, not just the ones beat3 adds later — otherwise the
  // calendar starts empty until the first cycle catches up.
  useEffect(() => {
    const initialInterview = columns.interview;
    initialInterview.forEach((card, i) => {
      calendarSync?.addEvent({ id: card.id, day: PILL_DATES[i % PILL_DATES.length].day, label: card.company });
    });
    return () => {
      initialInterview.forEach((card) => calendarSync?.removeEvent(card.id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  // Coordonnées relatives au plateau, pas un DOMRect viewport — voir
  // l'explication dans commit().
  const firstRectsRef = useRef<Map<string, { left: number; top: number }>>(new Map());
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
        // Mesuré RELATIVEMENT au plateau, jamais en coordonnées viewport.
        // Le carrousel qui contient ce mockup (DragScrollCarousel) réécrit
        // un translateX à chaque frame pendant un défilement, et les deux
        // moitiés d'un FLIP sont séparées par une frontière de commit React
        // (commit() part d'un setTimeout, l'effet de layout s'exécute dans
        // une autre tâche) : au moins un rAF passe entre les deux, donc en
        // coordonnées viewport le delta contiendrait systématiquement la
        // distance parcourue par le carrousel, et chaque carte partirait
        // avec un saut latéral. En soustrayant une origine lue dans la même
        // tâche que la mesure, la translation d'ancêtre se simplifie
        // exactement.
        const origin = board.getBoundingClientRect();
        movedIds.forEach((id) => {
          const cardEl = board.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);
          if (!cardEl) return;
          const r = cardEl.getBoundingClientRect();
          firstRectsRef.current.set(id, { left: r.left - origin.left, top: r.top - origin.top });
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

    // Takes the leaving card out of flex flow immediately (position
    // fixed to its current on-screen spot via absolute positioning),
    // then fades it in place — the SAME instant, not after. Pulling it
    // out of flow is what lets the remaining cards in that column
    // reflow to their final position right away too, so both the fade
    // and the sibling shift run in the same 0.4s window instead of the
    // shift waiting for the fade to finish first (which read as two
    // separate beats instead of one steady rhythm).
    function fadeOutAndReflow(id: string, siblingIds: string[], done: () => void) {
      const board = boardRef.current;
      const leavingEl = board?.querySelector<HTMLElement>(`[data-flip-id="${id}"]`);
      if (!leavingEl || reduceMotion) {
        done();
        return;
      }
      const firsts = new Map<string, DOMRect>();
      siblingIds.forEach((sid) => {
        const el = board?.querySelector<HTMLElement>(`[data-flip-id="${sid}"]`);
        if (el) firsts.set(sid, el.getBoundingClientRect());
      });

      const rect = leavingEl.getBoundingClientRect();
      const parentRect = leavingEl.parentElement!.getBoundingClientRect();
      leavingEl.style.position = 'absolute';
      leavingEl.style.top = `${rect.top - parentRect.top}px`;
      leavingEl.style.left = `${rect.left - parentRect.left}px`;
      leavingEl.style.width = `${rect.width}px`;
      leavingEl.style.transition = `opacity ${EXIT_DURATION}ms ease, transform ${EXIT_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1)`;
      leavingEl.style.opacity = '0';
      leavingEl.style.transform = 'scale(0.92)';

      // Pulling the leaving card out of flow just reflowed the siblings
      // synchronously — measure their new position now and FLIP them
      // from the rects captured above, in parallel with the fade.
      siblingIds.forEach((sid) => {
        const el = board?.querySelector<HTMLElement>(`[data-flip-id="${sid}"]`);
        const first = firsts.get(sid);
        if (!el || !first) return;
        const last = el.getBoundingClientRect();
        const dy = first.top - last.top;
        if (Math.abs(dy) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translateY(${dy}px)`;
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.transition = `transform ${MOVE_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1)`;
              el.style.transform = '';
            });
          });
        }
      });

      timeoutsRef.current.push(setTimeout(done, EXIT_DURATION));
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
      // Removed from the calendar the moment the card starts leaving —
      // same instant as its own exit animation begins, not after.
      calendarSync?.removeEvent(placed.id);
      fadeOutAndReflow(placed.id, remainingIds, () => {
        // Siblings already sit at their final position (fadeOutAndReflow
        // moved them there itself) — no movedIds here, this commit is
        // just catching React's state up to what's already on screen.
        commit((cols) => { cols.interview.splice(idx, 1); });
        timeoutsRef.current.push(setTimeout(beat3, BEAT_PAUSE));
      });
    }
    function beat3() {
      const idx = pickIndex(pipelineRef.current.sent.length);
      const promoted = pipelineRef.current.sent[idx];
      const remainingIds = idsExcept(pipelineRef.current.sent, idx);
      const pillInfo = PILL_DATES[dateIdxRef.current++ % PILL_DATES.length];
      commit((cols) => {
        cols.sent.splice(idx, 1);
        // Still amber here — recolored to green only once it lands.
        cols.interview.push({ ...promoted, interviewPill: pillInfo.text });
      }, [...remainingIds, promoted.id]);
      // Added to the calendar at the same moment the card starts sliding
      // into "Entretien", not once it has settled — matches beat2's exit
      // timing so both mockups move together.
      calendarSync?.addEvent({ id: promoted.id, day: pillInfo.day, label: promoted.company });
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
    // Origine fraîche, lue dans cette tâche-ci : c'est ce qui annule la
    // translation du carrousel, qui a pu bouger depuis la mesure "First".
    const origin = board.getBoundingClientRect();

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
      const lastRect = cardEl.getBoundingClientRect();
      const dx = first.left - (lastRect.left - origin.left);
      const dy = first.top - (lastRect.top - origin.top);
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
