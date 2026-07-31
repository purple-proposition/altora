'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
  const isHome = pathname === '/';
  const isDocuments = pathname === '/documents';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img className="sidebar-logo" src="/rocket-school-logo.jpg" alt="Rocket School" />
        <span className="sidebar-brand-text">
          <span className="sidebar-brand-name">Rocket School</span>
          {promotion && <span className="sidebar-brand-promotion">{promotion}</span>}
        </span>
      </div>

      <nav className="sidebar-nav">
        <span className="sidebar-nav-label">Menu</span>

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
            <button type="button" className="sidebar-item" id="sidebar-suivi-toggle">
              <i data-lucide="list-checks"></i>
              <span className="sidebar-item-label">Mes tâches</span>
              <i data-lucide="chevron-down" className="sidebar-item-chevron"></i>
            </button>
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
            <span className="sidebar-item-label">Mes tâches</span>
          </Link>
        )}

        <Link href="/generate" className="sidebar-item"><i data-lucide="file-text"></i><span className="sidebar-item-label">Générer un CV</span></Link>

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

        <Link href="/documents" className={`sidebar-item${isDocuments ? ' sidebar-item--active' : ''}`}>
          <i data-lucide="folder"></i>
          <span className="sidebar-item-label">Mes documents</span>
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
          <Link href="/?view=home" className="sidebar-user">
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
  );
}
