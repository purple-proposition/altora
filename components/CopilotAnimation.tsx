'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

// Meme boucle que la boite de reception, appliquee aux suggestions : la
// plus ancienne, en bas, glisse vers la droite en s'effacant, puis une
// nouvelle entre par la gauche tout en haut et fait descendre les autres.
//
// La descente est un FLIP manuel et non une transition CSS : les
// suggestions n'ont pas toutes la meme hauteur, une nouvelle de trois
// lignes ne pousse donc pas les suivantes de la meme distance qu'une de
// deux. Mesurer le deplacement reel est le seul moyen d'obtenir un
// glissement juste plutot qu'une valeur choisie au hasard.
type Ton = 'positive' | 'warning' | 'urgent';
type Modele = { ton: Ton; icone: string; gras?: string; texte: string };

const ICONES: Record<Ton, string> = {
  positive: 'check-circle',
  warning: 'target',
  urgent: 'circle-alert',
};

const POOL: Modele[] = [
  { ton: 'positive', icone: ICONES.positive, texte: '8 apprenants présentent plus de 90% de compatibilité avec cette nouvelle offre.' },
  { ton: 'warning', icone: ICONES.warning, texte: "12 apprenants n'ont envoyé aucune candidature depuis 10 jours : proposez-leur ces 5 offres adaptées." },
  { ton: 'urgent', icone: ICONES.urgent, gras: 'Thomas', texte: " n'a obtenu aucun entretien malgré 20 candidatures : une prise de contact individuelle est recommandée." },
  { ton: 'positive', icone: ICONES.positive, texte: '3 apprenants ont décroché un entretien cette semaine, dont deux sur des offres suggérées.' },
  { ton: 'warning', icone: ICONES.warning, texte: "5 apprenants n'ont pas actualisé leur CV depuis deux mois : une relance groupée suffit." },
  { ton: 'urgent', icone: ICONES.urgent, gras: 'Inès', texte: " n'a plus ouvert son espace depuis trois semaines : un point individuel est recommandé." },
  { ton: 'positive', icone: ICONES.positive, texte: 'Le taux de réponse de la promotion a progressé de 12 points ce mois-ci.' },
  { ton: 'warning', icone: ICONES.warning, texte: "Quatre offres partenaires expirent dans trois jours sans aucune candidature envoyée." },
];

type Suggestion = Modele & { id: string };

// Trois suggestions visibles, comme avant. Le cycle en retire une avant
// d'en ajouter une, donc la liste oscille entre deux et trois.
const MAX = 3;

function fabriquer(cycle: number): Suggestion {
  const m = POOL[cycle % POOL.length];
  return { ...m, id: `sugg-${cycle}` };
}

function etatInitial(): Suggestion[] {
  return [fabriquer(0), fabriquer(1), fabriquer(2)];
}

const PAUSE_RETRAIT = 3200;
const PAUSE_AJOUT = 700;
const PAUSE_BOUCLE = 2600;
const SORTIE = 400;
const GLISSE = 400;
const ENTREE = 400;

function Vue({ s }: { s: Suggestion }) {
  return (
    <div className={`landing-copilot-item landing-copilot-item--${s.ton}`} data-sugg-id={s.id}>
      <Icon name={s.icone} />
      <p>{s.gras ? <><strong>{s.gras}</strong>{s.texte}</> : s.texte}</p>
    </div>
  );
}

export default function CopilotAnimation() {
  const [items, setItems] = useState<Suggestion[]>(etatInitial);
  const cardRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Suggestion[]>(items);
  const cycleRef = useRef(3);
  const minuteriesRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const vuesRef = useRef<Set<string>>(new Set(items.map((i) => i.id)));
  const bougeesRef = useRef<Set<string>>(new Set());
  // Coordonnees relatives a la carte, pas au viewport : la section
  // entiere est encore en train de glisser au moment ou l'apparition au
  // defilement se joue, et les deux moitiés d'un FLIP sont separees par
  // une frontiere de commit React.
  const premieresRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const motionReduite = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function commit(suivant: Suggestion[], bougees: string[] = []) {
      const card = cardRef.current;
      if (card) {
        const origine = card.getBoundingClientRect().top;
        bougees.forEach((id) => {
          const n = card.querySelector<HTMLElement>(`[data-sugg-id="${id}"]`);
          if (n) premieresRef.current.set(id, n.getBoundingClientRect().top - origine);
        });
      }
      bougeesRef.current = new Set(bougees);
      itemsRef.current = suivant;
      setItems(suivant);
    }

    function retirerLaPlusAncienne() {
      const courant = itemsRef.current;
      if (courant.length === 0) {
        minuteriesRef.current.push(setTimeout(ajouter, PAUSE_AJOUT));
        return;
      }
      const cible = courant[courant.length - 1];
      const card = cardRef.current;
      const noeud = card?.querySelector<HTMLElement>(`[data-sugg-id="${cible.id}"]`);

      function finir() {
        commit(courant.slice(0, -1));
        minuteriesRef.current.push(setTimeout(ajouter, PAUSE_AJOUT));
      }

      if (noeud && !motionReduite) {
        // Le fondu et le deplacement partagent la meme transition, donc
        // la suggestion s'efface a mesure qu'elle sort plutot que de
        // jouer deux effets qu'on percevrait separement.
        noeud.style.transition = `transform ${SORTIE}ms cubic-bezier(0.65, 0, 0.35, 1), opacity ${SORTIE}ms ease`;
        noeud.style.transform = 'translateX(130%)';
        noeud.style.opacity = '0';
        minuteriesRef.current.push(setTimeout(finir, SORTIE));
      } else {
        finir();
      }
    }

    function ajouter() {
      const fraiche = fabriquer(cycleRef.current++);
      // Sans lister les suggestions existantes comme deplacees, elles
      // sauteraient d'un coup a leur nouvelle position au lieu de
      // descendre avec l'arrivante.
      const existantes = itemsRef.current.map((i) => i.id);
      commit([fraiche, ...itemsRef.current].slice(0, MAX), existantes);
      minuteriesRef.current.push(setTimeout(boucle, PAUSE_BOUCLE));
    }

    function boucle() {
      retirerLaPlusAncienne();
    }

    const observateur = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        observateur.disconnect();
        minuteriesRef.current.push(setTimeout(boucle, PAUSE_RETRAIT));
      },
      { threshold: 0.4 }
    );
    observateur.observe(el);
    return () => {
      observateur.disconnect();
      minuteriesRef.current.forEach(clearTimeout);
    };
  }, []);

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const motionReduite = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const bougees = bougeesRef.current;
    const premieres = premieresRef.current;
    const origine = card.getBoundingClientRect().top;

    card.querySelectorAll<HTMLElement>('[data-sugg-id]').forEach((n) => {
      const id = n.dataset.suggId!;
      const neuve = !vuesRef.current.has(id);
      vuesRef.current.add(id);
      if (motionReduite) return;

      function relacher(duree: number) {
        const t = setTimeout(nettoyer, duree + 80);
        n.addEventListener('transitionend', nettoyer, { once: true });
        function nettoyer() {
          clearTimeout(t);
          n.removeEventListener('transitionend', nettoyer);
          n.style.transition = '';
        }
      }

      if (neuve) {
        n.style.transition = 'none';
        n.style.opacity = '0';
        n.style.transform = 'translateX(-24px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            n.style.transition = `opacity ${ENTREE}ms ease, transform ${ENTREE}ms cubic-bezier(0.34, 1.4, 0.64, 1)`;
            n.style.opacity = '';
            n.style.transform = '';
            relacher(ENTREE);
          });
        });
        return;
      }

      if (!bougees.has(id)) return;
      const avant = premieres.get(id);
      if (avant === undefined) return;
      const dy = avant - (n.getBoundingClientRect().top - origine);
      if (Math.abs(dy) > 0.5) {
        n.style.transition = 'none';
        n.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            n.style.transition = `transform ${GLISSE}ms cubic-bezier(0.65, 0, 0.35, 1)`;
            n.style.transform = '';
            relacher(GLISSE);
          });
        });
      }
    });

    bougeesRef.current = new Set();
    premieres.clear();
  }, [items]);

  return (
    <div className="landing-copilot-card" ref={cardRef}>
      {items.map((s) => <Vue key={s.id} s={s} />)}
    </div>
  );
}
