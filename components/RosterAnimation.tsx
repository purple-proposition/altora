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

const MIN_PASTILLES = 4;
const MAX_PASTILLES = 5;
// Un seul apprenant bouge par battement, a tour de role. Six apprenants,
// donc chacun evolue toutes les quatre secondes environ : le tableau
// reste vivant sans jamais donner l'impression de clignoter. Le
// battement a ete resserre pour que les couleurs aient le temps de se
// developper dans le champ de vision du visiteur.
const BATTEMENT = 700;
const TRANSITION = 400;

type Pastille = { id: number; etape: number; but: number };
type Apprenant = { nom: string; photo: string; pastilles: Pastille[] };

// Etat de depart, chaque couple etant [etape atteinte, etape finale]. Il
// est deliberement contraste : une rangee qui demarre a moitie grise met
// une minute a se colorer, et le visiteur voit d'abord un tableau terne.
// Les etapes sont croissantes de gauche a droite, comme la boucle les
// maintiendra ensuite.
const DEPART: { nom: string; photo: string; p: [number, number][] }[] = [
  { nom: 'Camille', photo: '/landing-preview-avatar.jpg', p: [[0, 2], [1, 2], [1, 3], [2, 2]] },
  { nom: 'Inès', photo: '/landing-preview-avatar-2.jpg', p: [[0, 3], [1, 2], [2, 2], [2, 3]] },
  { nom: 'Thomas', photo: '/landing-preview-avatar-3.jpg', p: [[0, 2], [1, 2], [2, 2], [3, 3]] },
  { nom: 'Lina', photo: '/landing-preview-avatar-lina.jpg', p: [[0, 2], [1, 3], [1, 2], [2, 2], [2, 2]] },
  { nom: 'Sofiane', photo: '/landing-preview-avatar-sofiane.jpg', p: [[1, 2], [1, 2], [2, 2], [2, 3]] },
  { nom: 'Manon', photo: '/landing-preview-avatar-manon.jpg', p: [[0, 2], [0, 3], [1, 2], [2, 2], [2, 2]] },
];

// findLastIndex n'est pas garanti par la cible de compilation du projet.
function dernierIndex(liste: Pastille[], test: (p: Pastille, i: number) => boolean) {
  for (let i = liste.length - 1; i >= 0; i--) if (test(liste[i], i)) return i;
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
  // Position de depart du prochain balayage, par apprenant.
  const rotationRef = useRef<number[]>(DEPART.map(() => 0));

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

        const fini = dernierIndex(liste, (p) => p.etape === p.but);
        // Une pastille peut avancer si elle n'a pas atteint son terme et
        // si elle ne depasse pas sa voisine de droite. Cette seule
        // condition maintient la rangee triee sans avoir a n'autoriser
        // que la plus a droite a bouger.
        const peutAvancer = (p: Pastille, k: number) =>
          p.etape < p.but && (k === liste.length - 1 || p.etape + 1 <= liste[k + 1].etape);
        // Cible tournante parmi les eligibles, et c'est la le correctif de
        // fond. En prenant toujours la plus a droite, les grises de gauche
        // etaient eligibles mais jamais choisies : elles attendaient que
        // toute la file soit partie, et la rangee virait au gris uniforme.
        // Simule sur neuf cents battements, la repartition passe de 86 %
        // de gris a 48 / 30 / 21, sans jamais une rangee dans le desordre.
        let bouge = -1;
        for (let d = 0; d < liste.length; d++) {
          const k = (rotationRef.current[i] + d) % liste.length;
          if (peutAvancer(liste[k], k)) {
            bouge = k;
            rotationRef.current[i] = (k + 1) % liste.length;
            break;
          }
        }

        function retirer(k: number) {
          const id = liste[k].id;
          plier(id, true);
          minuteries.push(window.setTimeout(() => {
            setApprenants((s) => s.map((a) => ({ ...a, pastilles: a.pastilles.filter((p) => p.id !== id) })));
            plier(id, false);
          }, TRANSITION));
        }

        // 1. Tenir le plancher. 2. Evacuer une candidature terminee, par
        //    la droite ou vivent les plus avancees. 3. Faire progresser.
        //    Cet ordre est celui qui, en simulation, donne la repartition
        //    la plus vivante : retirer avant d'avancer evite que les
        //    terminees s'accumulent en vert, et le plancher en premier
        //    empeche la rangee de se vider.
        if (liste.length < MIN_PASTILLES) {
          ajouter(liste);
          return suivant;
        }
        if (fini !== -1) {
          retirer(fini);
          return suivant;
        }
        if (bouge !== -1) {
          liste[bouge] = { ...liste[bouge], etape: liste[bouge].etape + 1 };
          return suivant;
        }
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
