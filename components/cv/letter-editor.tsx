'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { LetterDoc } from '@/components/cv/letter-doc';

const areaClass = 'mt-2 block w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900';

// Éditeur de la lettre : objet, puis chaque paragraphe modifiable.
export function LetterEditor({ doc, onChange }: { doc: LetterDoc; onChange: (next: LetterDoc) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col">
        <Label>Intitulé du poste (objet)</Label>
        <Input className="mt-2" value={doc.poste} onChange={e => onChange({ ...doc, poste: e.target.value })} />
      </div>
      <div className="flex flex-col">
        <Label>Entreprise</Label>
        <Input className="mt-2" value={doc.company} onChange={e => onChange({ ...doc, company: e.target.value })} />
      </div>
      {doc.paragraphs.map((p, i) => (
        <div key={i} className="flex flex-col">
          <Label>Paragraphe {i + 1}</Label>
          <textarea
            className={areaClass}
            rows={4}
            value={p}
            onChange={e => onChange({ ...doc, paragraphs: doc.paragraphs.map((x, k) => (k === i ? e.target.value : x)) })}
          />
        </div>
      ))}
    </div>
  );
}
