'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSidebarCollapse } from './SidebarCollapseContext';

type GenerationSummary = { id: string; company: string; poste: string; createdAt: string };
type FolderSummary = { id: number; name: string };

export default function Sidebar({
  fullName,
  firstName,
  promotion,
}: {
  fullName: string;
  firstName: string;
  promotion: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === '/';
  const isDocuments = pathname === '/documents';
  const isInbox = pathname === '/inbox';

  // The toggle button itself now lives in the topbar (SidebarCollapseToggle),
  // shared across pages via context — Sidebar just reads the collapsed state
  // to apply its own layout class.
  const { collapsed, mobileOpen, closeMobile } = useSidebarCollapse();

  // The generated-CVs list is only worth fetching once someone actually
  // opens the submenu — most visits never touch it.
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [history, setHistory] = useState<GenerationSummary[]>([]);
  const isGeneratePage = pathname === '/generate';

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

  // Same lazy-load-on-first-open pattern as the generation history above —
  // most visits never open this either.
  const [foldersOpen, setFoldersOpen] = useState(false);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  const [folders, setFolders] = useState<FolderSummary[]>([]);

  function toggleFolders() {
    setFoldersOpen(prev => {
      const next = !prev;
      if (next && !foldersLoaded) {
        setFoldersLoaded(true);
        fetch('/api/folders')
          .then(res => (res.ok ? res.json() : null))
          .then(data => { if (data?.folders) setFolders(data.folders); })
          .catch(() => {});
      }
      return next;
    });
  }

  // This layout (and this Sidebar) stays mounted across client-side
  // navigations between "/", "/documents", "/generate" — Next.js doesn't
  // remount a shared layout on every route change, so a one-shot
  // lucide.createIcons() call in the layout only ever renders whichever
  // page happened to be there when it first fired. Re-running it on every
  // route change is what actually keeps icons rendered on every page.
  useEffect(() => {
    const w = window as unknown as { lucide?: { createIcons: () => void }; altoraInitApp?: () => void };

    // Same root cause as the icons above: the home page's own content (board,
    // sidebar view-toggle buttons, modals) fully remounts every time the route
    // leaves "/" and comes back, so tracker.js's bindings need to be redone
    // against the fresh DOM — altoraInitApp() is a no-op if we're not on the
    // home route or if this exact mount is already bound.
    w.altoraInitApp?.();

    if (w.lucide) {
      w.lucide.createIcons();
      return;
    }
    const id = setInterval(() => {
      if (w.lucide) {
        w.lucide.createIcons();
        clearInterval(id);
      }
    }, 50);
    return () => clearInterval(id);
  }, [pathname, searchParams, collapsed]);

  // A route change is the clearest signal the visitor picked something —
  // close the mobile drawer so it doesn't stay covering the new page. A
  // no-op on desktop, since mobileOpen never becomes true there.
  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  return (
    <>
      {mobileOpen && <div className="sidebar-mobile-backdrop" onClick={closeMobile}></div>}
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
      <div className="sidebar-brand">
        <img className="sidebar-logo" src="/rocket-school-logo.jpg" alt="Rocket School" />
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-name">Rocket School</span>
          {promotion && <span className="sidebar-brand-promotion">{promotion}</span>}
        </span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Suivi</span>

        {isHome ? (
          <button type="button" className="sidebar-item sidebar-item--active" id="sidebar-home-btn">
            <i data-lucide="home"></i>
            <span className="sidebar-item-label">Accueil</span>
          </button>
        ) : (
          <Link href="/?view=home" className="sidebar-item">
            <i data-lucide="home"></i>
            <span className="sidebar-item-label">Accueil</span>
          </Link>
        )}

        {isHome ? (
          <div className="sidebar-item-group">
            <div className="sidebar-item" id="sidebar-suivi-toggle" role="button" tabIndex={0}>
              <i data-lucide="list-checks"></i>
              <span className="sidebar-item-label">Mes candidatures</span>
              <span className="sidebar-item-badge" id="sidebar-tasks-count"></span>
              <button
                type="button"
                className="sidebar-item-chevron-btn"
                id="sidebar-suivi-chevron"
                aria-expanded="false"
                aria-controls="sidebar-submenu"
                aria-label="Afficher les catégories de Mes candidatures"
              >
                <i data-lucide="chevron-down" className="sidebar-item-chevron"></i>
              </button>
            </div>
            <div className="sidebar-submenu" id="sidebar-submenu">
              <button type="button" className="sidebar-subitem" data-scroll-to="list-todo"><i data-lucide="circle-dashed"></i>À postuler</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-sent"><i data-lucide="hourglass"></i>Envoyé</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-interview"><i data-lucide="target"></i>Entretien</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-rejected"><i data-lucide="folder-x"></i>Refus</button>
            </div>
          </div>
        ) : (
          <Link href="/?view=tasks" className="sidebar-item">
            <i data-lucide="list-checks"></i>
            <span className="sidebar-item-label">Mes candidatures</span>
          </Link>
        )}

        {isHome ? (
          <button type="button" className="sidebar-item" id="sidebar-calendar-btn">
            <i data-lucide="calendar"></i>
            <span className="sidebar-item-label">Calendrier</span>
          </button>
        ) : (
          <Link href="/?view=calendar" className="sidebar-item">
            <i data-lucide="calendar"></i>
            <span className="sidebar-item-label">Calendrier</span>
          </Link>
        )}

        <span className="sidebar-nav-label sidebar-nav-label--group">Outils</span>

        <div className={`sidebar-item-group${historyOpen ? ' expanded' : ''}`}>
          <div className={`sidebar-item${isGeneratePage ? ' sidebar-item--active' : ''}`}>
            <Link href="/generate" className="sidebar-item-link-inner">
              <i data-lucide="file-text"></i>
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
              <i data-lucide="chevron-down" className="sidebar-item-chevron"></i>
            </button>
          </div>
          <div className="sidebar-submenu" id="sidebar-generate-submenu">
            {history.length === 0 && historyLoaded && (
              <span className="sidebar-submenu-empty">Aucun CV généré</span>
            )}
            {history.map(g => (
              <Link key={g.id} href={`/generate?historyId=${g.id}`} className="sidebar-subitem" title={[g.poste, g.company].filter(Boolean).join(' chez ')}>
                <i data-lucide="file-text"></i>
                <span className="sidebar-subitem-label">{[g.poste, g.company].filter(Boolean).join(' chez ') || 'CV généré'}</span>
              </Link>
            ))}
          </div>
        </div>

        <span className="sidebar-nav-label sidebar-nav-label--group">Espace</span>

        <div className={`sidebar-item-group${foldersOpen ? ' expanded' : ''}`}>
          <div className={`sidebar-item${isDocuments ? ' sidebar-item--active' : ''}`}>
            <Link href="/documents" className="sidebar-item-link-inner">
              <i data-lucide="folder"></i>
              <span className="sidebar-item-label">Mes documents</span>
            </Link>
            <button
              type="button"
              className="sidebar-item-chevron-btn"
              onClick={toggleFolders}
              aria-expanded={foldersOpen}
              aria-controls="sidebar-folders-submenu"
              aria-label="Afficher les dossiers"
            >
              <i data-lucide="chevron-down" className="sidebar-item-chevron"></i>
            </button>
          </div>
          <div className="sidebar-submenu" id="sidebar-folders-submenu">
            <Link href="/documents/cv" className="sidebar-subitem">
              <i data-lucide="folder"></i>
              <span className="sidebar-subitem-label">Mes CV</span>
            </Link>
            <Link href="/documents/lettres" className="sidebar-subitem">
              <i data-lucide="folder"></i>
              <span className="sidebar-subitem-label">Mes lettres de motivation</span>
            </Link>
            {folders.map(f => (
              <Link key={f.id} href={`/documents/folder/${f.id}`} className="sidebar-subitem" title={f.name}>
                <i data-lucide="folder"></i>
                <span className="sidebar-subitem-label">{f.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <Link href="/inbox" className={`sidebar-item${isInbox ? ' sidebar-item--active' : ''}`}>
          <i data-lucide="mail"></i>
          <span className="sidebar-item-label">Boîte de réception</span>
        </Link>
      </nav>

      <div className="sidebar-bottom">
        {isHome ? (
          <button type="button" className="sidebar-user" id="sidebar-profile-btn">
            <img className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} />
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{fullName || firstName}</span>
              <span className="sidebar-user-email">Étudiant</span>
            </span>
            <i data-lucide="chevron-right" className="sidebar-user-chevron"></i>
          </button>
        ) : (
          <Link href="/?view=home&profile=1" className="sidebar-user">
            <img className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} />
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{fullName || firstName}</span>
              <span className="sidebar-user-email">Étudiant</span>
            </span>
            <i data-lucide="chevron-right" className="sidebar-user-chevron"></i>
          </Link>
        )}
      </div>
      </aside>
    </>
  );
}
