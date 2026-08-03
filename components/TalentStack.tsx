'use client';

import { useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon';

// Fixed cyclic order — clicking the left/right card rotates which one
// is "front" instead of the fan being purely decorative.
const TALENTS = [
  {
    name: 'Inès',
    degree: 'Bachelor Marketing Digital',
    city: 'Paris',
    photo: '/landing-preview-avatar-2.jpg',
    skills: ['SEO', 'Réseaux sociaux', 'Growth'],
  },
  {
    name: 'Camille',
    degree: 'Bachelor Business Development',
    city: 'Lyon',
    photo: '/landing-preview-avatar.jpg',
    skills: ['Suite Adobe', 'Relations clients', 'Communication'],
  },
  {
    name: 'Thomas',
    degree: 'Master of Science Business Management & Growth Strategy',
    city: 'Bordeaux',
    photo: '/landing-preview-avatar-3.jpg',
    skills: ['Analyse de données', 'Stratégie', 'Anglais courant'],
  },
];

function TalentCard({ talent, role, onSelect }: { talent: typeof TALENTS[number]; role: 'left' | 'front' | 'right'; onSelect?: () => void }) {
  const clickable = role !== 'front';
  return (
    <div
      className={`landing-talent-card landing-talent-card--${role}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `Voir le profil de ${talent.name}` : undefined}
      onClick={clickable ? onSelect : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(); } } : undefined}
    >
      <div className="landing-talent-photo">
        <Image src={talent.photo} alt={talent.name} fill sizes="200px" />
        <span className="landing-talent-tag landing-talent-tag--location">{talent.city}</span>
      </div>
      <div className="landing-talent-body">
        <div className="landing-talent-name">{talent.name}</div>
        <div className="landing-talent-degree">{talent.degree}</div>
        <div className="landing-talent-skills">
          {talent.skills.map((skill) => (
            <span key={skill} className="inline-pill inline-pill--slate">{skill}</span>
          ))}
        </div>
      </div>
      <div className="landing-talent-footer">
        <span className="landing-talent-action"><Icon name="file-text" />CV</span>
        <span className="landing-talent-action"><Icon name="external-link" />LinkedIn</span>
        <span className="landing-talent-action"><Icon name="mail" />Email</span>
      </div>
    </div>
  );
}

export default function TalentStack() {
  const [activeIndex, setActiveIndex] = useState(1);
  const n = TALENTS.length;
  const leftIndex = (activeIndex - 1 + n) % n;
  const rightIndex = (activeIndex + 1) % n;

  return (
    <div className="landing-talent-stack">
      <TalentCard talent={TALENTS[leftIndex]} role="left" onSelect={() => setActiveIndex(leftIndex)} />
      <TalentCard talent={TALENTS[rightIndex]} role="right" onSelect={() => setActiveIndex(rightIndex)} />
      <TalentCard talent={TALENTS[activeIndex]} role="front" />
    </div>
  );
}
