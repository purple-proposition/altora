'use client';

import { useLayoutEffect, useRef, useState } from 'react';

// A small odometer-style digit swap: when `value` changes, the old
// number slides out and the new one slides in from the opposite edge —
// upward when the count increases, downward when it decreases (the
// standard convention for counters, matching how most native "badge
// count" UIs animate). Purely presentational; callers just pass the
// current number.
export default function AnimatedCount({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const [pending, setPending] = useState<{ from: number; dir: 1 | -1 } | null>(null);
  const prevValueRef = useRef(value);
  const containerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    if (value === prevValueRef.current) return;
    const dir: 1 | -1 = value > prevValueRef.current ? 1 : -1;
    setPending({ from: prevValueRef.current, dir });
    prevValueRef.current = value;
    setDisplay(value);
  }, [value]);

  useLayoutEffect(() => {
    if (!pending) return;
    const el = containerRef.current;
    const oldEl = el?.querySelector<HTMLElement>('.animated-count-old');
    const newEl = el?.querySelector<HTMLElement>('.animated-count-new');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!oldEl || !newEl || reduceMotion) {
      setPending(null);
      return;
    }
    oldEl.style.transition = 'none';
    newEl.style.transition = 'none';
    oldEl.style.transform = 'translateY(0%)';
    newEl.style.transform = `translateY(${pending.dir * 100}%)`;
    // Two rAFs: one to let the "from" state above actually paint before
    // the transition is re-enabled, one to then trigger it.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        oldEl.style.transition = 'transform 0.4s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.4s ease';
        newEl.style.transition = 'transform 0.4s cubic-bezier(0.65, 0, 0.35, 1)';
        oldEl.style.transform = `translateY(${-pending.dir * 100}%)`;
        oldEl.style.opacity = '0';
        newEl.style.transform = 'translateY(0%)';
      });
    });
    const timeoutId = setTimeout(() => setPending(null), 450);
    return () => clearTimeout(timeoutId);
  }, [pending]);

  return (
    <span className={`animated-count${className ? ` ${className}` : ''}`} ref={containerRef}>
      {pending ? (
        <>
          <span className="animated-count-digit animated-count-old">{pending.from}</span>
          <span className="animated-count-digit animated-count-new">{display}</span>
        </>
      ) : (
        <span className="animated-count-digit">{display}</span>
      )}
    </span>
  );
}
