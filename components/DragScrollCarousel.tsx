'use client';

import { Children, cloneElement, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
// left behind to the opposite end) and re-measures where the item the
// user was actually resting on now sits, snapping scrollLeft exactly
// there — so the user just finds a "new" item to keep scrolling into,
// forever, in either direction, with nothing visibly jumping. Each child
// needs a stable `key` (its content identity, not its position) so React
// reuses the same component instance — and all its live state, timers,
// animation loops included — across the rotation instead of unmounting/
// remounting it. No cloned/duplicated markup anywhere: there are only
// ever as many DOM nodes as children passed in.
export default function DragScrollCarousel({ children, className, circular = false }: { children: React.ReactNode; className?: string; circular?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const scrollTrackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allKeys = Children.toArray(children).map((child) =>
    typeof child === 'object' && child !== null && 'key' in child ? String(child.key) : ''
  );
  const [order, setOrder] = useState<string[]>(allKeys);
  // The key of whichever item the user is actually resting on right
  // before a rotation — consumed by the layout effect below, which
  // re-measures THAT item's exact position in the newly-reordered DOM
  // and snaps scrollLeft precisely there. Deliberately a re-measurement,
  // not a precomputed delta: a delta assumes the shifted item's width +
  // gap is exact to the pixel, and mandatory scroll-snap has zero
  // tolerance for being even slightly off — it'll "correct" straight
  // past the intended item to whichever one the small error actually
  // landed closest to. Measuring the real item after the fact can't
  // accumulate that kind of drift.
  const pendingRestKeyRef = useRef<string | null>(null);
  // Cooldown rather than an index/key comparison: right after a
  // rotation the DOM reorders, so comparing indices would misread that
  // reorder itself as fresh user movement and could re-trigger
  // immediately. A short time window is simpler and sufficient here.
  const lastRotateAtRef = useRef(0);

  const byKey = new Map(
    Children.toArray(children).map((child) => [
      typeof child === 'object' && child !== null && 'key' in child ? String(child.key) : '',
      child,
    ])
  );
  const orderedChildren = order.map((key) => {
    const child = byKey.get(key);
    if (!child || !isValidElement(child)) return child;
    // Own attribute rather than reusing `key` (not a real DOM attribute,
    // can't be read back via querySelector) — this is what lets the
    // layout effect find "the item I was resting on" again after a
    // reorder without depending on index.
    return cloneElement(child, { 'data-carousel-key': key } as Record<string, unknown>);
  });

  function scrollPaddingLeftOf(el: HTMLDivElement) {
    return parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
  }

  function targetFor(el: HTMLDivElement, item: HTMLElement) {
    const containerLeft = el.getBoundingClientRect().left;
    const itemLeft = item.getBoundingClientRect().left - containerLeft + el.scrollLeft;
    return itemLeft - scrollPaddingLeftOf(el);
  }

  function findNearestItem(el: HTMLDivElement) {
    const items = Array.from(el.children) as HTMLElement[];
    if (!items.length) return null;
    let nearestIndex = 0;
    let nearestTarget = 0;
    let nearestDistance = Infinity;
    items.forEach((item, index) => {
      const target = targetFor(el, item);
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
  // Deliberately checked against how close scrollLeft is to the LAST/
  // FIRST item's own specific snap target — not "is the first/last item
  // nearest" (nearest is true across the *entire first half* of the
  // approach to that item, so that check rotated backward on
  // essentially every scroll starting from rest), and not the
  // container's raw scrollWidth-clientWidth either: with
  // scroll-snap-type:mandatory, the browser's own true reachable max is
  // whichever the last item's snap target is, which can sit short of
  // that raw geometric max (e.g. trailing padding added so the last
  // item's target is reachable at all can itself extend scrollWidth
  // past that target) — comparing to the geometric max then never
  // matched the position mandatory snap actually settles the container
  // at, and rotation never fired going forward.
  function maybeRotate() {
    if (!circular) return;
    const el = ref.current;
    if (!el) return;
    if (Date.now() - lastRotateAtRef.current < 300) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (items.length <= 1) return;
    const EPSILON = 4;
    const lastTarget = targetFor(el, items[items.length - 1]);
    const firstTarget = targetFor(el, items[0]);
    if (Math.abs(el.scrollLeft - lastTarget) <= EPSILON) {
      lastRotateAtRef.current = Date.now();
      pendingRestKeyRef.current = order[order.length - 1];
      setOrder((prev) => [...prev.slice(1), prev[0]]);
    } else if (Math.abs(el.scrollLeft - firstTarget) <= EPSILON) {
      lastRotateAtRef.current = Date.now();
      pendingRestKeyRef.current = order[0];
      setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
    }
  }

  // Re-measures the item the user was actually resting on in the
  // newly-reordered DOM and snaps scrollLeft exactly to its target the
  // instant the reorder paints — so the rotation itself is invisible,
  // and immune to any width/gap rounding a precomputed delta could have
  // drifted on.
  useLayoutEffect(() => {
    const el = ref.current;
    const key = pendingRestKeyRef.current;
    if (!el || !key) return;
    pendingRestKeyRef.current = null;
    const restEl = el.querySelector<HTMLElement>(`[data-carousel-key="${key}"]`);
    if (!restEl) return;
    el.scrollLeft = targetFor(el, restEl);
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
