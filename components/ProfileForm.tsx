'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserProfile, Experience, Formation } from '@/lib/profile';

function emptyExperience(): Experience {
  return { company: '', title: '', dates: '', bullets: [''] };
}
function emptyFormation(): Formation {
  return { school: '', degree: '', dates: '', bullets: [] };
}

const areaClass = 'block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900';
const selectClass = 'block h-11 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 text-base text-neutral-900 outline-none focus:border-neutral-900';

// Section en carte : titre, aide facultative, contenu.
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-6">
      <div>
        <h2 className="text-base font-semibold text-neutral-950">{title}</h2>
        {hint && <p className="mt-1 text-sm text-neutral-500">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

// Champ : label au-dessus, contrôle, aide ou erreur en dessous.
function Field({ label, htmlFor, hint, error, children }: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-sm text-red-600">{error}</p> : hint ? <p className="text-sm text-neutral-500">{hint}</p> : null}
    </div>
  );
}

const Row = ({ children }: { children: React.ReactNode }) => <div className="grid gap-4 sm:grid-cols-2">{children}</div>;

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
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState('');

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

  // La civilité n'est jamais déduite du CV et pilote l'accord de tous les
  // documents générés. C'est le seul champ dont l'absence bloque l'enregistrement.
  const missingCivility = !profile.civility;
  const isJob = profile.soughtContract === 'cdi' || profile.soughtContract === 'cdd';
  const needsSchool = profile.soughtContract === '' || profile.soughtContract === 'alternance' || profile.soughtContract === 'stage';

  async function handleSave() {
    if (missingCivility) {
      setShowErrors(true);
      document.getElementById('profile-civility')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        setSaveError("L'enregistrement a échoué. Réessaie.");
        return;
      }
      const { profile: next } = await res.json();
      setProfile(next);
      setSaved(true);
      onSaved?.(next);
    } catch {
      setSaveError("L'enregistrement a échoué. Réessaie.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Section title="Identité">
        <Row>
          <Field label="Nom complet" htmlFor="p-name">
            <Input id="p-name" value={profile.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="Email" htmlFor="p-email">
            <Input id="p-email" type="email" value={profile.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field label="Téléphone" htmlFor="p-phone">
            <Input id="p-phone" type="tel" value={profile.phone} onChange={e => set('phone', e.target.value)} />
          </Field>
          <Field label="Ville" htmlFor="p-city">
            <Input id="p-city" value={profile.city} onChange={e => set('city', e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field
            label="Civilité *"
            htmlFor="profile-civility"
            hint="Décide de l'accord du CV et de la lettre."
            error={showErrors && missingCivility ? 'Choisis une civilité pour continuer.' : undefined}
          >
            <select
              id="profile-civility"
              className={cn(selectClass, showErrors && missingCivility && 'border-red-500')}
              value={profile.civility}
              onChange={e => { set('civility', e.target.value as typeof profile.civility); setShowErrors(false); }}
            >
              <option value="">À choisir</option>
              <option value="Mme">Féminin</option>
              <option value="M">Masculin</option>
            </select>
          </Field>
          <Field label="LinkedIn" htmlFor="p-linkedin">
            <Input id="p-linkedin" value={profile.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/…" />
          </Field>
        </Row>
        <Field label="Portfolio ou site" htmlFor="p-portfolio">
          <Input id="p-portfolio" value={profile.portfolio} onChange={e => set('portfolio', e.target.value)} />
        </Field>
      </Section>

      <Section title="Ta recherche">
        <Row>
          <Field label="Type de contrat recherché" htmlFor="p-contract">
            <select
              id="p-contract"
              className={selectClass}
              value={profile.soughtContract}
              onChange={e => set('soughtContract', e.target.value as typeof profile.soughtContract)}
            >
              <option value="">Non précisé</option>
              <option value="alternance">Alternance</option>
              <option value="stage">Stage</option>
              <option value="cdi">CDI</option>
              <option value="cdd">CDD</option>
            </select>
          </Field>
          {needsSchool && (
            <Field label="École ou organisme de formation" htmlFor="p-school">
              <Input id="p-school" value={profile.school} onChange={e => set('school', e.target.value)} />
            </Field>
          )}
        </Row>
        <Row>
          <Field label={isJob ? 'Disponibilité' : 'Début souhaité'} htmlFor="p-availability">
            <Input
              id="p-availability"
              value={profile.availability}
              onChange={e => set('availability', e.target.value)}
              placeholder={isJob ? 'immédiate, 1 mois de préavis…' : 'septembre 2026…'}
            />
          </Field>
          {profile.soughtContract === 'alternance' && (
            <Field label="Rythme d'alternance" htmlFor="p-rhythm">
              <Input id="p-rhythm" value={profile.rhythm} onChange={e => set('rhythm', e.target.value)} placeholder="4 jours entreprise / 1 jour école" />
            </Field>
          )}
        </Row>
      </Section>

      <Section title="Profil" hint="2 ou 3 phrases qui résument ton parcours.">
        <textarea className={areaClass} rows={3} value={profile.profil} onChange={e => set('profil', e.target.value)} />
      </Section>

      <Section title="Expériences">
        {profile.experiences.map((exp, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl bg-neutral-50 p-4">
            <Row>
              <Field label="Entreprise">
                <Input value={exp.company} onChange={e => updateExperience(i, { company: e.target.value })} />
              </Field>
              <Field label="Intitulé">
                <Input value={exp.title} onChange={e => updateExperience(i, { title: e.target.value })} />
              </Field>
            </Row>
            <Field label="Dates">
              <Input value={exp.dates} onChange={e => updateExperience(i, { dates: e.target.value })} placeholder="MM/AAAA – Présent" />
            </Field>
            <Field label="Points clés" hint="Un point par ligne.">
              <textarea
                className={areaClass}
                rows={4}
                value={exp.bullets.join('\n')}
                onChange={e => updateExperience(i, { bullets: e.target.value.split('\n') })}
              />
            </Field>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => set('experiences', profile.experiences.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={14} />Supprimer
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" className="self-start" onClick={() => set('experiences', [...profile.experiences, emptyExperience()])}>
          <Plus size={16} />Ajouter une expérience
        </Button>
      </Section>

      <Section title="Formation">
        {profile.formation.map((f, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl bg-neutral-50 p-4">
            <Row>
              <Field label="École">
                <Input value={f.school} onChange={e => updateFormation(i, { school: e.target.value })} />
              </Field>
              <Field label="Diplôme">
                <Input value={f.degree} onChange={e => updateFormation(i, { degree: e.target.value })} />
              </Field>
            </Row>
            <Field label="Dates">
              <Input value={f.dates} onChange={e => updateFormation(i, { dates: e.target.value })} placeholder="MM/AAAA – Présent" />
            </Field>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => set('formation', profile.formation.filter((_, idx) => idx !== i))}
            >
              <Trash2 size={14} />Supprimer
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" className="self-start" onClick={() => set('formation', [...profile.formation, emptyFormation()])}>
          <Plus size={16} />Ajouter une formation
        </Button>
      </Section>

      <Section title="Compétences, outils, langues" hint="Éléments séparés par « · ».">
        <Field label="Compétences">
          <textarea className={areaClass} rows={2} value={profile.competences} onChange={e => set('competences', e.target.value)} placeholder="SEO · Réseaux sociaux · Emailing…" />
        </Field>
        <Field label="Outils">
          <textarea className={areaClass} rows={2} value={profile.outils} onChange={e => set('outils', e.target.value)} placeholder="Canva · Google Analytics…" />
        </Field>
        <Field label="Langues" hint="Niveaux en toutes lettres.">
          <Input value={profile.langues} onChange={e => set('langues', e.target.value)} placeholder="Français · langue maternelle · Anglais · courant" />
        </Field>
        <Field label="Centres d'intérêt">
          <textarea className={areaClass} rows={2} value={profile.interests} onChange={e => set('interests', e.target.value)} />
        </Field>
      </Section>

      <Section
        title="Consignes personnalisées"
        hint="Tes propres règles pour la génération (style, formulations à éviter, faits à ne pas mélanger). Les règles générales sont déjà appliquées."
      >
        <textarea className={areaClass} rows={5} value={profile.customInstructions} onChange={e => set('customInstructions', e.target.value)} />
      </Section>

      <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center gap-4 border-t border-neutral-200 bg-neutral-50/95 px-6 py-4 backdrop-blur">
        <Button type="button" onClick={handleSave} disabled={saving}>
          {saving ? savingLabel : submitLabel}
        </Button>
        {showErrors && missingCivility && <span className="text-sm text-red-600">Il manque la civilité.</span>}
        {saveError && <span className="text-sm text-red-600">{saveError}</span>}
        {saved && !onSaved && <span className="text-sm text-neutral-500">Profil enregistré.</span>}
      </div>
    </div>
  );
}
