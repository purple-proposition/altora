'use client';

import { useEffect, useRef } from 'react';

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

  function snapToNearestItem() {
    const el = ref.current;
    if (!el) return;
    const items = Array.from(el.children) as HTMLElement[];
    if (!items.length) return;
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
    let nearestTarget = 0;
    let nearestDistance = Infinity;
    for (const item of items) {
      const itemLeft = item.getBoundingClientRect().left - containerLeft + el.scrollLeft;
      const target = itemLeft - scrollPaddingLeft;
      const distance = Math.abs(target - el.scrollLeft);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestTarget = target;
      }
    }
    el.scrollTo({ left: nearestTarget, behavior: 'smooth' });
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
    // Guards against the browser's own scroll-anchoring: as web fonts
    // finish loading after first paint, layout shifts inside this scroll
    // container can make the browser silently adjust scrollLeft, landing
    // the carousel a card off zero on reload instead of resting on the
    // first card. Reset once at mount and again once fonts have actually
    // finished loading, since that's the layout shift most likely to
    // trigger it here.
    el.scrollLeft = 0;
    document.fonts?.ready?.then(() => {
      if (el) el.scrollLeft = 0;
    });
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={stopDrag}
      onMouseLeave={stopDrag}
    >
      {children}
    </div>
  );
}
