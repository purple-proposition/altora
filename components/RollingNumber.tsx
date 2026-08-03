'use client';

import { useEffect, useState } from 'react';

// Same "odometer" roll used by the real board's counters (rollNumber() in
// public/tracker.js): the old digit slides fully out — up if the value rose,
// down if it fell — while the new one slides in from the opposite edge,
// instead of just snapping to the new text.
export default function RollingNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const [anim, setAnim] = useState<{ from: number; rising: boolean } | null>(null);

  useEffect(() => {
    if (value === display) return;
    setAnim({ from: display, rising: value > display });
    setDisplay(value);
    const timeout = setTimeout(() => setAnim(null), 450);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!anim) {
    return <span className="landing-preview-count">{display}</span>;
  }

  return (
    <span className="landing-preview-count landing-preview-count-roll" key={`${anim.from}-${display}`}>
      <span className={`landing-preview-count-old ${anim.rising ? 'is-rising' : 'is-falling'}`}>{anim.from}</span>
      <span className={`landing-preview-count-new ${anim.rising ? 'is-rising' : 'is-falling'}`}>{display}</span>
    </span>
  );
}
