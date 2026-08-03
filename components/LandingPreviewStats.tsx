'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import RollingNumber from '@/components/RollingNumber';

// Decorative counter for the landing hero's dashboard mockup: "offres à
// postuler" ticks down and "entretien" ticks up once the user scrolls the
// page down a bit, and reverts when they scroll back up — a cheap way to
// imply "this board moves" without a real animation timeline.
//
// Tracks the actual scroll position of .landing-card (not
// IntersectionObserver on visibility) — the hero + mockup already fit
// entirely inside the initial viewport on most screens, so an observer
// watching "is this element visible" would report true from the very
// first paint and never toggle as the user scrolls. A scrollTop threshold
// only flips once the user has actually scrolled past it, in either
// direction.
export default function LandingPreviewStats() {
  const ref = useRef<HTMLParagraphElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const scrollContainer = ref.current?.closest('.landing-card') as HTMLElement | null;
    if (!scrollContainer) return;
    const onScroll = () => setRevealed(scrollContainer.scrollTop > 80);
    onScroll();
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', onScroll);
  }, []);

  const todo = revealed ? 7 : 8;
  const interview = revealed ? 2 : 1;

  return (
    <p className="landing-preview-greeting-text" ref={ref}>
      <span className="landing-preview-period">Aujourd&apos;hui<Icon name="chevron-down" /></span>, tu as{' '}
      <span className="inline-pill inline-pill--slate">
        <Icon name="circle-dashed" />
        <RollingNumber value={todo} />
      </span>{' '}
      offres à postuler,{' '}
      <span className="inline-pill inline-pill--amber"><Icon name="hourglass" />4</span> envoyées,{' '}
      <span className="inline-pill inline-pill--green">
        <Icon name="target" />
        <RollingNumber value={interview} />
      </span>{' '}
      entretien et <span className="inline-pill inline-pill--rose"><Icon name="folder-x" />0</span> refus.
    </p>
  );
}
