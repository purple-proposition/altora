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
    // Il y avait ici un repli qui revelait la section au bout de deux
    // secondes, quelle que soit sa position, pour les outils qui rendent
    // la page sans jamais la faire defiler. Il annulait en fait toute
    // l'animation : un visiteur qui reste plus de deux secondes sur le
    // titre trouve, quand il commence a defiler, une page entierement
    // revelee d'avance. Mesure faite en production, defilement a zero sur
    // sept mille cinq cents pixels de contenu, les dix sections etaient
    // deja visibles, y compris la derniere.
    //
    // Le cas d'origine, l'export PDF de Safari, passe par les styles
    // d'impression : la regle @media print de tracker.css force deja
    // l'affichage, sans JavaScript et sans delai. Le cas sans script est
    // couvert par le <noscript> du layout.
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} id={id} className={`reveal ${visible ? 'reveal--visible' : ''} ${className}`}>
      {children}
    </div>
  );
}
