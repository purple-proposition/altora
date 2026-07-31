import Script from 'next/script';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export default async function DocumentsPage() {
  const session = await auth();
  const fullName = session?.user?.name || '';
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || '';

  let cvUrl = '';
  let cvFilename = '';
  if (session?.user?.id) {
    await ensureSchema();
    const rows = await sql`SELECT cv_url, cv_filename FROM users WHERE id = ${session.user.id}`;
    cvUrl = rows[0]?.cv_url || '';
    cvFilename = rows[0]?.cv_filename || '';
  }

  return (
    <>
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img className="sidebar-logo" src="/rocket-school-logo.jpg" alt="Rocket School" />
            <span className="sidebar-brand-text">
              <span className="sidebar-brand-name">Rocket School</span>
            </span>
          </div>

          <nav className="sidebar-nav">
            <span className="sidebar-nav-label">Menu</span>
            <a href="/?view=home" className="sidebar-item">
              <i data-lucide="home"></i>
              <span className="sidebar-item-label">Accueil</span>
            </a>
            <a href="/?view=tasks" className="sidebar-item">
              <i data-lucide="list-checks"></i>
              <span className="sidebar-item-label">Mes tâches</span>
            </a>
            <a href="/generate" className="sidebar-item"><i data-lucide="file-text"></i><span className="sidebar-item-label">Générer un CV</span></a>
            <a href="/?view=calendar" className="sidebar-item">
              <i data-lucide="calendar"></i>
              <span className="sidebar-item-label">Calendrier</span>
            </a>
            <a href="/documents" className="sidebar-item sidebar-item--active">
              <i data-lucide="folder"></i>
              <span className="sidebar-item-label">Mes documents</span>
            </a>
          </nav>

          <div className="sidebar-bottom">
            <a href="/?view=home" className="sidebar-user">
              <img className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} />
              <span className="sidebar-user-text">
                <span className="sidebar-user-name">{fullName || firstName}</span>
                <span className="sidebar-user-email">Étudiant</span>
              </span>
              <i data-lucide="chevron-right" className="sidebar-user-chevron"></i>
            </a>
          </div>
        </aside>

        <div className="app">
          <div className="topbar-sticky">
            <div className="topbar-breadcrumb">
              <a className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</a>
              <span className="breadcrumb-sep">/</span>
              <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="folder"></i>Mes documents</span>
            </div>
          </div>

          <section className="documents-view">
            <div className="documents-header">
              <h2 className="documents-title">Mes documents</h2>
            </div>

            <div className="documents-grid">
              <div className="folder-card">
                <div className="folder-card-header">
                  <i data-lucide="folder"></i>
                  <span className="folder-card-name">Mon CV</span>
                  <span className="folder-card-count">{cvUrl ? 1 : 0}</span>
                </div>
                <div className="folder-card-body">
                  {cvUrl ? (
                    <a className="file-row" href={cvUrl} target="_blank" rel="noopener noreferrer">
                      <i data-lucide="file-text"></i>
                      <span className="file-row-name">{cvFilename || 'CV.pdf'}</span>
                      <i data-lucide="external-link" className="file-row-action"></i>
                    </a>
                  ) : (
                    <p className="folder-empty">Aucun CV importé pour le moment.</p>
                  )}
                </div>
              </div>

              <div className="folder-card">
                <div className="folder-card-header">
                  <i data-lucide="folder"></i>
                  <span className="folder-card-name">Mes CV et lettres de motivation générées</span>
                  <span className="folder-card-count">0</span>
                </div>
                <div className="folder-card-body">
                  <p className="folder-empty">Aucun document généré pour le moment.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Script id="documents-theme" strategy="beforeInteractive">
        {`
          var theme = localStorage.getItem('altora-theme') || 'system';
          if (theme === 'dark' || theme === 'light') {
            document.documentElement.setAttribute('data-theme', theme);
          }
        `}
      </Script>
      <Script src="/lucide.js" strategy="beforeInteractive" />
      <Script id="documents-icons" strategy="afterInteractive">
        {'lucide.createIcons();'}
      </Script>
    </>
  );
}
