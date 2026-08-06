'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Icon from '@/components/Icon';

// Same one-shot-reveal convention as CountUpPercent/MatchingAnimation:
// observe once, disconnect immediately, then run a scripted sequence —
// never replays on scroll back up/down.
//
// The move between columns is a manual FLIP (First, Last, Invert, Play):
// every .card in the board gets measured via getBoundingClientRect right
// after each state change (a card moving column shifts every other card
// in both the old and new column too, not just the one that moved), the
// delta from its previous position is applied as an instant transform,
// then cleared on the next frame with a transition — the card appears to
// glide from where it was to where it now is, across two different
// parent columns, instead of snapping. A card with no previous rect
// (freshly added) just fades/scales in instead of FLIP-ing from nowhere.
type CardData = {
  id: string;
  schoolBadge?: boolean;
  title: string;
  company: string;
  location: string;
  interviewPill?: string;
};

const INITIAL = {
  todo: [
    { id: 'oreal-marketing', schoolBadge: true, title: 'Alternance Marketing Digital', company: "L'Oréal", location: 'Clichy' },
    { id: 'decathlon-projet', title: 'Assistant chef de projet', company: 'Decathlon', location: 'Paris 15e' },
    { id: 'doctolib-growth', schoolBadge: true, title: 'Alternance Growth Marketing', company: 'Doctolib', location: 'Paris 9e' },
  ] as CardData[],
  sent: [
    { id: 'blablacar-com', title: 'Chargé de communication', company: 'BlaBlaCar', location: 'Paris 11e' },
    { id: 'sephora-crm', title: 'Alternant CRM & Data Marketing', company: 'Sephora', location: 'Neuilly-sur-Seine' },
    { id: 'rocket-projet', title: 'Chargé de Projet Marketing', company: 'Rocket School', location: 'Paris 8e' },
  ] as CardData[],
  interview: [
    { id: 'sephora-rh', title: 'Alternance RH', company: 'Sephora', location: 'Neuilly-sur-Seine', interviewPill: 'Le 31 juillet à 18h00' },
    { id: 'oreal-produit', title: 'Assistant Chef de Produit', company: "L'Oréal", location: 'Clichy', interviewPill: 'Le 5 août à 10h30' },
  ] as CardData[],
};

const NEW_TODO_CARD: CardData = { id: 'nike-com', schoolBadge: true, title: 'Alternance Communication', company: 'Nike', location: 'Paris 8e' };

function Card({ card, pillRevealed }: { card: CardData; pillRevealed: boolean }) {
  return (
    <div className="card card--slate" data-flip-id={card.id}>
      {card.schoolBadge && <span className="card-school-badge"><Icon name="graduation-cap" />Proposée par l&apos;école</span>}
      <div className="card-heading">
        <span className="card-title">{card.title}</span>
        <span className="card-heading-sep"> chez </span>
        <span className="card-company">{card.company}</span>
      </div>
      <div className="card-meta-row">
        <span className="card-meta-item"><Icon name="map-pin" />{card.location}</span>
      </div>
      <div className="card-link-row">
        <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
        <span className="card-link card-link--generate"><Icon name="sparkles" />Générer CV</span>
      </div>
      {card.interviewPill && (
        <span className={`card-interview-pill landing-kanban-pill${pillRevealed ? ' is-revealed' : ''}`}>
          <Icon name="calendar" />{card.interviewPill}
        </span>
      )}
    </div>
  );
}

export default function KanbanAnimation() {
  const [columns, setColumns] = useState(INITIAL);
  const [revealedPills, setRevealedPills] = useState<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);
  const rectsRef = useRef<Map<string, DOMRect>>(new Map());

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const timeouts: ReturnType<typeof setTimeout>[] = [];
        // Step 1: a todo offer gets sent.
        timeouts.push(setTimeout(() => {
          setColumns((prev) => {
            const moved = prev.todo.find((c) => c.id === 'decathlon-projet');
            if (!moved) return prev;
            return {
              ...prev,
              todo: prev.todo.filter((c) => c.id !== 'decathlon-projet'),
              sent: [...prev.sent, moved],
            };
          });
        }, 1200));
        // Step 2: that first sent offer lands an interview.
        timeouts.push(setTimeout(() => {
          setColumns((prev) => {
            const moved = prev.sent.find((c) => c.id === 'blablacar-com');
            if (!moved) return prev;
            return {
              ...prev,
              sent: prev.sent.filter((c) => c.id !== 'blablacar-com'),
              interview: [...prev.interview, { ...moved, interviewPill: 'Le 2 août à 14h00' }],
            };
          });
        }, 2600));
        // Step 3: its interview time slot fades in, once it has settled
        // into place rather than fading in mid-slide.
        timeouts.push(setTimeout(() => {
          setRevealedPills((prev) => new Set(prev).add('blablacar-com'));
        }, 3300));
        // Step 4: a fresh offer fills the gap left in "À faire".
        timeouts.push(setTimeout(() => {
          setColumns((prev) => ({ ...prev, todo: [...prev.todo, NEW_TODO_CARD] }));
        }, 4200));
        return () => timeouts.forEach(clearTimeout);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Runs after every render where `columns` changed — by then the DOM
  // already reflects the new column contents, so getBoundingClientRect
  // here reads the "Last" position for every card still on screen.
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cardEls = board.querySelectorAll<HTMLElement>('[data-flip-id]');
    cardEls.forEach((el) => {
      const id = el.dataset.flipId!;
      const last = el.getBoundingClientRect();
      const first = rectsRef.current.get(id);
      if (reduceMotion) {
        rectsRef.current.set(id, last);
        return;
      }
      if (first) {
        const dx = first.left - last.left;
        const dy = first.top - last.top;
        if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
          el.style.transition = 'none';
          el.style.transform = `translate(${dx}px, ${dy}px)`;
          // Two rAFs: one to let the transform above actually paint
          // before the transition is re-enabled, one to then trigger it —
          // a single rAF can land before that first paint on some
          // browsers and the "from" state never renders, skipping
          // straight to the end position with no visible motion.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.transition = 'transform 0.6s cubic-bezier(0.65, 0, 0.35, 1)';
              el.style.transform = '';
            });
          });
        }
      } else {
        el.style.transition = 'none';
        el.style.opacity = '0';
        el.style.transform = 'scale(0.92) translateY(8px)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)';
            el.style.opacity = '1';
            el.style.transform = '';
          });
        });
      }
      rectsRef.current.set(id, last);
    });
  }, [columns]);

  return (
    <div className="landing-kanban-board" ref={boardRef}>
      <div className="column">
        <div className="column-header column-header--slate">
          <Icon name="circle-dashed" />
          <span className="column-header-label">À faire</span>
          <span className="column-header-count">{columns.todo.length}</span>
        </div>
        <div className="card-list">
          {columns.todo.map((card) => <Card key={card.id} card={card} pillRevealed={false} />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--amber">
          <Icon name="hourglass" />
          <span className="column-header-label">Envoyé</span>
          <span className="column-header-count">{columns.sent.length}</span>
        </div>
        <div className="card-list">
          {columns.sent.map((card) => <Card key={card.id} card={card} pillRevealed={false} />)}
        </div>
      </div>
      <div className="column">
        <div className="column-header column-header--green">
          <Icon name="target" />
          <span className="column-header-label">Entretien</span>
          <span className="column-header-count">{columns.interview.length}</span>
        </div>
        <div className="card-list">
          {columns.interview.map((card) => (
            <Card key={card.id} card={card} pillRevealed={revealedPills.has(card.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
