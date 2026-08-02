'use client';
import Icon from '@/components/Icon';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSidebarCollapse } from './SidebarCollapseContext';
import { INBOX_MESSAGES } from '@/lib/mockInbox';

type GenerationSummary = { id: string; company: string; poste: string; createdAt: string };
type FolderSummary = { id: number; name: string };

export default function Sidebar({
  fullName,
  firstName,
  promotion,
  isSchoolAdmin,
}: {
  fullName: string;
  firstName: string;
  promotion: string;
  isSchoolAdmin?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHome = pathname === '/';
  const isDocuments = pathname === '/documents';
  const isInbox = pathname === '/inbox';
  const isEcole = pathname === '/ecole';

  // The toggle button itself now lives in the topbar (SidebarCollapseToggle),
  // shared across pages via context — Sidebar just reads the collapsed state
  // to apply its own layout class.
  const { collapsed, mobileOpen, closeMobile } = useSidebarCollapse();

  // "Mes candidatures" should show how many are still waiting to be sent
  // even when you're not on the home board — tracker.js keeps this in sync
  // live while you're there (dragging cards between columns), this covers
  // every other page (and the first paint on load).
  const [todoCount, setTodoCount] = useState<number | null>(null);
  useEffect(() => {
    // On home, tracker.js drives the badge live off its own in-memory board
    // (via #sidebar-tasks-count) — refetching here too would be a second,
    // redundant DB round-trip on the one page that visits most often.
    if (isHome) return;
    // Aborting the previous request on rapid navigation matters here: without
    // it, quickly clicking through several menu items fires one fetch per
    // click that all stay in flight, and whichever happens to resolve LAST
    // wins and overwrites the badge — often with a stale count for a page
    // the visitor already left. It also means the browser's connection pool
    // doesn't fill up with abandoned requests that then delay the pages
    // actually being waited on.
    const controller = new AbortController();
    fetch('/api/cards', { signal: controller.signal })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data?.cards) return;
        setTodoCount(data.cards.filter((c: { status?: string }) => c.status === 'todo').length);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname, isHome]);

  const unreadCount = INBOX_MESSAGES.filter(m => m.unread).length;

  // Off the home page the candidatures submenu is React-owned (on home,
  // tracker.js drives the same UI against its live board).
  const [suiviOpen, setSuiviOpen] = useState(false);

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

  // The home page's own content (board, sidebar view-toggle buttons, modals)
  // fully unmounts and remounts every time the route leaves "/" and comes
  // back, so tracker.js's bindings need to be redone against the fresh DOM —
  // altoraInitApp() (defined in tracker.js) is a no-op if we're not on the
  // home route or if this exact mount is already bound, and handles its own
  // icon rendering for the markup it builds internally.
  useEffect(() => {
    const w = window as unknown as { altoraInitApp?: () => void };
    w.altoraInitApp?.();
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
        <Image className="sidebar-logo" src="/rocket-school-logo.jpg" alt="Rocket School" width={32} height={32} priority />
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-name">Rocket School</span>
          {promotion && <span className="sidebar-brand-promotion">{promotion}</span>}
        </span>
      </div>

      <nav className="sidebar-nav">
        {isHome ? (
          <button type="button" className="sidebar-item sidebar-item--active" id="sidebar-home-btn">
            <Icon name="home" />
            <span className="sidebar-item-label">Accueil</span>
          </button>
        ) : (
          <Link href="/?view=home" className="sidebar-item">
            <Icon name="home" />
            <span className="sidebar-item-label">Accueil</span>
          </Link>
        )}

        {isHome ? (
          <div className="sidebar-item-group">
            <div className="sidebar-item" id="sidebar-suivi-toggle" role="button" tabIndex={0}>
              <Icon name="list-checks" />
              <span className="sidebar-item-label">Mes candidatures</span>
              <button type="button" className="sidebar-item-badge" id="sidebar-tasks-count" aria-label="Candidatures à envoyer">{todoCount !== null && todoCount > 0 ? todoCount : ''}</button>
              <button
                type="button"
                className="sidebar-item-chevron-btn"
                id="sidebar-suivi-chevron"
                aria-expanded="false"
                aria-controls="sidebar-submenu"
                aria-label="Afficher les catégories de Mes candidatures"
              >
                <Icon name="chevron-down" className="sidebar-item-chevron" />
              </button>
            </div>
            <div className="sidebar-submenu" id="sidebar-submenu">
              <button type="button" className="sidebar-subitem" data-scroll-to="list-todo"><Icon name="circle-dashed" />À postuler</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-sent"><Icon name="hourglass" />Envoyé</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-interview"><Icon name="target" />Entretien</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-rejected"><Icon name="folder-x" />Refus</button>
            </div>
          </div>
        ) : (
          <div className={`sidebar-item-group${suiviOpen ? ' expanded' : ''}`}>
            <div className="sidebar-item">
              <Link href="/?view=tasks" className="sidebar-item-link-inner">
                <Icon name="list-checks" />
                <span className="sidebar-item-label">Mes candidatures</span>
              </Link>
              {todoCount !== null && todoCount > 0 && (
                <button type="button" className="sidebar-item-badge" aria-label="Candidatures à envoyer">{todoCount}</button>
              )}
              <button
                type="button"
                className="sidebar-item-chevron-btn"
                onClick={() => setSuiviOpen(prev => !prev)}
                aria-expanded={suiviOpen}
                aria-controls="sidebar-suivi-submenu-links"
                aria-label="Afficher les catégories de Mes candidatures"
              >
                <Icon name="chevron-down" className="sidebar-item-chevron" />
              </button>
            </div>
            <div className="sidebar-submenu" id="sidebar-suivi-submenu-links">
              <Link href="/?view=tasks&scroll=list-todo" className="sidebar-subitem"><Icon name="circle-dashed" />À postuler</Link>
              <Link href="/?view=tasks&scroll=list-sent" className="sidebar-subitem"><Icon name="hourglass" />Envoyé</Link>
              <Link href="/?view=tasks&scroll=list-interview" className="sidebar-subitem"><Icon name="target" />Entretien</Link>
              <Link href="/?view=tasks&scroll=list-rejected" className="sidebar-subitem"><Icon name="folder-x" />Refus</Link>
            </div>
          </div>
        )}

        {isHome ? (
          <button type="button" className="sidebar-item" id="sidebar-calendar-btn">
            <Icon name="calendar" />
            <span className="sidebar-item-label">Calendrier</span>
          </button>
        ) : (
          <Link href="/?view=calendar" className="sidebar-item">
            <Icon name="calendar" />
            <span className="sidebar-item-label">Calendrier</span>
          </Link>
        )}

        <div className={`sidebar-item-group${historyOpen ? ' expanded' : ''}`}>
          <div className={`sidebar-item${isGeneratePage ? ' sidebar-item--active' : ''}`}>
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

        <div className={`sidebar-item-group${foldersOpen ? ' expanded' : ''}`}>
          <div className={`sidebar-item${isDocuments ? ' sidebar-item--active' : ''}`}>
            <Link href="/documents" className="sidebar-item-link-inner">
              <Icon name="folder" />
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
              <Icon name="chevron-down" className="sidebar-item-chevron" />
            </button>
          </div>
          <div className="sidebar-submenu" id="sidebar-folders-submenu">
            <Link href="/documents/cv" className="sidebar-subitem">
              <Icon name="folder" />
              <span className="sidebar-subitem-label">Mes CV</span>
            </Link>
            <Link href="/documents/lettres" className="sidebar-subitem">
              <Icon name="folder" />
              <span className="sidebar-subitem-label">Mes lettres de motivation</span>
            </Link>
            {folders.map(f => (
              <Link key={f.id} href={`/documents/folder/${f.id}`} className="sidebar-subitem" title={f.name}>
                <Icon name="folder" />
                <span className="sidebar-subitem-label">{f.name}</span>
              </Link>
            ))}
          </div>
        </div>

        <Link href="/inbox" className={`sidebar-item${isInbox ? ' sidebar-item--active' : ''}`}>
          <Icon name="mail" />
          <span className="sidebar-item-label">Boîte de réception</span>
          {unreadCount > 0 && <span className="sidebar-item-badge">{unreadCount}</span>}
        </Link>

        {isSchoolAdmin && (
          <Link href="/ecole" className={`sidebar-item${isEcole ? ' sidebar-item--active' : ''}`}>
            <Icon name="graduation-cap" />
            <span className="sidebar-item-label">École</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-bottom">
        {isHome ? (
          <button type="button" className="sidebar-user" id="sidebar-profile-btn">
            <Image className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} width={32} height={32} />
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{fullName || firstName}</span>
              <span className="sidebar-user-email">Étudiant</span>
            </span>
            <Icon name="chevron-right" className="sidebar-user-chevron" />
          </button>
        ) : (
          <Link href="/?view=home&profile=1" className="sidebar-user">
            <Image className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} width={32} height={32} />
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{fullName || firstName}</span>
              <span className="sidebar-user-email">Étudiant</span>
            </span>
            <Icon name="chevron-right" className="sidebar-user-chevron" />
          </Link>
        )}
      </div>
      </aside>
    </>
  );
}
