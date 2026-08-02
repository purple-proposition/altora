'use client';
import Icon from '@/components/Icon';

import Image from 'next/image';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { INBOX_MESSAGES } from '@/lib/mockInbox';

const NOTIFICATIONS = [
  { icon: 'calendar-clock', text: 'Entretien "Stagiaire en Marketing H/F" demain à 18h00', time: 'Il y a 2h' },
  { icon: 'refresh-cw', text: 'Ta candidature chez NTN Europe est passée en "Entretien"', time: 'Il y a 5h' },
  { icon: 'file-check-2', text: 'Ton CV a bien été importé', time: 'Hier' },
];

// Portaled straight onto <body> instead of living inside .topbar-sticky (which
// has its own backdrop-filter for the sticky-header blur) — some browsers
// don't compose a descendant's backdrop-filter correctly when an ancestor
// already has one, which was silently killing the popover's own frosted-glass
// effect. Rendering outside that subtree removes the ambiguity entirely.
function usePopoverPosition(anchorRef: React.RefObject<HTMLElement | null>, open: boolean) {
  const [pos, setPos] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!open) return;
    function update() {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef]);

  return pos;
}

export default function TopbarActions() {
  const [open, setOpen] = useState<'mail' | 'bell' | null>(null);
  const [mounted, setMounted] = useState(false);
  const mailWrapRef = useRef<HTMLDivElement>(null);
  const bellWrapRef = useRef<HTMLDivElement>(null);
  const unreadCount = INBOX_MESSAGES.filter(m => m.unread).length;

  const mailPos = usePopoverPosition(mailWrapRef, open === 'mail');
  const bellPos = usePopoverPosition(bellWrapRef, open === 'bell');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // mousedown, not click — a same-node 'click' listener races the button's
    // own onClick handler (whichever fires first is inconsistent across
    // browsers), which made the popover open only some of the time.
    // mousedown always fires before the click that follows it, so this
    // decides purely on inside/outside with no ordering ambiguity, and the
    // ensuing click still toggles the state normally. closest(...) (rather
    // than a single ref.contains) covers both trigger buttons AND the
    // portaled popover content, which now lives outside this component's
    // own DOM subtree.
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Element;
      if (target.closest?.('.topbar-action-wrap, .topbar-popover')) return;
      setOpen(null);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  return (
    <div className="topbar-actions">
      <div className="topbar-action-wrap" ref={mailWrapRef}>
        <button
          type="button"
          className="topbar-bell"
          title="Messagerie"
          aria-label={unreadCount > 0 ? `Messagerie, ${unreadCount} non lus` : 'Messagerie'}
          onClick={() => setOpen(open === 'mail' ? null : 'mail')}
        >
          <Icon name="mail" />
          {unreadCount > 0 && <span className="topbar-bell-badge">{unreadCount}</span>}
        </button>
      </div>

      <div className="topbar-action-wrap" ref={bellWrapRef}>
        <button
          type="button"
          className="topbar-bell"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => setOpen(open === 'bell' ? null : 'bell')}
        >
          <Icon name="bell" />
        </button>
      </div>

      {mounted && createPortal(
        <div
          className={`topbar-popover${open === 'mail' ? ' topbar-popover--visible' : ''}`}
          style={{ top: mailPos.top, right: mailPos.right }}
        >
          <div className="topbar-popover-header">Messagerie</div>
          <div className="topbar-message-list">
            {INBOX_MESSAGES.map((message, i) => (
              <Link href="/inbox" className="inbox-message inbox-message--compact" onClick={() => setOpen(null)} key={i}>
                <Image className="inbox-message-avatar" src={message.avatar} alt={message.senderName} width={40} height={40} />
                <div className="inbox-message-body">
                  <div className="inbox-message-top">
                    <span className="inbox-message-sender">{message.senderName}</span>
                    <span className="inbox-message-time">{message.time}</span>
                  </div>
                  <span className="inbox-message-subject">{message.subject}</span>
                  <p className="inbox-message-preview">{message.preview}</p>
                </div>
                {message.unread && <span className="inbox-message-unread-dot"></span>}
              </Link>
            ))}
          </div>
        </div>,
        document.body
      )}

      {mounted && createPortal(
        <div
          className={`topbar-popover${open === 'bell' ? ' topbar-popover--visible' : ''}`}
          style={{ top: bellPos.top, right: bellPos.right }}
        >
          <div className="topbar-popover-header">Notifications</div>
          <div className="topbar-notification-list">
            {NOTIFICATIONS.map((n, i) => (
              <div className="topbar-notification-item" key={i}>
                <Icon name={n.icon} />
                <div className="topbar-notification-body">
                  <p className="topbar-notification-text">{n.text}</p>
                  <span className="topbar-notification-time">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
