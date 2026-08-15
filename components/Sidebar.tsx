'use client';
import Icon from '@/components/Icon';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useSidebarCollapse } from './SidebarCollapseContext';
import { signOutAction } from './signOutAction';

type GenerationSummary = { id: string; company: string; poste: string; createdAt: string };

// The authenticated app was cut down to a single flow (upload CV → paste/
// link the offer → generate the CV + lettre, see GenerateForm.tsx) — this
// used to also list Accueil/kanban, Calendrier, Mes documents, Boîte de
// réception and École, all now unreachable (see middleware.ts). Only the
// generation history submenu survives, since it's directly about the one
// remaining flow rather than a separate section of the app.
export default function Sidebar({
  fullName,
  firstName,
}: {
  fullName: string;
  firstName: string;
  promotion?: string;
  isSchoolAdmin?: boolean;
}) {
  const { collapsed, mobileOpen, closeMobile } = useSidebarCollapse();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [history, setHistory] = useState<GenerationSummary[]>([]);

  function toggleHistory() {
    setHistoryOpen(prev => {
      const next = !prev;
      if (next && !historyLoaded) {
        setHistoryLoaded(true);
        fetch('/api/generations')
          .then(res => (res.ok ? res.json() : null))
          .then(data => { if (data?.generations) setHistory(data.generations); })
          .catch(() => {});
      }
      return next;
    });
  }

  return (
    <>
      {mobileOpen && <div className="sidebar-mobile-backdrop" onClick={closeMobile}></div>}
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
        <div className="sidebar-brand">
          <Image className="sidebar-logo" src="/rocket-school-logo.jpg" alt="Rocket School" width={32} height={32} priority />
          <span className="sidebar-brand-text">
            <span className="sidebar-brand-name">Rocket School</span>
          </span>
        </div>

        <nav className="sidebar-nav">
          <div className={`sidebar-item-group${historyOpen ? ' expanded' : ''}`}>
            <div className="sidebar-item sidebar-item--active">
              <Link href="/generate" className="sidebar-item-link-inner">
                <Icon name="file-text" />
                <span className="sidebar-item-label">ATS Booster</span>
              </Link>
              <button
                type="button"
                className="sidebar-item-chevron-btn"
                onClick={toggleHistory}
                aria-expanded={historyOpen}
                aria-controls="sidebar-generate-submenu"
                aria-label="Afficher les CV générés"
              >
                <Icon name="chevron-down" className="sidebar-item-chevron" />
              </button>
            </div>
            <div className="sidebar-submenu" id="sidebar-generate-submenu">
              {history.length === 0 && historyLoaded && (
                <span className="sidebar-submenu-empty">Aucun CV généré</span>
              )}
              {history.map(g => (
                <Link key={g.id} href={`/generate?historyId=${g.id}`} className="sidebar-subitem" title={[g.poste, g.company].filter(Boolean).join(' chez ')}>
                  <Icon name="file-text" />
                  <span className="sidebar-subitem-label">{[g.poste, g.company].filter(Boolean).join(' chez ') || 'CV généré'}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <Image className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} width={32} height={32} />
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{fullName || firstName}</span>
              <span className="sidebar-user-email">Étudiant</span>
            </span>
            <form action={signOutAction}>
              <button type="submit" className="sidebar-user-chevron" title="Se déconnecter" aria-label="Se déconnecter">
                <Icon name="log-out" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
