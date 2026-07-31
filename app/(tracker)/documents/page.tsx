import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import DocThumbGrid, { type DocFile } from '@/components/DocThumbGrid';
import FolderCard from '@/components/FolderCard';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';
import { createFolder } from './actions';

export default async function DocumentsPage() {
  const session = await auth();

  let cvUrl = '';
  let cvFilename = '';
  let folders: { id: number; name: string }[] = [];
  let folderFiles: Record<number, DocFile[]> = {};

  if (session?.user?.id) {
    await ensureSchema();
    const [userRows, folderRows, fileRows] = await Promise.all([
      sql`SELECT cv_url, cv_filename FROM users WHERE id = ${session.user.id}`,
      sql`SELECT id, name FROM folders WHERE user_id = ${session.user.id} ORDER BY created_at ASC`,
      sql`SELECT folder_id, url, filename, created_at FROM folder_files WHERE user_id = ${session.user.id} ORDER BY created_at ASC`,
    ]);
    cvUrl = userRows[0]?.cv_url || '';
    cvFilename = userRows[0]?.cv_filename || '';
    folders = folderRows as { id: number; name: string }[];
    folderFiles = (fileRows as { folder_id: number; url: string; filename: string; created_at: string }[]).reduce(
      (acc, row) => {
        (acc[row.folder_id] ||= []).push({ url: row.url, filename: row.filename, createdAt: new Date(row.created_at).getTime() });
        return acc;
      },
      {} as Record<number, DocFile[]>,
    );
  }

  const cvDocs: DocFile[] = cvUrl ? [{ url: cvUrl, filename: cvFilename || 'CV.pdf' }] : [];

  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="folder"></i>Mes documents</span>
          <TopbarActions />
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
              {cvDocs.length ? <DocThumbGrid docs={cvDocs} href="/documents/cv" /> : <p className="folder-empty">Aucun CV importé pour le moment.</p>}
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
            <FolderCard key={folder.id} folder={folder} docs={folderFiles[folder.id] || []} />
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
