'use client';

import { useEffect, useRef, useState } from 'react';

// Fades/slides a section in the first time it enters the viewport (see
// .reveal/.reveal--visible in tracker.css). One-shot: once visible, stays
// visible on scroll back up, matching the common landing-page pattern
// instead of re-triggering every time.
export default function Reveal({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    // Safari's "Export as PDF" renders the page without ever actually
    // scrolling it, so sections below the fold never intersect and stay
    // invisible forever — a blank gap instead of content. This fallback
    // reveals everything anyway after a couple of seconds regardless of
    // intersection, so any tool that renders the page and waits (export,
    // a crawler, a screenshot tool) eventually gets the real content;
    // real visitors will have scrolled well before this fires.
    const fallback = setTimeout(() => setVisible(true), 2000);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, []);

  return (
    <div ref={ref} id={id} className={`reveal ${visible ? 'reveal--visible' : ''} ${className}`}>
      {children}
    </div>
  );
}
