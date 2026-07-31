import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export default async function DocumentsPage() {
  const session = await auth();

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
    </>
  );
}
