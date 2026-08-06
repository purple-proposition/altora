'use client';

import { Children, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { trackEvent } from '@/lib/gtag';

// Native horizontal scroll only responds to touch/trackpad swipes, not a
// mouse click-and-drag, this adds that "grab and drag" interaction (mouse
// click, drag left/right, scrollLeft follows) on top of the standard CSS
// Scroll Snap carousel (scroll-snap-type/-align on .landing-showcase-carousel
// and .landing-showcase-carousel-item in tracker.css).
//
// This used to hand-roll its own step size (a fraction of window width) and
// its own requestAnimationFrame easing, snapping on a timer after every
// scroll event. That custom math is what kept breaking: it drifted out of
// sync with the real card width whenever the carousel's content changed
// (e.g. adding the documents mockup), and fought the browser's native
// scroll-snap/anchoring in ways that showed up as "starts on the wrong
// card after reload" and "doesn't feel smooth". Letting the browser own
// snapping (CSS) and measuring real card positions from the DOM instead of
// a formula removes that whole class of bug, touch/trackpad scrolling
// snaps natively with zero JS, and mouse-drag only needs a plain
// scrollTo(behavior: 'smooth') to the nearest actual card on release.
//
// `circular`: when set, resting on the first or last item silently rotates
// which item is physically first/last in the DOM (moving the one just
// left behind to the opposite end) and compensates scrollLeft by exactly
// that item's own width so nothing visibly jumps — the user just finds a
// "new" item to keep scrolling into, forever, in either direction. Each
// child needs a stable `key` (its content identity, not its position) so
// React reuses the same component instance — and all its live state,
// timers, animation loops included — across the rotation instead of
// unmounting/remounting it. No cloned/duplicated markup anywhere: there
// are only ever as many DOM nodes as children passed in.
export default function DragScrollCarousel({ children, className, circular = false }: { children: React.ReactNode; className?: string; circular?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const scrollTrackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allKeys = Children.toArray(children).map((child) =>
    typeof child === 'object' && child !== null && 'key' in child ? String(child.key) : ''
  );
  const [order, setOrder] = useState<string[]>(allKeys);
  // Set right before an order rotation, consumed by the layout effect
  // below to shift scrollLeft by exactly the rotated item's own size —
  // measured before the DOM reorders, since items here aren't uniform
  // width (kanban/messaging/calendar/documents all differ).
  const pendingShiftRef = useRef(0);
  // Cooldown rather than an index/key comparison: right after a
  // rotation the DOM reorders, so "nearest.index" for the very same
  // physical item changes too — comparing indices would misread that
  // reorder itself as fresh user movement and could re-trigger
  // immediately. A short time window is simpler and sufficient here.
  const lastRotateAtRef = useRef(0);

  const byKey = new Map(
    Children.toArray(children).map((child) => [
      typeof child === 'object' && child !== null && 'key' in child ? String(child.key) : '',
      child,
    ])
  );
  const orderedChildren = order.map((key) => byKey.get(key));

  function findNearestItem(el: HTMLDivElement) {
    const items = Array.from(el.children) as HTMLElement[];
    if (!items.length) return null;
    // offsetLeft is relative to the nearest *positioned* ancestor, which
    // isn't necessarily this scroll container, getBoundingClientRect
    // gives each item's true position relative to the container's own
    // scrollable content regardless of who its offsetParent is.
    const containerLeft = el.getBoundingClientRect().left;
    // scroll-snap-align: start on each item snaps its edge to the
    // container's scroll-padding-left inset, not to scrollLeft: 0, the
    // target here has to match that same offset, or this fights the
    // browser's own mandatory snap instead of landing on the same spot.
    const scrollPaddingLeft = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    let nearestIndex = 0;
    let nearestTarget = 0;
    let nearestDistance = Infinity;
    items.forEach((item, index) => {
      const itemLeft = item.getBoundingClientRect().left - containerLeft + el.scrollLeft;
      const target = itemLeft - scrollPaddingLeft;
      const distance = Math.abs(target - el.scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = target;
        nearestIndex = index;
      }
    });
    return { index: nearestIndex, target: nearestTarget, items };
  }

  function snapToNearestItem() {
    const el = ref.current;
    if (!el) return;
    const nearest = findNearestItem(el);
    if (!nearest) return;
    el.scrollTo({ left: nearest.target, behavior: 'smooth' });
  }

  // Called on every scroll tick, not debounced: waiting for scrolling to
  // fully stop (the ~150ms settle used for analytics below) meant that
  // continuing to scroll right past the last item — a single continuous
  // gesture, the common case — reached the genuine end and stalled
  // there for a beat before the rotation caught up, reading as the next
  // item "popping in late" instead of seamless. Checking eagerly, as
  // soon as the boundary is truly reached, rotates before the user can
  // out-scroll it.
  //
  // Deliberately checked against the container's own absolute scroll
  // position (scrollLeft <= 0 / >= max), NOT "is the first/last item
  // nearest" — nearest-item is true across the *entire first half* of
  // the approach to that item (e.g. item0 is "nearest" for any
  // scrollLeft under ~half the gap to item1), so that check rotated
  // backward on essentially every scroll starting from rest, not only
  // once genuinely past the edge. That's what read as chaotic/jumpy the
  // moment you started scrolling at all.
  function maybeRotate() {
    if (!circular) return;
    const el = ref.current;
    if (!el) return;
    if (Date.now() - lastRotateAtRef.current < 300) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (items.length <= 1) return;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const EPSILON = 2;
    if (el.scrollLeft >= maxScrollLeft - EPSILON) {
      lastRotateAtRef.current = Date.now();
      const shift = items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left;
      pendingShiftRef.current = -shift;
      setOrder((prev) => [...prev.slice(1), prev[0]]);
    } else if (el.scrollLeft <= EPSILON) {
      lastRotateAtRef.current = Date.now();
      const shift = items[items.length - 1].getBoundingClientRect().left - items[items.length - 2].getBoundingClientRect().left;
      pendingShiftRef.current = shift;
      setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
    }
  }

  // Compensates scrollLeft the instant the rotated order actually paints,
  // so the rotation itself is invisible — the resting item is still
  // exactly where the user left it, just no longer first/last in the DOM.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !pendingShiftRef.current) return;
    el.scrollLeft += pendingShiftRef.current;
    pendingShiftRef.current = 0;
  }, [order]);

  // Fires once per resting position, for touch/trackpad/keyboard scroll
  // (handled entirely by native CSS scroll-snap, no JS involved above) as
  // well as mouse-drag, debounced since 'scroll' fires continuously
  // while the browser's own snap animation is still settling.
  function onScroll() {
    const el = ref.current;
    if (!el) return;
    maybeRotate();
    if (scrollTrackTimer.current) clearTimeout(scrollTrackTimer.current);
    scrollTrackTimer.current = setTimeout(() => {
      const nearest = findNearestItem(el);
      if (nearest) trackEvent('carousel_scroll', { item_index: nearest.index });
    }, 150);
  }

  function onMouseDown(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    // Text in the caption below each mockup stays selectable, only a
    // mousedown that starts on the mockup itself begins a drag, so
    // click-dragging across the caption's text selects it instead of
    // panning the carousel.
    if ((e.target as HTMLElement).closest('.landing-showcase-caption')) return;
    drag.current = { active: true, moved: false, startX: e.clientX, startScroll: el.scrollLeft };
    el.classList.add('is-dragging');
  }

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    drag.current.moved = true;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  }

  function stopDrag() {
    if (!drag.current.active) return;
    drag.current.active = false;
    ref.current?.classList.remove('is-dragging');
    if (drag.current.moved) snapToNearestItem();
  }

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // scroll-snap-type stays off (see .carousel-snap-ready in tracker.css)
    // until this runs, and only turns on right after the last scrollLeft
    // reset below, otherwise the browser's own "snap to nearest point"
    // pass can fire while the web font and Cassandra's photo are still
    // loading and item positions are still shifting, landing the
    // carousel a card or two off the first card on reload instead of
    // resting on it. Reset at mount, again once fonts have actually
    // finished loading (the layout shift most likely to move things),
    // and once more shortly after so any late reflow from that font swap
    // is also settled before snapping turns on, a plain setTimeout
    // rather than requestAnimationFrame, since rAF never fires in a
    // backgrounded or not-yet-painted tab and would leave snap off.
    el.scrollLeft = 0;
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady
      .then(() => {
        if (!el) return;
        el.scrollLeft = 0;
        return new Promise((resolve) => setTimeout(resolve, 50));
      })
      .then(() => {
        if (!el) return;
        el.scrollLeft = 0;
        el.classList.add('carousel-snap-ready');
      });
    return () => {
      if (scrollTrackTimer.current) clearTimeout(scrollTrackTimer.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
      onScroll={onScroll}
    >
      {circular ? orderedChildren : children}
    </div>
  );
}
