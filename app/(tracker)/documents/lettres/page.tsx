import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import FolderDetailView from '@/components/FolderDetailView';

export default function LettresFolderPage() {
  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <Link className="breadcrumb-item breadcrumb-item--link" href="/documents"><i data-lucide="folder"></i>Mes documents</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="folder"></i>Mes lettres de motivation</span>
          <TopbarActions />
        </div>
      </div>

      <section className="documents-view">
        <div className="documents-header">
          <h2 className="documents-title">Mes lettres de motivation</h2>
        </div>

        <FolderDetailView docs={[]} />
      </section>
    </>
  );
}
