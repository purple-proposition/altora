'use client';

import { useEffect, useRef, useState } from 'react';
import type { CvDoc } from '@/components/cv/cv-doc';

// Dimensions de la page A4 en points, et mesures du CV de référence (voir
// lib/pdf.ts) : corps 9 pt, nom 18 pt, interligne 12,4 pt, marges 15 mm.
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const M = 42.52;
const LEAD = 12.4;

// Aperçu fidèle à la page A4 du PDF : mêmes tailles, mêmes écarts, mêmes tirets.
// Le contenu qui dépasse la page devient translucide et sort du cadre.
export function CvPreview({ doc, identity, fill }: {
  doc: CvDoc;
  identity: { name: string; email: string; phone: string; city: string; linkedin: string; portfolio: string };
  fill?: number | null;
}) {
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

  const contact = [identity.phone, identity.email, identity.linkedin, identity.portfolio, identity.city].filter(Boolean).join('  ·  ');
  const exps = doc.experiences.filter(e => !e.hidden);
  const formations = doc.formation.filter(f => !f.hidden);
  const overflow = (fill ?? 0) > 1;

  const body: React.CSSProperties = { fontSize: 9, lineHeight: `${LEAD}px`, margin: 0 };
  const section = (title: string) => (
    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.6px', lineHeight: `${LEAD}px`, marginTop: 24 }}>{title.toUpperCase()}</div>
  );

  return (
    <div ref={wrapRef} className="w-full">
      <div style={{ zoom: scale }}>
        <div className="relative mx-auto" style={{ width: PAGE_W }}>
          <div aria-hidden className="absolute left-0 top-0 border border-neutral-300 bg-white" style={{ width: PAGE_W, height: PAGE_H }} />
          <article
            className="relative text-neutral-950"
            style={{
              width: PAGE_W,
              padding: M,
              fontFamily: 'Helvetica, Arial, sans-serif',
              ...(overflow
                ? {
                    WebkitMaskImage: `linear-gradient(to bottom, #000 ${PAGE_H}px, rgba(0,0,0,0.3) ${PAGE_H}px)`,
                    maskImage: `linear-gradient(to bottom, #000 ${PAGE_H}px, rgba(0,0,0,0.3) ${PAGE_H}px)`,
                  }
                : {}),
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, lineHeight: '22px' }}>{identity.name}</div>
            {doc.title && <div style={{ ...body, fontWeight: 700, marginTop: 6 }}>{doc.title}</div>}
            {contact && <div style={{ ...body, marginTop: 13 }}>{contact}</div>}
            {doc.profil && <div style={{ ...body, marginTop: 21 }}>{doc.profil}</div>}

            {exps.length > 0 && section('Expériences')}
            {exps.map((e, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 17 : 27.4 - LEAD }}>
                <div className="flex justify-between gap-4" style={{ ...body, fontWeight: 700 }}>
                  <span>{e.title}</span>
                  <span className="shrink-0" style={{ fontWeight: 400 }}>{e.dates}</span>
                </div>
                <div style={{ ...body, marginTop: 14 - LEAD }}>{e.company}</div>
                {e.bullets.filter(b => !b.hidden && b.text.trim()).map((b, j) => (
                  <div key={j} style={{ ...body, paddingLeft: 10, marginTop: j === 0 ? 17 - LEAD : 4 }}>
                    – {b.text}
                  </div>
                ))}
              </div>
            ))}

            {formations.length > 0 && section('Formation')}
            {formations.map((f, i) => (
              <div key={i} style={{ marginTop: i === 0 ? 17 : 23.4 - LEAD }}>
                <div className="flex justify-between gap-4" style={{ ...body, fontWeight: 700 }}>
                  <span>{f.degree}</span>
                  <span className="shrink-0" style={{ fontWeight: 400 }}>{f.dates}</span>
                </div>
                <div style={{ ...body, marginTop: 14 - LEAD }}>{f.school}</div>
              </div>
            ))}

            {doc.competences && <>{section('Compétences')}<div style={{ ...body, marginTop: 17 - LEAD }}>{doc.competences}</div></>}
            {doc.outils && <>{section('Outils')}<div style={{ ...body, marginTop: 17 - LEAD }}>{doc.outils}</div></>}
            {doc.langues && <>{section('Langues')}<div style={{ ...body, marginTop: 17 - LEAD }}>{doc.langues}</div></>}

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
          </article>
        </div>
      </div>
    </div>
  );
}
