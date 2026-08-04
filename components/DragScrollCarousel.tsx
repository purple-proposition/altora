'use client';

import { useRef } from 'react';
import Icon from '@/components/Icon';

// Native horizontal scroll only responds to touch/trackpad swipes, not a
// mouse click-and-drag — this adds that "grab and drag" interaction (mouse
// click, drag left/right, scrollLeft follows) on top of the existing
// scroll-snap carousel, instead of relying on the visible scrollbar. The
// prev/next buttons step by exactly 3 grid columns (span(3) = 25vw - 30px,
// same k-columns formula as every other grid-relative measurement on this
// page) rather than a full page or a single card, so the amount scrolled
// stays tied to the same 12-column grid regardless of viewport width.
export default function DragScrollCarousel({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, startScroll: 0 });

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
    drag.current.active = false;
    ref.current?.classList.remove('is-dragging');
  }

  function step(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const threeColumns = window.innerWidth * 0.25 - 30;
    el.scrollBy({ left: direction * threeColumns, behavior: 'smooth' });
  }

  return (
    <div className="drag-scroll-carousel">
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
      <div className="drag-scroll-carousel-controls">
        <button type="button" className="drag-scroll-carousel-btn" aria-label="Précédent" onClick={() => step(-1)}>
          <Icon name="chevron-left" />
        </button>
        <button type="button" className="drag-scroll-carousel-btn" aria-label="Suivant" onClick={() => step(1)}>
          <Icon name="chevron-right" />
        </button>
      </div>
    </div>
  );
}
