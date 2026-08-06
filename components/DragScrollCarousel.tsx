'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/gtag';

// Carrousel à boucle infinie.
//
// Pourquoi le défilement natif a été abandonné : avec N éléments et un
// conteneur qui défile, il existe toujours un vrai bord. On peut bien
// réordonner le DOM une fois ce bord atteint, mais le contenu suivant
// n'apparaît alors qu'APRÈS que l'utilisateur ait buté dessus — c'est
// structurellement « ça apparaît au dernier moment », et aucun réglage
// ne le corrige. S'y ajoutaient deux conflits permanents : muter
// scrollLeft en pleine inertie (Safari poursuit son animation vers une
// cible calculée avant la mutation) et le faire sous scroll-snap
// mandatory, qui re-snappe derrière nous.
//
// Ici la position est une valeur virtuelle `s` pilotée en JS, et chaque
// élément est placé modulo la longueur de piste : un élément qui sort à
// droite rentre à gauche, en continu. Il n'y a plus de bord du tout,
// donc plus rien à atteindre avant que ça ne s'affiche.
//
// Les 4 composants ne sont JAMAIS démontés ni réordonnés : leurs
// animations internes continuent exactement où elles en sont, même hors
// écran, et aucun mockup n'est cloné — il n'y a que N nœuds DOM.
//
// Géométrie (voir aussi .landing-showcase-carousel dans tracker.css) :
// la piste porte l'unique transform réécrit à chaque frame, les
// éléments ne portent que leur saut de rebouclage, écrit seulement quand
// ils rebouclent. Une écriture par frame au lieu de N.
export default function DragScrollCarousel({ children, className, circular = false }: { children: React.ReactNode; className?: string; circular?: boolean }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const peekEl = peekRef.current;
    if (!viewport || !track || !peekEl) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    // --- Mesures -----------------------------------------------------
    // Tout est mesuré, jamais recalculé depuis les formules vw du CSS :
    // celles-ci diffèrent sous 720px, et une scrollbar classique ampute
    // la largeur de contenu sans que 100vw ne bouge. Une seule source de
    // vérité, le layout réel.
    // Déclaré avant measure(), qui le purge : au changement de point de
    // rupture c'est la longueur de piste qui change, pas le nombre de
    // tours mémorisé ici.
    const wrapCounts: number[] = [];
    let items: HTMLElement[] = [];
    let itemW = 0;
    let step = 0;
    let trackLen = 0;
    let peek = 0;
    let lo = 0;

    function measure() {
      items = Array.from(track!.children) as HTMLElement[];
      if (!items.length) return;
      const gap = parseFloat(getComputedStyle(track!).columnGap) || 0;
      // getBoundingClientRect (et non offsetWidth) pour garder la
      // précision sous-pixel : les seuls transforms d'ancêtre ici sont
      // des translations pures, qui ne changent pas une largeur. Ne
      // jamais introduire de scale() sur le carrousel, cela fausserait
      // cette mesure (et figerait mal la hauteur du kanban).
      itemW = items[0].getBoundingClientRect().width;
      step = itemW + gap;
      trackLen = items.length * step;
      peek = peekEl!.getBoundingClientRect().width;
      const viewportW = viewport!.clientWidth;
      // Marge hors écran disponible, répartie de part et d'autre : c'est
      // elle qui rend le saut de rebouclage invisible. Sur la grille
      // 12 colonnes elle vaut exactement 48px, indépendamment de la
      // largeur d'écran.
      const slack = trackLen - viewportW - itemW;
      lo = -(itemW + Math.max(slack, 0) / 2);
      // Invalide les sauts de rebouclage mémorisés. paint() ne réécrit le
      // transform d'un élément que si son NOMBRE de tours a changé — or au
      // franchissement d'un point de rupture c'est la longueur de piste
      // qui change, pas ce nombre : sans cette purge, les éléments
      // gardaient un saut calculé sur l'ancienne géométrie et partaient à
      // plus de mille pixels hors de l'écran.
      wrapCounts.length = 0;
      if (slack <= 0 && process.env.NODE_ENV !== 'production') {
        // Sans marge, un élément serait visible des deux côtés à la fois
        // au moment de reboucler. Signalé plutôt que rendu en silence.
        console.warn('[DragScrollCarousel] piste trop courte pour reboucler sans coupure', { trackLen, viewportW, itemW });
      }
    }

    function wrap(raw: number) {
      return ((raw - lo) % trackLen + trackLen) % trackLen + lo;
    }

    // --- Rendu -------------------------------------------------------
    let s = 0;
    let frame = 0;

    function paint() {
      frame = 0;
      if (!step) return;
      track!.style.transform = `translateX(${-(s + peek)}px)`;
      for (let i = 0; i < items.length; i++) {
        const raw = i * step - s - peek;
        const k = circular ? Math.round((wrap(raw) - raw) / trackLen) : 0;
        if (wrapCounts[i] !== k) {
          wrapCounts[i] = k;
          items[i].style.transform = k ? `translateX(${k * trackLen}px)` : '';
        }
      }
    }

    function schedulePaint() {
      if (!frame) frame = requestAnimationFrame(paint);
    }

    function clampIfBounded() {
      if (circular || !step) return;
      const max = (items.length - 1) * step;
      if (s < 0) s = 0;
      else if (s > max) s = max;
    }

    // --- Accrochage --------------------------------------------------
    // `s` reste volontairement non borné (jamais normalisé modulo la
    // piste) : une animation qui part de trackLen-10 vers trackLen
    // verrait sinon sa cible normalisée à 0 et repartirait en arrière sur
    // toute la longueur. La normalisation n'a lieu qu'au moment de
    // calculer la position de chaque élément.
    let tween = 0;

    function cancelTween() {
      if (tween) { cancelAnimationFrame(tween); tween = 0; }
    }

    function snapTargetFrom(position: number) {
      const dpr = window.devicePixelRatio || 1;
      let target = Math.round(position / step) * step;
      // Les cibles tombent sur des demi-pixels pour la plupart des
      // largeurs d'écran, ce qui rend le texte des mockups flou au repos.
      // On aligne la translation effectivement rendue sur la grille de
      // pixels physiques.
      const rendered = Math.round(-(target + peek) * dpr) / dpr;
      target = -rendered - peek;
      return target;
    }

    function settle() {
      if (!step) return;
      const index = ((Math.round(s / step) % items.length) + items.length) % items.length;
      trackEvent('carousel_scroll', { item_index: index });
    }

    function animateTo(target: number) {
      cancelTween();
      if (reduceMotion.matches) {
        // Saut sec, mais accrochage quand même : sans lui la position de
        // repos serait arbitraire au milieu d'un pas et on perdrait
        // l'alignement sur la grille, qui est la contrainte n°1.
        s = target;
        clampIfBounded();
        schedulePaint();
        settle();
        return;
      }
      const from = s;
      const delta = target - from;
      if (Math.abs(delta) < 0.5) { s = target; schedulePaint(); settle(); return; }
      const duration = Math.min(550, Math.max(260, Math.abs(delta) * 0.7));
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        s = from + delta * eased;
        clampIfBounded();
        paint();
        if (t < 1) tween = requestAnimationFrame(tick);
        else { tween = 0; settle(); }
      };
      tween = requestAnimationFrame(tick);
    }

    function snap() { animateTo(snapTargetFrom(s)); }

    // --- Molette -----------------------------------------------------
    // Listener manuel non passif : React enregistre `wheel` en passive
    // sur son conteneur racine, donc un preventDefault dans un onWheel
    // JSX ne fait rien (et log un avertissement) — la page défilerait
    // horizontalement, ou déclencherait le geste retour du navigateur,
    // pendant que le JS bouge aussi le carrousel.
    let wheelAxis: 'x' | 'y' | null = null;
    let lastWheelAt = 0;
    let quiet = 0;

    function onWheel(e: WheelEvent) {
      if (!step) return;
      const now = performance.now();
      // Verrou d'axe sur toute la rafale, et non événement par événement :
      // sur un geste diagonal de trackpad le rapport bascule d'un
      // événement à l'autre, ce qui ferait alterner défilement de page et
      // défilement du carrousel — la page tressaute et le carrousel
      // avance par à-coups.
      if (now - lastWheelAt > 150) wheelAxis = null;
      lastWheelAt = now;
      if (!wheelAxis) wheelAxis = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? 'x' : 'y';
      if (wheelAxis !== 'x') return;
      e.preventDefault();
      cancelTween();
      // deltaMode 1 = lignes (Firefox), à convertir en pixels.
      s += e.deltaX * (e.deltaMode === 1 ? 16 : 1);
      clampIfBounded();
      schedulePaint();
      clearTimeout(quiet);
      quiet = window.setTimeout(snap, 130);
    }

    // --- Glisser (souris et tactile) ---------------------------------
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startS = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    function onPointerDown(e: PointerEvent) {
      if (!step) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      // Le texte des légendes reste sélectionnable : un glissement qui
      // démarre dessus n'est pas un pan.
      if ((e.target as HTMLElement).closest('.landing-showcase-caption')) return;
      dragging = true;
      moved = false;
      startX = lastX = e.clientX;
      startS = s;
      lastT = performance.now();
      velocity = 0;
      cancelTween();
      clearTimeout(quiet);
      // Pas de preventDefault ici : cela tuerait la sélection et le focus.
    }

    function onPointerMove(e: PointerEvent) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      // Seuil de 5px avant de considérer que c'est un glissement, pour
      // qu'un micro clic-glissé reste une sélection de texte.
      if (!moved) {
        if (Math.abs(dx) < 5) return;
        moved = true;
        viewport!.classList.add('is-dragging');
        viewport!.setPointerCapture(e.pointerId);
      }
      const now = performance.now();
      const dt = now - lastT;
      if (dt > 0) {
        velocity = (lastX - e.clientX) / dt;
        lastX = e.clientX;
        lastT = now;
      }
      s = startS - dx;
      clampIfBounded();
      schedulePaint();
    }

    function endDrag(e: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      viewport!.classList.remove('is-dragging');
      if (viewport!.hasPointerCapture?.(e.pointerId)) viewport!.releasePointerCapture(e.pointerId);
      if (!moved) return;
      // Inertie : on projette où le geste « voulait » aller, puis on
      // accroche. Indispensable au tactile, où c'est l'interaction
      // principale — sans elle un swipe s'arrête net au lever du doigt et
      // le carrousel paraît cassé. Bornée à deux pas pour ne pas
      // s'envoler sur un geste brusque.
      const projected = s + velocity * 180;
      const maxJump = 2 * step;
      const bounded = Math.max(s - maxJump, Math.min(s + maxJump, projected));
      animateTo(snapTargetFrom(bounded));
    }

    // --- Clavier -----------------------------------------------------
    // Le conteneur natif était focalisable et répondait aux flèches tant
    // qu'il défilait. En reprenant le positionnement on perdait cet
    // accès, sur un contenu dont les légendes de tête et de queue sont
    // coupées en deux au repos, texte compris (WCAG 2.1.1).
    function onKeyDown(e: KeyboardEvent) {
      if (!step) return;
      const here = Math.round(s / step);
      let target: number | null = null;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') target = (here + 1) * step;
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') target = (here - 1) * step;
      else if (e.key === 'Home') target = Math.round(s / trackLen) * trackLen;
      else if (e.key === 'End') target = Math.round(s / trackLen) * trackLen + (items.length - 1) * step;
      if (target === null) return;
      e.preventDefault();
      animateTo(snapTargetFrom(target));
    }

    // --- Cycle de vie -------------------------------------------------
    measure();
    schedulePaint();

    // Au franchissement d'un point de rupture, `step` change : on
    // conserve l'index fractionnaire plutôt que la position en pixels,
    // sinon le repos tombe au milieu d'un élément.
    const resize = new ResizeObserver(() => {
      const before = step ? s / step : 0;
      measure();
      s = before * step;
      cancelTween();
      s = snapTargetFrom(s);
      paint();
    });
    resize.observe(viewport);

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', endDrag);
    // pointercancel est obligatoire sur iOS, où le navigateur reprend le
    // geste : sans lui l'état de glissement reste collé et le carrousel
    // suivrait la souris sans bouton enfoncé.
    viewport.addEventListener('pointercancel', endDrag);
    viewport.addEventListener('keydown', onKeyDown);

    return () => {
      resize.disconnect();
      cancelTween();
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(quiet);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', endDrag);
      viewport.removeEventListener('pointercancel', endDrag);
      viewport.removeEventListener('keydown', onKeyDown);
    };
  }, [circular]);

  return (
    <div
      ref={viewportRef}
      className={className}
      tabIndex={0}
      role="group"
      aria-roledescription="carrousel"
      aria-label="Aperçu des outils Altora"
    >
      <span className="landing-showcase-carousel-peek" ref={peekRef} aria-hidden="true" />
      <div className="landing-showcase-carousel-track" ref={trackRef}>
        {children}
      </div>
    </div>
  );
}
