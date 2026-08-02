import { Suspense } from 'react';
import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import DocThumbGrid, { type DocFile } from '@/components/DocThumbGrid';
import FolderCard from '@/components/FolderCard';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';
import { createFolder } from './actions';
import Icon from '@/components/Icon';

export default async function DocumentsPage() {
  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><Icon name="home" />Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><Icon name="folder" />Mes documents</span>
          <TopbarActions />
        </div>
      </div>

      <section className="documents-view">
        <div className="documents-header">
          <h1 className="documents-title">Mes documents</h1>
          <details className="folder-create">
            <summary className="folder-create-trigger" aria-label="Créer un dossier" title="Créer un dossier">
              <Icon name="plus" />
            </summary>
            <form action={createFolder} className="folder-create-form">
              <input type="text" name="name" placeholder="Nom du dossier…" maxLength={100} required />
              <button type="submit" className="btn-primary">Créer</button>
            </form>
          </details>
        </div>

        {/* The breadcrumb/header above render immediately on navigation —
            only the grid (3 DB queries) streams in behind this boundary,
            instead of the whole page waiting on them. */}
        <Suspense fallback={<div className="documents-grid"><div className="route-skeleton-bar" style={{ height: 160, borderRadius: 16 }} /></div>}>
          <DocumentsGrid />
        </Suspense>
      </section>
    </>
  );
}

async function DocumentsGrid() {
  const session = await auth();

  let cvUrl = '';
  let cvFilename = '';
  let cvThumbnailUrl = '';
  let folders: { id: number; name: string }[] = [];
  let folderFiles: Record<number, DocFile[]> = {};

  if (session?.user?.id) {
    await ensureSchema();
    const [userRows, folderRows, fileRows] = await Promise.all([
      sql`SELECT cv_url, cv_filename, cv_thumbnail_url FROM users WHERE id = ${session.user.id}`,
      sql`SELECT id, name FROM folders WHERE user_id = ${session.user.id} ORDER BY created_at ASC`,
      sql`SELECT folder_id, url, filename, thumbnail_url, created_at FROM folder_files WHERE user_id = ${session.user.id} ORDER BY created_at ASC`,
    ]);
    cvUrl = userRows[0]?.cv_url || '';
    cvFilename = userRows[0]?.cv_filename || '';
    cvThumbnailUrl = userRows[0]?.cv_thumbnail_url || '';
    folders = folderRows as { id: number; name: string }[];
    folderFiles = (fileRows as { folder_id: number; url: string; filename: string; thumbnail_url: string | null; created_at: string }[]).reduce(
      (acc, row) => {
        (acc[row.folder_id] ||= []).push({ url: row.url, filename: row.filename, thumbnailUrl: row.thumbnail_url, createdAt: new Date(row.created_at).getTime() });
        return acc;
      },
      {} as Record<number, DocFile[]>,
    );
  }

  const cvDocs: DocFile[] = cvUrl ? [{ url: cvUrl, filename: cvFilename || 'CV.pdf', thumbnailUrl: cvThumbnailUrl }] : [];

  return (
    <div className="documents-grid">
      <div className="folder-card">
        <div className="folder-card-header">
          <Icon name="folder" />
          <span className="folder-card-name">Mes CV</span>
          <span className="folder-card-count">{cvDocs.length}</span>
        </div>
        <div className="folder-card-body">
          {cvDocs.length ? <DocThumbGrid docs={cvDocs} href="/documents/cv" /> : <p className="folder-empty">Aucun CV importé pour le moment.</p>}
        </div>
      </div>

      <div className="folder-card">
        <div className="folder-card-header">
          <Icon name="folder" />
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
    </div>
  );
}
