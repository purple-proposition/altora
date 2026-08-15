'use client';
import Icon from '@/components/Icon';

import { useState } from 'react';
import type { UserProfile, Experience, Formation } from '@/lib/profile';

function emptyExperience(): Experience {
  return { company: '', title: '', dates: '', bullets: [''] };
}
function emptyFormation(): Formation {
  return { school: '', degree: '', dates: '', bullets: [] };
}

export default function ProfileForm({
  initialProfile,
  submitLabel = 'Enregistrer mon profil',
  savingLabel = 'Enregistrement…',
  onSaved,
}: {
  initialProfile: UserProfile;
  // Le même formulaire sert à deux moments : la vérification des informations
  // extraites du CV pendant l'onboarding, où il enchaîne sur l'import d'une
  // offre, et l'édition libre du profil ensuite. Seuls le libellé du bouton et
  // ce qui suit l'enregistrement changent.
  submitLabel?: string;
  savingLabel?: string;
  onSaved?: (profile: UserProfile) => void;
}) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile(p => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function updateExperience(i: number, patch: Partial<Experience>) {
    set('experiences', profile.experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function updateFormation(i: number, patch: Partial<Formation>) {
    set('formation', profile.formation.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const { profile: saved } = await res.json();
        setProfile(saved);
        setSaved(true);
        onSaved?.(saved);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="profile-form">
      <fieldset className="field-group">
        <legend className="field-label">Identité</legend>
        <div className="field-row">
          <label>Nom complet
            <input type="text" value={profile.name} onChange={e => set('name', e.target.value)} />
          </label>
          <label>Email
            <input type="email" value={profile.email} onChange={e => set('email', e.target.value)} />
          </label>
        </div>
        <div className="field-row">
          <label>Téléphone
            <input type="tel" value={profile.phone} onChange={e => set('phone', e.target.value)} />
          </label>
          <label>Ville
            <input type="text" value={profile.city} onChange={e => set('city', e.target.value)} />
          </label>
        </div>
        <div className="field-row">
          <label>Civilité <span className="field-hint">(pour l&apos;accord des intitulés)</span>
            <select value={profile.civility} onChange={e => set('civility', e.target.value as typeof profile.civility)}>
              <option value="">Non précisé</option>
              <option value="M">M.</option>
              <option value="Mme">Mme</option>
            </select>
          </label>
          <label>LinkedIn
            <input type="text" value={profile.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/..." />
          </label>
        </div>
        <label>Portfolio / site
          <input type="text" value={profile.portfolio} onChange={e => set('portfolio', e.target.value)} />
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-label">Profil / accroche</legend>
        <textarea rows={3} value={profile.profil} onChange={e => set('profil', e.target.value)} placeholder="2-3 phrases qui résument ton profil." />
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-label">Expériences</legend>
        {profile.experiences.map((exp, i) => (
          <div className="profile-exp-card" key={i}>
            <div className="field-row">
              <label>Entreprise
                <input type="text" value={exp.company} onChange={e => updateExperience(i, { company: e.target.value })} />
              </label>
              <label>Intitulé
                <input type="text" value={exp.title} onChange={e => updateExperience(i, { title: e.target.value })} />
              </label>
            </div>
            <label>Dates
              <input type="text" value={exp.dates} onChange={e => updateExperience(i, { dates: e.target.value })} placeholder="MM/AAAA – Présent" />
            </label>
            <label>Points clés (un par ligne)
              <textarea
                rows={4}
                value={exp.bullets.join('\n')}
                onChange={e => updateExperience(i, { bullets: e.target.value.split('\n') })}
              />
            </label>
            <button type="button" className="btn-remove-contact" onClick={() => set('experiences', profile.experiences.filter((_, idx) => idx !== i))}>
              Supprimer cette expérience
            </button>
          </div>
        ))}
        <button type="button" className="btn-add-contact" onClick={() => set('experiences', [...profile.experiences, emptyExperience()])}>
          <Icon name="plus" />Ajouter une expérience
        </button>
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-label">Formation</legend>
        {profile.formation.map((f, i) => (
          <div className="profile-exp-card" key={i}>
            <div className="field-row">
              <label>École
                <input type="text" value={f.school} onChange={e => updateFormation(i, { school: e.target.value })} />
              </label>
              <label>Diplôme
                <input type="text" value={f.degree} onChange={e => updateFormation(i, { degree: e.target.value })} />
              </label>
            </div>
            <label>Dates
              <input type="text" value={f.dates} onChange={e => updateFormation(i, { dates: e.target.value })} placeholder="MM/AAAA – Présent" />
            </label>
            <button type="button" className="btn-remove-contact" onClick={() => set('formation', profile.formation.filter((_, idx) => idx !== i))}>
              Supprimer cette formation
            </button>
          </div>
        ))}
        <button type="button" className="btn-add-contact" onClick={() => set('formation', [...profile.formation, emptyFormation()])}>
          <Icon name="plus" />Ajouter une formation
        </button>
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-label">Compétences, outils, langues</legend>
        <label>Compétences <span className="field-hint">(séparées par « · »)</span>
          <textarea rows={2} value={profile.competences} onChange={e => set('competences', e.target.value)} />
        </label>
        <label>Outils <span className="field-hint">(séparés par « · »)</span>
          <textarea rows={2} value={profile.outils} onChange={e => set('outils', e.target.value)} />
        </label>
        <label>Langues
          <input type="text" value={profile.langues} onChange={e => set('langues', e.target.value)} />
        </label>
      </fieldset>

      <fieldset className="field-group">
        <legend className="field-label">Consignes personnalisées</legend>
        <p className="field-hint">
          Tes propres règles pour la génération (style, formulations interdites, structure de la lettre, faits à ne
          jamais mélanger…). Les règles générales d&apos;écriture et d&apos;optimisation ATS sont déjà appliquées par
          défaut à tout le monde, n&apos;écris ici que ce qui t&apos;est propre.
        </p>
        <textarea
          rows={8}
          value={profile.customInstructions}
          onChange={e => set('customInstructions', e.target.value)}
          placeholder="ex: ne jamais mentionner tel outil sur telle expérience, toujours citer telle donnée chiffrée pour tel projet, disponibilité à formuler ainsi…"
        />
      </fieldset>

      <div className="profile-form-actions">
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </button>
        {saved && !onSaved && <span className="field-hint">Profil enregistré.</span>}
      </div>
    </div>
  );
}
