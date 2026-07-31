import Link from 'next/link';
import { notFound } from 'next/navigation';
import TopbarActions from '@/components/TopbarActions';
import FolderDetailView from '@/components/FolderDetailView';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export default async function CustomFolderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  await ensureSchema();
  const rows = await sql`SELECT id, name FROM folders WHERE id = ${Number(id)} AND user_id = ${session.user.id}`;
  const folder = rows[0] as { id: number; name: string } | undefined;
  if (!folder) notFound();

  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <Link className="breadcrumb-item breadcrumb-item--link" href="/documents"><i data-lucide="folder"></i>Mes documents</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="folder"></i>{folder.name}</span>
          <TopbarActions />
        </div>
      </div>

      <section className="documents-view">
        <div className="documents-header">
          <h2 className="documents-title">{folder.name}</h2>
        </div>

        <FolderDetailView docs={[]} />
      </section>
    </>
  );
}
