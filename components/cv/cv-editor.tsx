'use client';

import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { CvDoc } from '@/components/cv/cv-doc';

const areaClass = 'mt-2 block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900';

// Champ étiqueté, utilisé partout dans le panneau d'édition.
function Text({ label, value, onChange, multiline = false }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <Label>{label}</Label>
      {multiline ? (
        <textarea className={areaClass} rows={3} value={value} onChange={e => onChange(e.target.value)} />
      ) : (
        <Input className="mt-2" value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

// Bouton d'affichage : un élément masqué disparaît de l'aperçu et de l'export.
function VisibilityToggle({ hidden, onToggle, label }: { hidden: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={hidden ? `Afficher ${label}` : `Masquer ${label}`}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-medium',
        hidden ? 'border-neutral-300 text-neutral-500' : 'border-neutral-300 text-neutral-900 hover:bg-neutral-100',
      )}
    >
      {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
      {hidden ? 'Masqué' : 'Affiché'}
    </button>
  );
}

export function CvEditor({ doc, onChange }: { doc: CvDoc; onChange: (next: CvDoc) => void }) {
  const set = <K extends keyof CvDoc>(key: K, value: CvDoc[K]) => onChange({ ...doc, [key]: value });

  function updateExp(i: number, patch: Partial<CvDoc['experiences'][number]>) {
    set('experiences', doc.experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }
  function updateBullet(i: number, j: number, patch: Partial<{ text: string; hidden: boolean }>) {
    const exp = doc.experiences[i];
    updateExp(i, { bullets: exp.bullets.map((b, k) => (k === j ? { ...b, ...patch } : b)) });
  }
  function updateFormation(i: number, patch: Partial<CvDoc['formation'][number]>) {
    set('formation', doc.formation.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-900">Intitulé et profil</h3>
        <Text label="Titre sous le nom" value={doc.title} onChange={v => set('title', v)} />
        <Text label="Profil" value={doc.profil} onChange={v => set('profil', v)} multiline />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-900">Expériences</h3>
        {doc.experiences.map((exp, i) => (
          <div key={i} className={cn('flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4', exp.hidden && 'opacity-60')}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">{exp.title || exp.company || `Expérience ${i + 1}`}</span>
              <VisibilityToggle hidden={exp.hidden} onToggle={() => updateExp(i, { hidden: !exp.hidden })} label="cette expérience" />
            </div>
            <Text label="Intitulé" value={exp.title} onChange={v => updateExp(i, { title: v })} />
            <Text label="Entreprise" value={exp.company} onChange={v => updateExp(i, { company: v })} />
            <Text label="Dates" value={exp.dates} onChange={v => updateExp(i, { dates: v })} />
            <div className="flex flex-col gap-3">
              <Label>Points clés</Label>
              {exp.bullets.map((b, j) => (
                <div key={j} className={cn('flex items-start gap-3', b.hidden && 'opacity-60')}>
                  <textarea className={cn(areaClass, 'mt-0 min-h-[60px]')} rows={2} value={b.text} onChange={e => updateBullet(i, j, { text: e.target.value })} />
                  <VisibilityToggle hidden={b.hidden} onToggle={() => updateBullet(i, j, { hidden: !b.hidden })} label="ce point" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-900">Formation</h3>
        {doc.formation.map((f, i) => (
          <div key={i} className={cn('flex flex-col gap-3 rounded-2xl border border-neutral-200 p-4', f.hidden && 'opacity-60')}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-neutral-700">{f.degree || f.school || `Formation ${i + 1}`}</span>
              <VisibilityToggle hidden={f.hidden} onToggle={() => updateFormation(i, { hidden: !f.hidden })} label="cette formation" />
            </div>
            <Text label="Diplôme" value={f.degree} onChange={v => updateFormation(i, { degree: v })} />
            <Text label="École" value={f.school} onChange={v => updateFormation(i, { school: v })} />
            <Text label="Dates" value={f.dates} onChange={v => updateFormation(i, { dates: v })} />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-900">Compétences, outils, langues</h3>
        <Text label="Compétences" value={doc.competences} onChange={v => set('competences', v)} multiline />
        <Text label="Outils" value={doc.outils} onChange={v => set('outils', v)} multiline />
        <Text label="Langues" value={doc.langues} onChange={v => set('langues', v)} />
      </section>
    </div>
  );
}
