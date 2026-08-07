'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

// Trombinoscope anime : chaque pastille est une candidature qui apparait,
// avance dans le tableau de suivi, puis disparait.
//
// La contrainte forte est l'ordre. Une pastille ne saute jamais d'etape :
// elle passe toujours par a faire, envoye, entretien, et seulement
// ensuite par refus quand il y en a un. C'est garanti par construction
// plutot que par prudence, l'etape ne progresse que de un et la couleur
// se lit depuis cette etape, donc aucun enchainement ne peut la
// contourner. Une pastille porte simplement le rang ou elle s'arrete :
// entretien pour la plupart, refus pour une sur quatre.
const ETAPES = ['slate', 'amber', 'green', 'rose'] as const;
const ENTRETIEN = 2;
const REFUS = 3;

// Le retrait est plus frequent que l'ajout, puisqu'une candidature ne
// s'ouvre que lorsqu'il n'y a plus rien a faire avancer. Un plancher a
// trois laissait donc les rangees tomber a deux et le tableau paraissait
// se vider : quatre maintient la densite du rendu d'origine.
const MIN_PASTILLES = 4;
const MAX_PASTILLES = 5;
// Un seul apprenant bouge par battement, a tour de role. Six apprenants,
// donc chacun evolue toutes les six secondes environ : le tableau reste
// vivant sans jamais donner l'impression de clignoter.
const BATTEMENT = 1000;
const TRANSITION = 400;

type Pastille = { id: number; etape: number; but: number };
type Apprenant = { nom: string; photo: string; pastilles: Pastille[] };

// Etat de depart identique au rendu precedent, pour que rien ne bouge au
// chargement. Chaque couple est [etape atteinte, etape finale].
const DEPART: { nom: string; photo: string; p: [number, number][] }[] = [
  { nom: 'Camille', photo: '/landing-preview-avatar.jpg', p: [[0, 2], [0, 3], [1, 2], [1, 2], [2, 2]] },
  { nom: 'Inès', photo: '/landing-preview-avatar-2.jpg', p: [[0, 2], [0, 2], [1, 3], [2, 2]] },
  { nom: 'Thomas', photo: '/landing-preview-avatar-3.jpg', p: [[0, 2], [1, 2], [1, 2], [3, 3]] },
  { nom: 'Lina', photo: '/landing-preview-avatar-lina.jpg', p: [[0, 3], [0, 2], [1, 2], [1, 2], [2, 2]] },
  { nom: 'Sofiane', photo: '/landing-preview-avatar-sofiane.jpg', p: [[0, 2], [1, 2], [2, 2]] },
  { nom: 'Manon', photo: '/landing-preview-avatar-manon.jpg', p: [[0, 2], [1, 3], [1, 2], [2, 2]] },
];

// findLastIndex n'est pas garanti par la cible de compilation du projet.
function dernierIndex(liste: Pastille[], test: (p: Pastille) => boolean) {
  for (let i = liste.length - 1; i >= 0; i--) if (test(liste[i])) return i;
  return -1;
}

let compteur = 1000;
function etatInitial(): Apprenant[] {
  return DEPART.map((a) => ({
    nom: a.nom,
    photo: a.photo,
    pastilles: a.p.map(([etape, but]) => ({ id: compteur++, etape, but })),
  }));
}

export default function RosterAnimation() {
  const [apprenants, setApprenants] = useState<Apprenant[]>(etatInitial);
  // Pastilles rendues mais repliees : celles qui entrent le temps d'une
  // image, celles qui sortent le temps de la transition.
  const [repliees, setRepliees] = useState<Set<number>>(new Set());
  const tourRef = useRef(0);
  const nouvellesRef = useRef(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const minuteries: number[] = [];
    const plier = (id: number, plie: boolean) =>
      setRepliees((s) => {
        const n = new Set(s);
        if (plie) n.add(id); else n.delete(id);
        return n;
      });

    const battement = window.setInterval(() => {
      const i = tourRef.current++ % DEPART.length;

      setApprenants((prev) => {
        const suivant = prev.map((a) => ({ ...a, pastilles: [...a.pastilles] }));
        const liste = suivant[i].pastilles;

        // 1. Reconstituer le minimum avant toute autre chose.
        if (liste.length < MIN_PASTILLES) {
          ajouter(liste);
          return suivant;
        }
        // 2. Evacuer une candidature arrivee au bout, ce qui libere la
        //    place pour la suivante. On cherche depuis la droite : la
        //    rangee se lit dans le sens de la progression, les plus
        //    avancees a droite, donc c'est par la qu'on sort.
        const fini = dernierIndex(liste, (p) => p.etape === p.but);
        if (fini !== -1) {
          const id = liste[fini].id;
          plier(id, true);
          minuteries.push(window.setTimeout(() => {
            setApprenants((s) => s.map((a) => ({ ...a, pastilles: a.pastilles.filter((p) => p.id !== id) })));
            plier(id, false);
          }, TRANSITION));
          return suivant;
        }
        // 3. Sinon faire progresser la plus ancienne qui peut avancer,
        //    d'un rang et d'un seul. La plus ancienne est la plus a
        //    droite : c'est ce qui maintient la rangee ordonnee.
        const bouge = dernierIndex(liste, (p) => p.etape < p.but);
        if (bouge !== -1) {
          liste[bouge] = { ...liste[bouge], etape: liste[bouge].etape + 1 };
          return suivant;
        }
        // 4. Rien a faire : ouvrir une nouvelle candidature.
        if (liste.length < MAX_PASTILLES) ajouter(liste);
        return suivant;
      });

      function ajouter(liste: Pastille[]) {
        // Une candidature sur quatre finit par un refus. Compteur plutot
        // que tirage au sort : la proportion reste tenue, et le rendu du
        // serveur ne peut pas diverger de celui du navigateur.
        const but = nouvellesRef.current++ % 4 === 3 ? REFUS : ENTRETIEN;
        const p = { id: compteur++, etape: 0, but };
        // En tete, pas en queue : une candidature qui vient de s'ouvrir
        // est la moins avancee, elle prend donc la gauche de la rangee.
        // Ajoutee en queue, elle se retrouvait a droite d'une pastille
        // verte et la rangee se lisait a l'envers.
        liste.unshift(p);
        // Rendue repliee, puis depliee a l'image suivante : sans ce
        // passage la pastille apparaitrait deja a sa taille finale et il
        // n'y aurait aucune transition a jouer.
        plier(p.id, true);
        requestAnimationFrame(() => requestAnimationFrame(() => plier(p.id, false)));
      }
    }, BATTEMENT);

    return () => {
      clearInterval(battement);
      minuteries.forEach(clearTimeout);
    };
  }, []);

  return (
    <div className="landing-roster-card">
      {apprenants.map((a) => (
        <div className="landing-roster-student" key={a.nom}>
          <span className="landing-roster-avatar">
            <Image src={a.photo} alt="" fill sizes="48px" />
          </span>
          <span className="landing-roster-name">{a.nom}</span>
          <span className="landing-roster-dots">
            {a.pastilles.map((p) => (
              <span
                key={p.id}
                className={`landing-roster-dot landing-roster-dot--${ETAPES[p.etape]}${
                  repliees.has(p.id) ? ' landing-roster-dot--repliee' : ''
                }`}
              />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
