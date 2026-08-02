import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import FolderDetailView from '@/components/FolderDetailView';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';
import Icon from '@/components/Icon';

export default async function CvFolderPage() {
  const session = await auth();

  let cvUrl = '';
  let cvFilename = '';
  let cvThumbnailUrl = '';
  if (session?.user?.id) {
    await ensureSchema();
    const rows = await sql`SELECT cv_url, cv_filename, cv_thumbnail_url FROM users WHERE id = ${session.user.id}`;
    cvUrl = rows[0]?.cv_url || '';
    cvFilename = rows[0]?.cv_filename || '';
    cvThumbnailUrl = rows[0]?.cv_thumbnail_url || '';
  }

  const docs = cvUrl ? [{ url: cvUrl, filename: cvFilename || 'CV.pdf', thumbnailUrl: cvThumbnailUrl }] : [];

  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><Icon name="home" />Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <Link className="breadcrumb-item breadcrumb-item--link" href="/documents"><Icon name="folder" />Mes documents</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><Icon name="folder" />Mes CV</span>
          <TopbarActions />
        </div>
      </div>

      <section className="documents-view">
        <FolderDetailView title="Mes CV" docs={docs} />
      </section>
    </>
  );
}
