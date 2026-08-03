'use client';

import { useEffect, useRef, useState } from 'react';

// Counts up from 0 to `value` once the score card scrolls into view —
// one-shot, like Reveal (components/Reveal.tsx), rather than the
// scroll-position-tracked odometer roll used elsewhere on the landing
// page (RollingNumber), since there's no "before/after" state to roll
// between here, just a single number worth making an entrance.
export default function CountUpPercent({ value, duration = 900 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          setDisplay(Math.round(easeOutQuint(progress) * value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  // Same thresholds as the real ATS score card (GenerateForm.tsx's
  // scoreTone: >=80 good, >=60 mid, else low).
  const tone = value >= 80 ? 'good' : value >= 60 ? 'mid' : 'low';

  return <div className={`landing-match-score landing-match-score--${tone}`} ref={ref}>{display}%</div>;
}
