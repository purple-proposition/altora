import Link from 'next/link';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';
import { createFolder, deleteFolder } from './actions';

type DocFile = { url: string; filename: string };

// Purely visual, non-interactive squares — they exist so the user can see
// what's in a folder at a glance, not to browse files. A folder holding more
// than one document collapses into a single fanned stack instead of a wall
// of squares; opening a file happens via the filename caption underneath.
function DocThumbGrid({ docs }: { docs: DocFile[] }) {
  if (docs.length === 0) return null;

  if (docs.length === 1) {
    const doc = docs[0];
    return (
      <div className="doc-thumb-grid">
        <div className="doc-thumb-item">
          <div className="doc-thumb-square">
            <embed src={doc.url} type="application/pdf" />
          </div>
          <a className="doc-thumb-name" href={doc.url} target="_blank" rel="noopener noreferrer">
            <i data-lucide="file-text"></i>{doc.filename}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-thumb-grid">
      <div className="doc-thumb-item">
        <div className="doc-thumb-square doc-thumb-fan">
          {docs.slice(0, 3).map((doc, i) => (
            <div className={`doc-thumb-fan-layer doc-thumb-fan-layer--${i}`} key={doc.url}>
              <embed src={doc.url} type="application/pdf" />
            </div>
          ))}
        </div>
        <span className="doc-thumb-name doc-thumb-name--static">
          <i data-lucide="files"></i>{docs.length} documents
        </span>
      </div>
    </div>
  );
}

export default async function DocumentsPage() {
  const session = await auth();

  let cvUrl = '';
  let cvFilename = '';
  let folders: { id: number; name: string }[] = [];

  if (session?.user?.id) {
    await ensureSchema();
    const [userRows, folderRows] = await Promise.all([
      sql`SELECT cv_url, cv_filename FROM users WHERE id = ${session.user.id}`,
      sql`SELECT id, name FROM folders WHERE user_id = ${session.user.id} ORDER BY created_at ASC`,
    ]);
    cvUrl = userRows[0]?.cv_url || '';
    cvFilename = userRows[0]?.cv_filename || '';
    folders = folderRows as { id: number; name: string }[];
  }

  const cvDocs: DocFile[] = cvUrl ? [{ url: cvUrl, filename: cvFilename || 'CV.pdf' }] : [];

  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
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
              <span className="folder-card-name">Mes CV</span>
              <span className="folder-card-count">{cvDocs.length}</span>
            </div>
            <div className="folder-card-body">
              {cvDocs.length ? <DocThumbGrid docs={cvDocs} /> : <p className="folder-empty">Aucun CV importé pour le moment.</p>}
            </div>
          </div>

          <div className="folder-card">
            <div className="folder-card-header">
              <i data-lucide="folder"></i>
              <span className="folder-card-name">Mes lettres de motivation</span>
              <span className="folder-card-count">0</span>
            </div>
            <div className="folder-card-body">
              <p className="folder-empty">Aucune lettre générée pour le moment.</p>
            </div>
          </div>

          {folders.map(folder => (
            <div className="folder-card" key={folder.id}>
              <div className="folder-card-header">
                <i data-lucide="folder"></i>
                <span className="folder-card-name">{folder.name}</span>
                <span className="folder-card-count">0</span>
                <form action={deleteFolder} className="folder-delete-form">
                  <input type="hidden" name="id" value={folder.id} />
                  <button type="submit" className="folder-delete-btn" aria-label={`Supprimer le dossier ${folder.name}`}>
                    <i data-lucide="trash-2"></i>
                  </button>
                </form>
              </div>
              <div className="folder-card-body">
                <p className="folder-empty">Dossier vide.</p>
              </div>
            </div>
          ))}

          <details className="folder-create">
            <summary className="folder-create-summary">
              <i data-lucide="folder-plus"></i>
              <span>Créer un dossier</span>
            </summary>
            <form action={createFolder} className="folder-create-form">
              <input type="text" name="name" placeholder="Nom du dossier…" maxLength={100} required />
              <button type="submit" className="btn-primary">Créer</button>
            </form>
          </details>
        </div>
      </section>
    </>
  );
}
