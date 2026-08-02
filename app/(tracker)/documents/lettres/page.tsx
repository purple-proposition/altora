import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import FolderDetailView from '@/components/FolderDetailView';
import Icon from '@/components/Icon';

export default function LettresFolderPage() {
  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <SidebarCollapseToggle />
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><Icon name="home" />Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <Link className="breadcrumb-item breadcrumb-item--link" href="/documents"><Icon name="folder" />Mes documents</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><Icon name="folder" />Mes lettres de motivation</span>
          <TopbarActions />
        </div>
      </div>

      <section className="documents-view">
        <FolderDetailView title="Mes lettres de motivation" docs={[]} />
      </section>
    </>
  );
}
