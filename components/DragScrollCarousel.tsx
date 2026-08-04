'use client';

import { useEffect, useRef } from 'react';

// Native horizontal scroll only responds to touch/trackpad swipes, not a
// mouse click-and-drag — this adds that "grab and drag" interaction (mouse
// click, drag left/right, scrollLeft follows) on top of the existing
// scroll-snap carousel, instead of relying on the visible scrollbar.
//
// Movement is quantized to exactly 3 grid columns per step (span(3) =
// 25vw - 30px, same k-columns formula used everywhere else on this page),
// whichever direction it's dragged or scrolled — not a per-card snap
// (cards aren't 3 columns wide) and not free-scroll. CSS scroll-snap can't
// express an arbitrary step like this, so it's done in JS: whatever
// gesture moved it (mouse drag or native touch/trackpad scroll), once
// movement stops we round the resting scrollLeft to the nearest multiple
// of that 3-column step and animate there ourselves (requestAnimationFrame
// + an eased curve) rather than the browser's own scrollTo(behavior:
// 'smooth'), whose easing is a plain linear-ish ramp on most engines —
// the animation below uses the same "premium" ease-out curve as the rest
// of the site's motion (cubic-bezier(0.32, 0.72, 0, 1)-equivalent).
export default function DragScrollCarousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animation = useRef<number | null>(null);

  function stepSize() {
    return window.innerWidth * 0.25 - 30;
  }

  // Cubic ease-out with no overshoot — fast start, gentle settle, matching
  // the site's other "organic" transitions instead of a linear scroll.
  function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }

  function animateTo(target: number) {
    const el = ref.current;
    if (!el) return;
    if (animation.current) cancelAnimationFrame(animation.current);
    const start = el.scrollLeft;
    const distance = target - start;
    const duration = 500;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = Math.min((now - startTime) / duration, 1);
      el!.scrollLeft = start + distance * easeOutCubic(elapsed);
      if (elapsed < 1) {
        animation.current = requestAnimationFrame(tick);
      } else {
        animation.current = null;
      }
    }
    animation.current = requestAnimationFrame(tick);
  }

  function snapToGrid() {
    const el = ref.current;
    if (!el) return;
    const step = stepSize();
    const target = Math.round(el.scrollLeft / step) * step;
    animateTo(target);
  }

  function onMouseDown(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    // Text in the caption below each mockup stays selectable — only a
    // mousedown that starts on the mockup itself begins a drag, so
    // click-dragging across the caption's text selects it instead of
    // panning the carousel.
    if ((e.target as HTMLElement).closest('.landing-showcase-caption')) return;
    if (animation.current) cancelAnimationFrame(animation.current);
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft };
    el.classList.add('is-dragging');
  }

  function onMouseMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el || !drag.current.active) return;
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
  }

  function stopDrag() {
    if (!drag.current.active) return;
    drag.current.active = false;
    ref.current?.classList.remove('is-dragging');
    snapToGrid();
  }

  // Covers touch/trackpad scrolling, which never goes through the mouse
  // handlers above: debounce native scroll events and snap once they've
  // been quiet for a beat, since there's no single "scroll finished"
  // native event supported everywhere yet.
  function onScroll() {
    if (drag.current.active || animation.current) return;
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(snapToGrid, 120);
  }

  useEffect(() => {
    const el = ref.current;
    // Guards against the browser's own scroll-anchoring: as web fonts and
    // images finish loading after first paint, layout shifts inside this
    // scroll container can make the browser silently adjust scrollLeft to
    // "keep the same content in view", landing the carousel a step or two
    // off zero on reload instead of resting at column 3 like it should.
    if (el) el.scrollLeft = 0;
    return () => {
      if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
      if (animation.current) cancelAnimationFrame(animation.current);
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
