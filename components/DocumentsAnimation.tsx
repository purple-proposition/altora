'use client';

import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

// Les documents circulent d'un dossier a l'autre : une feuille se
// detache du dossier de depart, traverse le plateau, et le dossier
// d'arrivee la recoit.
//
// La feuille en vol est un element a part, pose en absolu sur le
// plateau, et non la vignette d'origine deplacee. Une vignette reste
// prisonniere du debordement cache de sa carte : elle serait rognee des
// qu'elle en sortirait. C'est aussi ce qui permet de retirer le compte
// du dossier de depart des le decollage, donc de voir la pile maigrir au
// moment ou la feuille part, plutot qu'a l'arrivee.
//
// Les coordonnees sont relatives au plateau et non a la fenetre : le
// carrousel parent porte un translate, et deux rectangles mesures dans
// le meme repere restent justes quel que soit ce decalage.
const DOSSIERS = [
  { nom: 'Mes CV', vide: 'Aucun CV pour le moment.' },
  { nom: 'Mes lettres de motivation', vide: 'Aucune lettre générée pour le moment.' },
  { nom: 'Cours', vide: 'Aucun cours déposé pour le moment.' },
  { nom: 'Administratif', vide: 'Aucun document pour le moment.' },
];

const DEPART = [1, 0, 2, 3];
// Boucle de quatre echanges qui ramene exactement a l'etat de depart :
// le mockup tourne indefiniment sans jamais deriver ni se vider. Seul
// "Mes lettres de motivation" repasse par zero, ce qui est deja son etat
// initial, donc le message de dossier vide garde du sens.
const MOUVEMENTS: [number, number][] = [[2, 1], [3, 0], [1, 2], [0, 3]];

const MAX_FEUILLES = 3;
const VOL = 700;
const PAUSE = 2600;

function Feuille() {
  return (
    <div className="doc-thumb-sheet">
      <div className="doc-thumb-page">
        <span className="doc-thumb-page-title" />
        <span className="doc-thumb-page-line" />
        <span className="doc-thumb-page-line" />
        <span className="doc-thumb-page-line doc-thumb-page-line--short" />
      </div>
    </div>
  );
}

type Vol = { x: number; y: number; dx: number; dy: number; pose: boolean };

export default function DocumentsAnimation() {
  const [compte, setCompte] = useState<number[]>(DEPART);
  const [vol, setVol] = useState<Vol | null>(null);
  const plateauRef = useRef<HTMLDivElement>(null);
  const corpsRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tourRef = useRef(0);
  const minuteriesRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const plateau = plateauRef.current;
    if (!plateau) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function centre(el: HTMLElement, rp: DOMRect) {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - rp.left, y: r.top + r.height / 2 - rp.top };
    }

    function lancer() {
      const p = plateauRef.current;
      const [de, vers] = MOUVEMENTS[tourRef.current++ % MOUVEMENTS.length];
      const source = corpsRefs.current[de];
      const cible = corpsRefs.current[vers];
      if (!p || !source || !cible) return;

      const rp = p.getBoundingClientRect();
      const a = centre(source, rp);
      const b = centre(cible, rp);

      setCompte((c) => { const n = [...c]; n[de] = Math.max(0, n[de] - 1); return n; });
      setVol({ x: a.x, y: a.y, dx: b.x - a.x, dy: b.y - a.y, pose: false });
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setVol((v) => (v ? { ...v, pose: true } : v));
      }));

      minuteriesRef.current.push(setTimeout(() => {
        setCompte((c) => { const n = [...c]; n[vers] = Math.min(MAX_FEUILLES, n[vers] + 1); return n; });
        setVol(null);
        minuteriesRef.current.push(setTimeout(lancer, PAUSE));
      }, VOL));
    }

    const observateur = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      observateur.disconnect();
      minuteriesRef.current.push(setTimeout(lancer, PAUSE));
    }, { threshold: 0.4 });
    observateur.observe(plateau);

    return () => {
      observateur.disconnect();
      minuteriesRef.current.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="documents-grid landing-documents-board" ref={plateauRef}>
      {DOSSIERS.map((d, i) => (
        <div className="folder-card" key={d.nom}>
          <div className="folder-card-header">
            <Icon name="folder" />
            <span className="folder-card-name">{d.nom}</span>
          </div>
          <div className="folder-card-body" ref={(el) => { corpsRefs.current[i] = el; }}>
            {compte[i] === 0 ? (
              <p className="folder-empty">{d.vide}</p>
            ) : (
              <div className="doc-thumb-grid">
                <div className={`doc-thumb-bare${compte[i] > 1 ? ' doc-thumb-fan' : ''}`}>
                  {compte[i] === 1 ? (
                    <Feuille />
                  ) : (
                    Array.from({ length: Math.min(compte[i], MAX_FEUILLES) }, (_, k) => (
                      <div className={`doc-thumb-fan-layer doc-thumb-fan-layer--${k}`} key={k}>
                        <Feuille />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {vol && (
        <div
          className="landing-documents-vol"
          style={{
            left: vol.x,
            top: vol.y,
            transform: vol.pose
              ? `translate(calc(-50% + ${vol.dx}px), calc(-50% + ${vol.dy}px)) rotate(8deg)`
              : 'translate(-50%, -50%)',
          }}
        >
          <Feuille />
        </div>
      )}
    </div>
  );
}
