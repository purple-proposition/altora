'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

// Decorative counter for the landing hero's dashboard mockup: "offres à
// postuler" ticks down and "entretien" ticks up once the mockup scrolls
// into view, and reverts when it scrolls back out — a cheap way to imply
// "this board moves" without a real animation timeline. IntersectionObserver
// (not scroll direction tracking) drives it: entering the viewport downward
// or upward both just flip the same in/out boolean, which already produces
// the forward/reverse effect the user asked for.
export default function LandingPreviewStats() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setRevealed(entry.isIntersecting),
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const todo = revealed ? 7 : 8;
  const interview = revealed ? 2 : 1;

  return (
    <p className="landing-preview-greeting-text" ref={ref}>
      <span className="landing-preview-period">Aujourd&apos;hui<Icon name="chevron-down" /></span>, tu as{' '}
      <span className="inline-pill inline-pill--slate">
        <Icon name="circle-dashed" />
        <span key={todo} className="landing-preview-count">{todo}</span>
      </span>{' '}
      offres à postuler,{' '}
      <span className="inline-pill inline-pill--amber"><Icon name="hourglass" />4</span> envoyées,{' '}
      <span className="inline-pill inline-pill--green">
        <Icon name="target" />
        <span key={interview} className="landing-preview-count">{interview}</span>
      </span>{' '}
      entretien et <span className="inline-pill inline-pill--rose"><Icon name="folder-x" />0</span> refus.
    </p>
  );
}
