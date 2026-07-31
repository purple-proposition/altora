'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const NOTIFICATIONS = [
  { icon: 'calendar-clock', text: 'Entretien "Stagiaire en Marketing H/F" demain à 18h00', time: 'Il y a 2h' },
  { icon: 'refresh-cw', text: 'Ta candidature chez NTN Europe est passée en "Entretien"', time: 'Il y a 5h' },
  { icon: 'file-check-2', text: 'Ton CV a bien été importé', time: 'Hier' },
];

const INBOX_PREVIEW = {
  senderName: 'Rocket School',
  senderEmail: 'contact@rocket-school.eu',
  avatar: '/rocket-school-logo.jpg',
  subject: 'Job Dating Marketing & Digital — inscriptions ouvertes',
  preview: "Rocket School organise un job dating avec une dizaine d'entreprises partenaires le 18 septembre à Lyon. Places limitées, inscris-toi avant le 10 septembre.",
  time: '09:14',
};

export default function TopbarActions() {
  const [open, setOpen] = useState<'mail' | 'bell' | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
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
        </button>
        {open === 'mail' && (
          <div className="topbar-popover">
            <div className="topbar-popover-header">Messagerie</div>
            <Link href="/inbox" className="inbox-message inbox-message--compact" onClick={() => setOpen(null)}>
              <img className="inbox-message-avatar" src={INBOX_PREVIEW.avatar} alt={INBOX_PREVIEW.senderName} />
              <div className="inbox-message-body">
                <div className="inbox-message-top">
                  <span className="inbox-message-sender">{INBOX_PREVIEW.senderName}</span>
                  <span className="inbox-message-time">{INBOX_PREVIEW.time}</span>
                </div>
                <span className="inbox-message-subject">{INBOX_PREVIEW.subject}</span>
                <p className="inbox-message-preview">{INBOX_PREVIEW.preview}</p>
              </div>
            </Link>
          </div>
        )}
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
        {open === 'bell' && (
          <div className="topbar-popover">
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
        )}
      </div>
    </div>
  );
}
