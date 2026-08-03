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
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={`reveal ${visible ? 'reveal--visible' : ''} ${className}`}>
      {children}
    </div>
  );
}
