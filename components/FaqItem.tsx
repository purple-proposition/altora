'use client';

import { useRef } from 'react';
import Icon from '@/components/Icon';

// Accordéon animé, construit sur <details> plutôt qu'à côté.
//
// L'élément natif donne gratuitement l'ouverture au clavier, l'état
// annoncé aux lecteurs d'écran et le dépliage automatique quand on
// cherche dans la page. Son seul défaut est qu'il n'a aucune transition :
// le contenu apparaît d'un coup, ce qui fait brusque.
//
// On garde donc l'élément et on intercepte seulement le clic pour animer
// la hauteur. À la fermeture, l'attribut open n'est retiré qu'une fois
// l'animation terminée, sinon le navigateur masque le contenu
// immédiatement et il n'y a plus rien à animer. C'est ce détail qui rend
// la fermeture aussi douce que l'ouverture, alors qu'une approche
// purement CSS ne peut animer que l'ouverture.
const DUREE_OUVERTURE = 320;
const DUREE_FERMETURE = 260;
// Départ franc puis arrivée très amortie : c'est la décélération qui
// donne la sensation de matière, pas la durée.
const COURBE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export default function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);
  // Numero du clic en cours. Les rappels differes d'un clic annule portent
  // un numero perime et ne doivent plus rien conclure : sans ce garde-fou,
  // le filet d'une fermeture interrompue par une reouverture refermerait
  // le panneau deux cents millisecondes plus tard.
  const genRef = useRef(0);

  function handleClick(e: React.MouseEvent) {
    const details = detailsRef.current;
    const content = contentRef.current;
    if (!details || !content) return;
    // En mouvement réduit, on laisse le comportement natif intact.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    e.preventDefault();

    // Pendant une fermeture, l'attribut open est encore la : se fier a lui
    // seul ferait re-fermer un panneau que l'utilisateur vient de cliquer
    // pour le rouvrir. L'intention se lit sur l'etat visible, pas sur
    // l'attribut.
    const enFermeture = details.dataset.closing === '1';
    const doitOuvrir = !details.open || enFermeture;

    // Point de depart de l'animation, mesure avant l'annulation : annuler
    // restaure d'un coup la hauteur de fin, et repartir de la ferait
    // sauter le panneau.
    //
    // Attention, la mesure ne vaut pas dans tous les cas. Le contenu d'un
    // <details> ferme n'est pas retire du flux, il est seulement masque :
    // il declare donc toujours sa hauteur pleine. Partir de cette mesure
    // pour une ouverture animait 87 pixels vers 87 pixels, autrement dit
    // rien du tout, et le panneau apparaissait d'un bloc. On ne se fie
    // donc a la mesure que lorsqu'une animation impose deja une hauteur
    // intermediaire, ou lorsqu'on referme un panneau reellement deplie.
    const enAnimation = animRef.current !== null;
    const depart = enAnimation || !doitOuvrir ? content.getBoundingClientRect().height : 0;
    animRef.current?.cancel();
    animRef.current = null;
    const gen = ++genRef.current;

    // Tant que l'animation tourne, elle impose la hauteur du panneau. Si
    // elle ne va jamais au bout, le panneau reste bloque a sa hauteur
    // intermediaire : ouvert dans le DOM mais invisible a l'ecran. Or une
    // animation ne progresse pas quand le rendu de l'onglet est suspendu.
    // Le filet ci-dessous force l'etat final passe le temps prevu, ce qui
    // degrade au pire en ouverture seche, jamais en panneau coince.
    let acheve = false;
    const achever = (anim: Animation, apres: () => void) => {
      if (acheve || gen !== genRef.current) return;
      acheve = true;
      // finish() leve sur une animation deja annulee ou terminee.
      if (anim.playState === 'running' || anim.playState === 'paused') anim.finish();
      apres();
      animRef.current = null;
    };
    const armer = (anim: Animation, duree: number, apres: () => void) => {
      animRef.current = anim;
      anim.onfinish = () => achever(anim, apres);
      window.setTimeout(() => achever(anim, apres), duree + 200);
    };

    if (doitOuvrir) {
      delete details.dataset.closing;
      details.open = true;
      const arrivee = content.scrollHeight;
      const anim = content.animate(
        { height: [`${depart}px`, `${arrivee}px`], opacity: [arrivee ? depart / arrivee : 0, 1] },
        { duration: DUREE_OUVERTURE, easing: COURBE },
      );
      armer(anim, DUREE_OUVERTURE, () => {});
    } else {
      details.dataset.closing = '1';
      const anim = content.animate(
        { height: [`${depart}px`, '0px'], opacity: [1, 0] },
        { duration: DUREE_FERMETURE, easing: COURBE },
      );
      armer(anim, DUREE_FERMETURE, () => {
        details.open = false;
        delete details.dataset.closing;
      });
    }
  }

  return (
    <details className="pricing-faq-item" ref={detailsRef}>
      <summary className="pricing-faq-question" onClick={handleClick}>
        {question}
        <Icon name="chevron-down" />
      </summary>
      <div className="pricing-faq-content" ref={contentRef}>
        <p className="pricing-faq-answer">{children}</p>
      </div>
    </details>
  );
}
