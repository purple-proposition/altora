'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';
import BorderBeam from '@/components/BorderBeam';

// Same one-shot-reveal pattern as CountUpPercent: observe once, disconnect
// immediately, then run the animation logic, so scrolling back up and down
// never replays it.
const STEPS = [
  { icon: 'map-pin', label: "Ville de l'école", result: "Offres récupérées uniquement sur les villes où l'école est implantée." },
  { icon: 'calendar-clock', label: "Rythme d'alternance", result: "Seules les offres compatibles avec le rythme défini par l'école sont conservées." },
  { icon: 'graduation-cap', label: 'Niveau requis', result: "L'agent IA analyse la fiche de poste pour estimer le niveau requis pour le poste." },
] as const;

export default function MatchingAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [activeCount, setActiveCount] = useState(0);
  const [offerRevealed, setOfferRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        STEPS.forEach((_, i) => {
          timeouts.push(setTimeout(() => setActiveCount(i + 1), 400 * (i + 1)));
        });
        timeouts.push(setTimeout(() => setOfferRevealed(true), 400 * (STEPS.length + 1) + 300));
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-matching-card" ref={ref}>
      <div className="landing-matching-steps">
        {STEPS.map((step, i) => (
          <div key={step.label} className={`landing-matching-step${i < activeCount ? ' is-active' : ''}`}>
            <div className="landing-matching-step-icon">
              <Icon name={step.icon} />
            </div>
            <div className="landing-matching-step-body">
              <p className="landing-matching-step-result">{step.result}</p>
            </div>
          </div>
        ))}
      </div>
      <div className={`landing-matching-offer${offerRevealed ? ' is-revealed' : ''}`}>
        <BorderBeam size="pulse-inner" colorVariant="violet" strength={0.6}>
          <div className="card card--slate">
            <div className="landing-matching-offer-top">
              <span className="card-personalized-badge">
                <Icon name="sparkles" />
                Spécialement pour vous
              </span>
              <span className="card-link card-link--generate">
                <Icon name="sparkles" />
                Générer CV
              </span>
            </div>
            <div className="card-heading">
              <span className="card-title">Alternance Marketing Digital</span>
              <span className="card-heading-sep"> chez </span>
              <span className="card-company">L&apos;Oréal</span>
            </div>
            <div className="card-meta-row">
              <span className="card-meta-item">
                <Icon name="map-pin" />
                Clichy
              </span>
            </div>
            <div className="card-link-row">
              <span className="card-link">
                <Icon name="external-link" />
                Voir l&apos;offre
              </span>
            </div>
          </div>
        </BorderBeam>
      </div>
    </div>
  );
}
