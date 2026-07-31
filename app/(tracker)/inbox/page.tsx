import Link from 'next/link';

export default function InboxPage() {
  return (
    <>
      <div className="topbar-sticky">
        <div className="topbar-breadcrumb">
          <Link className="breadcrumb-item breadcrumb-item--link" href="/?view=home"><i data-lucide="home"></i>Accueil</Link>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="mail"></i>Boîte de réception</span>
        </div>
      </div>

      <section className="documents-view">
        <div className="documents-header">
          <h2 className="documents-title">Boîte de réception</h2>
        </div>

        <div className="folder-card">
          <div className="folder-card-body">
            <p className="folder-empty">Aucun message pour le moment.</p>
          </div>
        </div>
      </section>
    </>
  );
}
