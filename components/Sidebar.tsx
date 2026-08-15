'use client';
import Icon from '@/components/Icon';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSidebarCollapse } from './SidebarCollapseContext';
import { signOutAction } from './signOutAction';

type GenerationSummary = { id: string; company: string; poste: string; createdAt: string };

// Panneau de gauche : une entrée pour démarrer une candidature, une pour le
// profil, puis la liste des fiches déjà générées, titrées par entreprise —
// chacune se rouvre telle qu'elle a été produite, pour y revenir ou la
// retoucher.
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeId = searchParams.get('historyId');
  const onProfile = searchParams.get('step') === 'profil';

  const [sessions, setSessions] = useState<GenerationSummary[]>([]);

  const loadSessions = useCallback(() => {
    fetch('/api/generations')
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (data?.generations) setSessions(data.generations); })
      .catch(() => {});
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // La liste doit se mettre à jour dès qu'une génération vient d'être
  // enregistrée, sans recharger la page : GenerateForm émet cet évènement
  // une fois la sauvegarde partie.
  useEffect(() => {
    const onChange = () => loadSessions();
    window.addEventListener('altora-generations-changed', onChange);
    return () => window.removeEventListener('altora-generations-changed', onChange);
  }, [loadSessions]);

  useEffect(() => {
    closeMobile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const onNewApplication = pathname === '/generate' && !activeId && !onProfile;

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
          <Link href="/generate" className={`sidebar-item${onNewApplication ? ' sidebar-item--active' : ''}`}>
            <Icon name="plus" />
            <span className="sidebar-item-label">Nouvelle candidature</span>
          </Link>

          <Link href="/generate?step=profil" className={`sidebar-item${onProfile ? ' sidebar-item--active' : ''}`}>
            <Icon name="user-cog" />
            <span className="sidebar-item-label">Mon profil</span>
          </Link>

          {sessions.length > 0 && (
            <>
              <span className="sidebar-section-label">Mes candidatures</span>
              {sessions.map(s => (
                <Link
                  key={s.id}
                  href={`/generate?historyId=${s.id}`}
                  className={`sidebar-item${activeId === s.id ? ' sidebar-item--active' : ''}`}
                  title={[s.poste, s.company].filter(Boolean).join(' chez ')}
                >
                  <Icon name="file-text" />
                  <span className="sidebar-item-label">{s.company || s.poste || 'Candidature'}</span>
                </Link>
              ))}
            </>
          )}
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
