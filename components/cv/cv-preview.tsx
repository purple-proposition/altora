'use client';

import { useEffect, useRef, useState } from 'react';
import type { CvDoc } from '@/components/cv/cv-doc';

// Dimensions de la page A4 en points, reprises du rendu PDF (lib/pdf.ts) :
// 1 pt = 1 px ici, puis la page entière est mise à l'échelle de la colonne.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 42.52;

// Aperçu du CV sous forme de vraie page A4, avec les mêmes tailles que le PDF.
// Si le contenu dépasse la page, la partie en trop apparaît sous une ligne
// « fin de page », sur fond rouge.
export function CvPreview({ doc, identity, fill, textScale = 1 }: {
  doc: CvDoc;
  identity: { name: string; email: string; phone: string; city: string; linkedin: string; portfolio: string };
  fill?: number | null;
  // Palier de taille retenu par le rendu PDF (1 = 10 pt, 0,95, 0,9 = 9 pt).
  textScale?: number;
}) {
  const k = textScale;
  const px = (n: number) => n * k;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(Math.min(1.2, el.clientWidth / PAGE_W));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const contact = [identity.phone, identity.email, identity.linkedin, identity.portfolio, identity.city].filter(Boolean).join(' · ');
  const exps = doc.experiences.filter(e => !e.hidden);
  const formations = doc.formation.filter(f => !f.hidden);
  const overflow = (fill ?? 0) > 1;

  const section = (title: string) => (
    <h3 style={{ fontSize: px(10), fontWeight: 700, textTransform: 'uppercase', margin: `${px(16)}px 0 ${px(6)}px`, lineHeight: 1.16 }}>{title}</h3>
  );

  return (
    <div ref={wrapRef} className="w-full">
      <div style={{ zoom: scale }}>
        <div className="relative mx-auto" style={{ width: PAGE_W }}>
          {/* Cadre de la page A4 : fond et bordure s'arrêtent à la hauteur réelle de la page. */}
          <div
            aria-hidden
            className="absolute left-0 top-0 border border-neutral-300 bg-neutral-50"
            style={{ width: PAGE_W, height: PAGE_H }}
          />
        <article
          className="relative text-neutral-950"
          style={{
            width: PAGE_W,
            padding: MARGIN,
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: px(10),
            lineHeight: 1.33,
            // Ce qui dépasse la page devient translucide et sort du cadre.
            ...(overflow
              ? {
                  WebkitMaskImage: `linear-gradient(to bottom, #000 ${PAGE_H}px, rgba(0,0,0,0.3) ${PAGE_H}px)`,
                  maskImage: `linear-gradient(to bottom, #000 ${PAGE_H}px, rgba(0,0,0,0.3) ${PAGE_H}px)`,
                }
              : {}),
          }}
        >
          <h2 style={{ fontSize: px(20), fontWeight: 700, lineHeight: 1.16, margin: `0 0 ${px(4)}px` }}>{identity.name}</h2>
          {doc.title && <p style={{ fontWeight: 700, lineHeight: 1.16, margin: `0 0 ${px(4)}px` }}>{doc.title}</p>}
          {contact && <p style={{ fontSize: px(9), lineHeight: 1.16, margin: `0 0 ${px(12)}px` }}>{contact}</p>}
          {doc.profil && <p style={{ margin: `0 0 ${px(4)}px` }}>{doc.profil}</p>}

          {exps.length > 0 && section('Expériences')}
          {exps.map((e, i) => (
            <div key={i} style={{ marginTop: px(8) }}>
              <div className="flex justify-between gap-4" style={{ fontWeight: 700, lineHeight: 1.16 }}>
                <span>{e.title}</span>
                <span style={{ fontWeight: 400 }} className="shrink-0">{e.dates}</span>
              </div>
              <p style={{ lineHeight: 1.16, margin: `0 0 ${px(4)}px` }}>{e.company}</p>
              {e.bullets.filter(b => !b.hidden && b.text.trim()).map((b, j) => (
                <p key={j} className="relative" style={{ paddingLeft: px(18), margin: `0 0 ${px(2)}px` }}>
                  <span className="absolute left-0">•</span>{b.text}
                </p>
              ))}
            </div>
          ))}

          {formations.length > 0 && section('Formation')}
          {formations.map((f, i) => (
            <div key={i} style={{ marginTop: px(8) }}>
              <div className="flex justify-between gap-4" style={{ fontWeight: 700, lineHeight: 1.16 }}>
                <span>{f.degree}</span>
                <span style={{ fontWeight: 400 }} className="shrink-0">{f.dates}</span>
              </div>
              <p style={{ lineHeight: 1.16, margin: `0 0 ${px(4)}px` }}>{f.school}</p>
            </div>
          ))}

          {doc.competences && <>{section('Compétences')}<p style={{ margin: `0 0 ${px(4)}px` }}>{doc.competences}</p></>}
          {doc.outils && <>{section('Outils')}<p style={{ margin: `0 0 ${px(4)}px` }}>{doc.outils}</p></>}
          {doc.langues && <>{section('Langues')}<p style={{ margin: `0 0 ${px(4)}px` }}>{doc.langues}</p></>}

        </article>
          {overflow && (
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 border-t-2 border-dashed border-red-500"
              style={{ top: PAGE_H }}
            >
              <span className="absolute right-0 top-1 rounded bg-red-600 px-2 py-0.5 font-sans text-white" style={{ fontSize: 10 }}>
                Fin de la page A4 · texte en trop estompé
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
