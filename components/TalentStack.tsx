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

// Role is derived per talent (not per slot) so each card keeps its own
// identity across a swap — React reconciles by the `key` below, so the
// same DOM node/photo just gets a new transform to animate to instead
// of two slots instantly exchanging their content mid-transition.
function roleFor(index: number, activeIndex: number, n: number): 'left' | 'front' | 'right' {
  const diff = ((index - activeIndex) % n + n) % n;
  if (diff === 0) return 'front';
  if (diff === 1) return 'right';
  return 'left';
}

export default function TalentStack() {
  const [activeIndex, setActiveIndex] = useState(1);
  const n = TALENTS.length;

  return (
    <div className="landing-talent-stack">
      {TALENTS.map((talent, i) => (
        <TalentCard
          key={talent.name}
          talent={talent}
          role={roleFor(i, activeIndex, n)}
          onSelect={() => setActiveIndex(i)}
        />
      ))}
    </div>
  );
}
