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
      // Le seuil de 15 % attendait qu'une section soit deja bien installee
      // dans la fenetre avant de la reveler : sur les sections hautes, le
      // mockup faisait six cents pixels, on la voyait donc arriver eteinte
      // puis s'allumer sous les yeux. On declenche maintenant des que le
      // haut de la section franchit 88 % de la hauteur de fenetre, c'est a
      // dire juste avant qu'elle ne devienne lisible : l'animation se joue
      // pendant la montee et la section est deja posee quand on la lit.
      { threshold: 0, rootMargin: '0px 0px -12% 0px' }
    );
    observer.observe(el);
    // Safari's "Export as PDF" renders the page without ever actually
    // scrolling it, so sections below the fold never intersect and stay
    // invisible forever, a blank gap instead of content. This fallback
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
