'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CvDoc } from '@/components/cv/cv-doc';

type Suggestion = { text: string; action?: { label: string; apply: (doc: CvDoc) => CvDoc } };

const excerpt = (s: string) => (s.length > 60 ? `${s.slice(0, 60).trim()}…` : s);

// Pistes concrètes pour revenir à une page, de la plus efficace à la moins
// efficace. Celles qui peuvent s'appliquer d'un clic proposent un bouton.
function suggestionsFor(doc: CvDoc): Suggestion[] {
  const out: Suggestion[] = [];
  const visible = doc.experiences.map((e, i) => ({ e, i })).filter(({ e }) => !e.hidden);

  // Expérience la plus ancienne (dernière de la liste), s'il en reste d'autres.
  if (visible.length > 1) {
    const { e, i } = visible[visible.length - 1];
    out.push({
      text: `Masquer l'expérience la plus ancienne : « ${e.title || e.company} ».`,
      action: { label: 'Masquer', apply: d => ({ ...d, experiences: d.experiences.map((x, k) => (k === i ? { ...x, hidden: true } : x)) }) },
    });
  }

  // Expériences avec plus de 3 points : masquer le dernier.
  for (const { e, i } of visible) {
    const shown = e.bullets.map((b, j) => ({ b, j })).filter(({ b }) => !b.hidden && b.text.trim());
    if (shown.length > 3) {
      const last = shown[shown.length - 1].j;
      out.push({
        text: `« ${e.title || e.company} » a ${shown.length} points : en garder 3 suffit souvent.`,
        action: {
          label: 'Masquer le dernier point',
          apply: d => ({ ...d, experiences: d.experiences.map((x, k) => (k === i ? { ...x, bullets: x.bullets.map((b, m) => (m === last ? { ...b, hidden: true } : b)) } : x)) }),
        },
      });
    }
  }

  // Points trop longs (plus de deux lignes) : à raccourcir à la main.
  for (const { e } of visible) {
    for (const b of e.bullets) {
      if (!b.hidden && b.text.length > 170) out.push({ text: `Raccourcir ce point à une ou deux lignes : « ${excerpt(b.text)} »` });
    }
  }

  if (doc.profil.length > 350) out.push({ text: `Raccourcir le profil (${doc.profil.length} caractères) à 2 ou 3 lignes.` });
  if (doc.competences.length > 300) out.push({ text: 'Garder seulement les compétences les plus utiles pour cette offre.' });

  return out.slice(0, 5);
}

// Indicateur de remplissage de la page A4 et, en cas de dépassement, défaut
// signalé avec les pistes de correction.
export function CvFit({ doc, fill, onChange }: { doc: CvDoc; fill: number | null; onChange: (next: CvDoc) => void }) {
  if (fill === null) return <p className="text-sm text-neutral-500">Vérification de la mise en page…</p>;

  const pct = Math.round(fill * 100);
  if (fill <= 1) {
    return (
      <p className="flex items-center gap-2 text-sm text-neutral-700">
        <CheckCircle2 size={16} className="text-neutral-900" />Tient sur une page A4 (remplie à {pct} %).
      </p>
    );
  }

  const tips = suggestionsFor(doc);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-red-300 bg-red-50 p-6" role="alert">
      <p className="flex items-center gap-2 text-sm font-semibold text-red-700">
        <AlertTriangle size={16} />Le CV dépasse une page A4 ({pct} %).
      </p>
      <p className="text-sm text-red-700">
        À l&apos;export, le texte serait réduit pour tenir sur une page. Mieux vaut corriger le contenu :
      </p>
      <ul className="flex flex-col gap-3">
        {tips.map((t, i) => (
          <li key={i} className="flex flex-wrap items-center justify-between gap-3 text-sm text-neutral-900">
            <span className="min-w-0 flex-1">{t.text}</span>
            {t.action && (
              <Button type="button" variant="outline" size="sm" onClick={() => onChange(t.action!.apply(doc))}>
                {t.action.label}
              </Button>
            )}
          </li>
        ))}
        {tips.length === 0 && <li className="text-sm text-neutral-900">Raccourcis les textes les plus longs ou masque un élément à droite.</li>}
      </ul>
    </div>
  );
}
