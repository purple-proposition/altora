'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { INBOX_MESSAGES } from '@/lib/mockInbox';

const NOTIFICATIONS = [
  { icon: 'calendar-clock', text: 'Entretien "Stagiaire en Marketing H/F" demain à 18h00', time: 'Il y a 2h' },
  { icon: 'refresh-cw', text: 'Ta candidature chez NTN Europe est passée en "Entretien"', time: 'Il y a 5h' },
  { icon: 'file-check-2', text: 'Ton CV a bien été importé', time: 'Hier' },
];

export default function TopbarActions() {
  const [open, setOpen] = useState<'mail' | 'bell' | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const unreadCount = INBOX_MESSAGES.filter(m => m.unread).length;

  useEffect(() => {
    // mousedown, not click — a same-node 'click' listener races the button's
    // own onClick handler (whichever fires first is inconsistent across
    // browsers), which made the popover open only some of the time.
    // mousedown always fires before the click that follows it, so this
    // decides purely on inside/outside with no ordering ambiguity, and the
    // ensuing click still toggles the state normally.
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    const w = window as unknown as { lucide?: { createIcons: () => void } };
    w.lucide?.createIcons();
  }, [open]);

  return (
    <div className="topbar-actions" ref={wrapRef}>
      <div className="topbar-action-wrap">
        <button
          type="button"
          className="topbar-bell"
          title="Messagerie"
          aria-label="Messagerie"
          onClick={() => setOpen(open === 'mail' ? null : 'mail')}
        >
          <i data-lucide="mail"></i>
          {unreadCount > 0 && <span className="topbar-bell-badge">{unreadCount}</span>}
        </button>
        {/* Always mounted (never conditionally unmounted) so opacity/transform
            can actually transition in both directions — the same spring-in
            used by the period-popup and calendar-legend-popup elsewhere. */}
        <div className={`topbar-popover${open === 'mail' ? ' topbar-popover--visible' : ''}`}>
          <div className="topbar-popover-header">Messagerie</div>
          <div className="topbar-message-list">
            {INBOX_MESSAGES.map((message, i) => (
              <Link href="/inbox" className="inbox-message inbox-message--compact" onClick={() => setOpen(null)} key={i}>
                <img className="inbox-message-avatar" src={message.avatar} alt={message.senderName} />
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
        </div>
      </div>

      <div className="topbar-action-wrap">
        <button
          type="button"
          className="topbar-bell"
          title="Notifications"
          aria-label="Notifications"
          onClick={() => setOpen(open === 'bell' ? null : 'bell')}
        >
          <i data-lucide="bell"></i>
        </button>
        <div className={`topbar-popover${open === 'bell' ? ' topbar-popover--visible' : ''}`}>
          <div className="topbar-popover-header">Notifications</div>
          <div className="topbar-notification-list">
            {NOTIFICATIONS.map((n, i) => (
              <div className="topbar-notification-item" key={i}>
                <i data-lucide={n.icon}></i>
                <div className="topbar-notification-body">
                  <p className="topbar-notification-text">{n.text}</p>
                  <span className="topbar-notification-time">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
