'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Icon from '@/components/Icon';

// Perpetual loop, same convention as KanbanAnimation: starts once the
// board scrolls into view, then repeats forever instead of settling into
// a final state. One list, one parent (unlike the kanban board's three
// columns), so a status change never causes React to remount the DOM
// node into a different parent — read/unread is driven purely by
// declarative state + CSS transitions, no imperative DOM needed there.
//
// Each cycle: every currently-unread message is marked read one at a
// time, oldest first; then the oldest read message (the one sitting at
// the bottom) is deleted — slid right out of the board's own clipped
// edge while reddening over the same transition, a manual FLIP glides
// the remaining messages up to close the gap; then a fresh unread
// message fades/slides in at the top. After the first cycle there's
// usually only one unread message left, so later cycles mark just that
// one — the loop is self-consistent rather than assuming exactly two
// forever.
type Avatar = { kind: 'person'; src: string; alt: string } | { kind: 'icon'; icon: string };

type MessageData = {
  id: string;
  avatar: Avatar;
  sender: string;
  email: string;
  time: string;
  subject: string;
  preview: string;
  read: boolean;
};

type Template = Omit<MessageData, 'id' | 'read'>;

const POOL: Template[] = [
  { avatar: { kind: 'person', src: '/landing-preview-avatar-cassandra.jpg', alt: 'Cassandra' }, sender: 'Cassandra de Lumina School', email: 'cassandra@lumina-school.fr', time: '09:14', subject: 'Ton CV a été mis à jour, tout est prêt pour BlaBlaCar', preview: "J'ai relu ta candidature, n'oublie pas d'ajouter ton projet marketing avant de l'envoyer." },
  { avatar: { kind: 'icon', icon: 'target' }, sender: 'Altora', email: 'notifications@altora.fr', time: '11:02', subject: 'Nouvelle offre compatible à 92% avec ton profil', preview: 'Alternance Growth Marketing chez Doctolib, à Paris 9e. Génère ton CV en un clic.' },
  { avatar: { kind: 'icon', icon: 'graduation-cap' }, sender: 'Lumina School', email: 'contact@lumina-school.fr', time: 'Hier', subject: 'Rappel : évaluations B3 les 24, 25 et 26 juin', preview: 'Le planning détaillé des évaluations est disponible sur ton espace élève.' },
  { avatar: { kind: 'icon', icon: 'target' }, sender: 'Altora', email: 'notifications@altora.fr', time: '14:30', subject: 'Ton CV a été généré pour Sephora', preview: 'Alternance RH chez Sephora, à Neuilly-sur-Seine. Relis-le avant de postuler.' },
  { avatar: { kind: 'icon', icon: 'graduation-cap' }, sender: 'Lumina School', email: 'contact@lumina-school.fr', time: '16:05', subject: "N'oublie pas de mettre à jour ton CV", preview: 'Ton dernier CV date de plus de deux mois, pense à le rafraîchir.' },
  { avatar: { kind: 'person', src: '/landing-preview-avatar-cassandra.jpg', alt: 'Cassandra' }, sender: 'Cassandra de Lumina School', email: 'cassandra@lumina-school.fr', time: '10:20', subject: 'Entretien confirmé chez Decathlon', preview: "Ton entretien est bien confirmé, je t'envoie les conseils habituels." },
];

function makeMessage(cycle: number, read: boolean): MessageData {
  const t = POOL[cycle % POOL.length];
  return { id: `${t.sender}-${t.time}-${cycle}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'), read, ...t };
}

function initialMessages(): MessageData[] {
  return [makeMessage(0, false), makeMessage(1, false), makeMessage(2, true)];
}

const READ_STEP_PAUSE = 1800;
const REMOVE_PAUSE = 2600;
const ADD_PAUSE = 800;
const LOOP_PAUSE = 2800;
const EXIT_DURATION = 800;
const MOVE_DURATION = 700;
const ENTRANCE_DURATION = 800;

function AvatarView({ avatar }: { avatar: Avatar }) {
  if (avatar.kind === 'person') {
    return (
      <span className="landing-inbox-avatar landing-inbox-avatar--person">
        <Image src={avatar.src} alt={avatar.alt} fill sizes="28px" />
      </span>
    );
  }
  return (
    <span className="landing-inbox-avatar landing-inbox-avatar--school">
      <Icon name={avatar.icon} />
    </span>
  );
}

function Message({ message }: { message: MessageData }) {
  return (
    <div
      className={`inbox-message landing-inbox-message landing-inbox-message--${message.read ? 'read' : 'unread'}`}
      data-msg-id={message.id}
    >
      <AvatarView avatar={message.avatar} />
      <div className="inbox-message-body">
        <div className="inbox-message-top">
          <span className="inbox-message-sender">{message.sender}</span>
          <span className="inbox-message-email">{message.email}</span>
          <span className="inbox-message-time">{message.time}</span>
        </div>
        <p className="inbox-message-subject">{message.subject}</p>
        <p className="inbox-message-preview">{message.preview}</p>
      </div>
      <span className={`inbox-message-unread-dot${message.read ? ' is-read' : ''}`} />
    </div>
  );
}

export default function MessagingAnimation() {
  const [messages, setMessages] = useState<MessageData[]>(initialMessages);
  const boardRef = useRef<HTMLDivElement>(null);

  const messagesRef = useRef<MessageData[]>(messages);
  const cycleRef = useRef(3);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set(messages.map((m) => m.id)));
  // ids the layout effect below is allowed to FLIP-reposition for the
  // render about to commit, and their pre-mutation rects — same scoped
  // pattern as KanbanAnimation, so a message still animating out from
  // one commit is never re-measured mid-flight by an unrelated one.
  const movedIdsRef = useRef<Set<string>>(new Set());
  const firstRectsRef = useRef<Map<string, DOMRect>>(new Map());

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function commit(next: MessageData[], movedIds: string[] = []) {
      const board = boardRef.current;
      if (board) {
        movedIds.forEach((id) => {
          const msgEl = board.querySelector<HTMLElement>(`[data-msg-id="${id}"]`);
          if (msgEl) firstRectsRef.current.set(id, msgEl.getBoundingClientRect());
        });
      }
      movedIdsRef.current = new Set(movedIds);
      messagesRef.current = next;
      setMessages(next);
    }

    function markOneReadThenLoop() {
      const next = messagesRef.current.slice();
      const idx = next.findIndex((m) => !m.read);
      if (idx === -1) {
        timeoutsRef.current.push(setTimeout(removeOldestRead, REMOVE_PAUSE));
        return;
      }
      next[idx] = { ...next[idx], read: true };
      commit(next);
      timeoutsRef.current.push(setTimeout(markOneReadThenLoop, READ_STEP_PAUSE));
    }

    function removeOldestRead() {
      const current = messagesRef.current;
      let removeIdx = -1;
      for (let i = current.length - 1; i >= 0; i--) {
        if (current[i].read) { removeIdx = i; break; }
      }
      if (removeIdx === -1) {
        timeoutsRef.current.push(setTimeout(addNewMessage, ADD_PAUSE));
        return;
      }
      const target = current[removeIdx];
      const board = boardRef.current;
      const targetEl = board?.querySelector<HTMLElement>(`[data-msg-id="${target.id}"]`);
      const remainingIds = current.filter((_, i) => i !== removeIdx).map((m) => m.id);

      function finishRemoval() {
        commit(current.filter((_, i) => i !== removeIdx), remainingIds);
        timeoutsRef.current.push(setTimeout(addNewMessage, ADD_PAUSE));
      }

      if (targetEl && !reduceMotion) {
        // Transform and color ride the same transition, so it reddens
        // progressively in step with how far it has slid rather than
        // the two effects feeling separate.
        targetEl.style.transition = `transform ${EXIT_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1), background-color ${EXIT_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1), border-color ${EXIT_DURATION}ms ease, opacity ${EXIT_DURATION}ms ease`;
        targetEl.style.transform = 'translateX(130%)';
        targetEl.style.backgroundColor = 'var(--rose)';
        targetEl.style.borderColor = 'var(--rose)';
        targetEl.style.opacity = '0';
        timeoutsRef.current.push(setTimeout(finishRemoval, EXIT_DURATION));
      } else {
        finishRemoval();
      }
    }

    function addNewMessage() {
      const fresh = makeMessage(cycleRef.current++, false);
      // The existing messages need to FLIP-glide down to make room, in
      // step with the new one fading in above them — without listing
      // their ids as moved, they'd just snap straight to their new
      // (lower) position instantly, which is what read as choppy rather
      // than one organic motion.
      const existingIds = messagesRef.current.map((m) => m.id);
      commit([fresh, ...messagesRef.current], existingIds);
      timeoutsRef.current.push(setTimeout(loop, LOOP_PAUSE));
    }

    function loop() {
      markOneReadThenLoop();
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        timeoutsRef.current.push(setTimeout(loop, LOOP_PAUSE));
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Same scoped FLIP as KanbanAnimation: only ids in movedIdsRef get
  // repositioned (the messages that shifted up to close the gap left by
  // a removal), and any id never seen before gets a fade/slide-in
  // entrance instead — nothing else is touched.
  useLayoutEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const moved = movedIdsRef.current;
    const firsts = firstRectsRef.current;

    board.querySelectorAll<HTMLElement>('[data-msg-id]').forEach((msgEl) => {
      const id = msgEl.dataset.msgId!;
      const isNew = !seenIdsRef.current.has(id);
      seenIdsRef.current.add(id);
      if (reduceMotion) return;

      function releaseTransitionAfter(duration: number) {
        const timeoutId = setTimeout(clear, duration + 80);
        msgEl.addEventListener('transitionend', clear, { once: true });
        function clear() {
          clearTimeout(timeoutId);
          msgEl.removeEventListener('transitionend', clear);
          msgEl.style.transition = '';
        }
      }

      if (isNew) {
        msgEl.style.transition = 'none';
        msgEl.style.opacity = '0';
        msgEl.style.transform = 'translateY(-16px) scale(0.96)';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            msgEl.style.transition = `opacity ${ENTRANCE_DURATION}ms ease, transform ${ENTRANCE_DURATION}ms cubic-bezier(0.34, 1.4, 0.64, 1)`;
            msgEl.style.opacity = '1';
            msgEl.style.transform = '';
            releaseTransitionAfter(ENTRANCE_DURATION);
          });
        });
        return;
      }

      if (!moved.has(id)) return;
      const first = firsts.get(id);
      if (!first) return;
      const last = msgEl.getBoundingClientRect();
      const dy = first.top - last.top;
      if (Math.abs(dy) > 0.5) {
        msgEl.style.transition = 'none';
        msgEl.style.transform = `translateY(${dy}px)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            msgEl.style.transition = `transform ${MOVE_DURATION}ms cubic-bezier(0.65, 0, 0.35, 1)`;
            msgEl.style.transform = '';
            releaseTransitionAfter(MOVE_DURATION);
          });
        });
      }
    });

    movedIdsRef.current = new Set();
    firsts.clear();
  }, [messages]);

  return (
    <div className="landing-messaging-board" ref={boardRef}>
      {messages.map((message) => <Message key={message.id} message={message} />)}
    </div>
  );
}
