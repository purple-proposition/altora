'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/gtag';

// Native horizontal scroll only responds to touch/trackpad swipes, not a
// mouse click-and-drag — this adds that "grab and drag" interaction (mouse
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
// a formula removes that whole class of bug — touch/trackpad scrolling
// snaps natively with zero JS, and mouse-drag only needs a plain
// scrollTo(behavior: 'smooth') to the nearest actual card on release.
export default function DragScrollCarousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 });
  const scrollTrackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared by the drag-release snap and the scroll-tracking below: which
  // item is currently closest to resting position, and how far its own
  // snap target is from scrollLeft right now.
  function findNearestItem(el: HTMLDivElement) {
    // The tail item (e.g. "Mes documents") is CSS scroll-snap-align:none
    // — it should never become a resting point of its own, so it's
    // excluded here too, matching the browser's own native snap behavior.
    const items = (Array.from(el.children) as HTMLElement[]).filter(
      (item) => !item.classList.contains('landing-showcase-carousel-item--tail')
    );
    if (!items.length) return null;
    // offsetLeft is relative to the nearest *positioned* ancestor, which
    // isn't necessarily this scroll container — getBoundingClientRect
    // gives each item's true position relative to the container's own
    // scrollable content regardless of who its offsetParent is.
    const containerLeft = el.getBoundingClientRect().left;
    // scroll-snap-align: start on each item snaps its edge to the
    // container's scroll-padding-left inset, not to scrollLeft: 0 — the
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
    return { index: nearestIndex, target: nearestTarget };
  }

  function snapToNearestItem() {
    const el = ref.current;
    if (!el) return;
    const nearest = findNearestItem(el);
    if (!nearest) return;
    el.scrollTo({ left: nearest.target, behavior: 'smooth' });
  }

  // Fires once per resting position, for touch/trackpad/keyboard scroll
  // (handled entirely by native CSS scroll-snap, no JS involved above) as
  // well as mouse-drag — debounced since 'scroll' fires continuously
  // while the browser's own snap animation is still settling.
  function onScroll() {
    const el = ref.current;
    if (!el) return;
    if (scrollTrackTimer.current) clearTimeout(scrollTrackTimer.current);
    scrollTrackTimer.current = setTimeout(() => {
      const nearest = findNearestItem(el);
      if (nearest) trackEvent('carousel_scroll', { item_index: nearest.index });
    }, 150);
  }

  function onMouseDown(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    // Text in the caption below each mockup stays selectable — only a
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
    // reset below — otherwise the browser's own "snap to nearest point"
    // pass can fire while the web font and Cassandra's photo are still
    // loading and item positions are still shifting, landing the
    // carousel a card or two off the first card on reload instead of
    // resting on it. Reset at mount, again once fonts have actually
    // finished loading (the layout shift most likely to move things),
    // and once more shortly after so any late reflow from that font swap
    // is also settled before snapping turns on — a plain setTimeout
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
      {children}
    </div>
  );
}
