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
// of that 3-column step and animate there.
export default function DragScrollCarousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });
  const scrollEndTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function stepSize() {
    return window.innerWidth * 0.25 - 30;
  }

  function snapToGrid() {
    const el = ref.current;
    if (!el) return;
    const step = stepSize();
    const target = Math.round(el.scrollLeft / step) * step;
    el.scrollTo({ left: target, behavior: 'smooth' });
  }

  function onMouseDown(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
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
    if (drag.current.active) return;
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
    scrollEndTimer.current = setTimeout(snapToGrid, 120);
  }

  useEffect(() => () => {
    if (scrollEndTimer.current) clearTimeout(scrollEndTimer.current);
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
