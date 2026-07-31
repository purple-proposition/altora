import Script from 'next/script';
import { auth, signOut } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export default async function TrackerPage() {
  const session = await auth();
  const fullName = session?.user?.name || '';
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || '';
  const email = session?.user?.email || '';
  const userExtra = session?.user as { promotion?: string | null } | undefined;
  const promotion = userExtra?.promotion || '';

  let cvUrl = '';
  let cvFilename = '';
  if (session?.user?.id) {
    await ensureSchema();
    const rows = await sql`SELECT cv_url, cv_filename FROM users WHERE id = ${session.user.id}`;
    cvUrl = rows[0]?.cv_url || '';
    cvFilename = rows[0]?.cv_filename || '';
  }

  const rawDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  return (
    <>
      <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/rocket-school-logo.jpg" alt="Rocket School" />
          <span className="sidebar-brand-text">
            <span className="sidebar-brand-name">Rocket School</span>
            {promotion && <span className="sidebar-brand-promotion">{promotion}</span>}
          </span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Menu</span>
          <button type="button" className="sidebar-item sidebar-item--active" id="sidebar-home-btn">
            <i data-lucide="home"></i>
            <span className="sidebar-item-label">Accueil</span>
          </button>
          <div className="sidebar-item-group">
            <button type="button" className="sidebar-item" id="sidebar-suivi-toggle">
              <i data-lucide="list-checks"></i>
              <span className="sidebar-item-label">Mes tâches</span>
              <i data-lucide="chevron-down" className="sidebar-item-chevron"></i>
            </button>
            <div className="sidebar-submenu" id="sidebar-submenu">
              <button type="button" className="sidebar-subitem" data-scroll-to="list-todo"><i data-lucide="circle-dashed"></i>À postuler</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-sent"><i data-lucide="hourglass"></i>Envoyé</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-interview"><i data-lucide="target"></i>Entretien</button>
              <button type="button" className="sidebar-subitem" data-scroll-to="list-rejected"><i data-lucide="folder-x"></i>Refus</button>
            </div>
          </div>
          <a href="/generate" className="sidebar-item"><i data-lucide="file-text"></i><span className="sidebar-item-label">Générer un CV</span></a>
          <button type="button" className="sidebar-item" id="sidebar-calendar-btn">
            <i data-lucide="calendar"></i>
            <span className="sidebar-item-label">Calendrier</span>
          </button>
          <a href="/documents" className="sidebar-item"><i data-lucide="folder"></i><span className="sidebar-item-label">Mes documents</span></a>
        </nav>

        <div className="sidebar-bottom">
          <button type="button" className="sidebar-user" id="sidebar-profile-btn">
            <img className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} />
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{fullName || firstName}</span>
              <span className="sidebar-user-email">Étudiant</span>
            </span>
            <i data-lucide="chevron-right" className="sidebar-user-chevron"></i>
          </button>
        </div>
      </aside>

      <div className="app">
        <div className="topbar-sticky">
          <div className="topbar-breadcrumb">
            <span className="breadcrumb-item"><i data-lucide="home"></i>Rocket School</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item breadcrumb-item--active"><i data-lucide="users"></i><span id="breadcrumb-active-label">Accueil</span></span>
            <button type="button" className="topbar-bell" title="Notifications"><i data-lucide="bell"></i></button>
          </div>

          <div className="topbar-toolbar hidden" id="topbar-toolbar">
            <div className="toolbar-left">
              <span className="toolbar-title">Mes tâches</span>
              <span className="toolbar-count" id="toolbar-count">0</span>
            </div>
            <div className="toolbar-right">
              <div className="toolbar-search">
                <i data-lucide="search"></i>
                <input type="text" id="board-search" placeholder="Rechercher une candidature..." />
              </div>
              <button type="button" className="toolbar-filter" title="Filtrer"><i data-lucide="sliders-horizontal"></i></button>
            </div>
          </div>
        </div>

        <section className="summary-card" id="view-home">
          <div className="summary-date">{todayLabel}</div>
          <h2 className="summary-greeting">
            <span id="greeting">Bonjour</span> <img className="avatar" src="/avatar.jpg" alt={firstName} /> <button type="button" className="greeting-name-btn" id="greeting-name-btn">{firstName}</button>,
          </h2>
          <p className="summary-subtitle">
            <span className="period-trigger-wrap">
              <button type="button" className="period-trigger" id="period-trigger">
                <span id="period-label">Aujourd&apos;hui</span><i data-lucide="chevron-down"></i>
              </button>
              <span className="period-popup hidden" id="period-popup">
                <button type="button" className="period-option active" data-period="today">Aujourd&apos;hui</button>
                <button type="button" className="period-option" data-period="week">Cette semaine</button>
                <button type="button" className="period-option" data-period="month">Ce mois-ci</button>
              </span>
            </span>, tu as <span className="inline-pill inline-pill--slate"><i data-lucide="circle-dashed"></i><span id="summary-todo">0</span></span> <span id="label-todo">offres à postuler</span>,
            <span className="inline-pill inline-pill--amber"><i data-lucide="hourglass"></i><span id="summary-sent">0</span></span> <span id="label-sent">candidatures envoyées</span>,
            <span className="inline-pill inline-pill--green"><i data-lucide="target"></i><span id="summary-interview">0</span></span> <span id="label-interview">entretiens planifiés</span> et
            <span className="inline-pill inline-pill--rose"><i data-lucide="folder-x"></i><span id="summary-rejected">0</span></span> <span id="label-rejected">refus reçus</span>.
          </p>
        </section>

        <main className="board hidden" id="board">
          <div className="column" data-status="todo">
            <div className="column-header column-header--slate">
              <i data-lucide="circle-dashed"></i>
              <span className="column-header-label">À postuler</span>
              <span className="column-header-count" id="count-todo">0</span>
            </div>
            <div className="card-list" id="list-todo"></div>
            <button type="button" className="add-card-dashed" data-status="todo">+ Ajouter une nouvelle tâche</button>
          </div>

          <div className="column" data-status="sent">
            <div className="column-header column-header--amber">
              <i data-lucide="hourglass"></i>
              <span className="column-header-label">Envoyé</span>
              <span className="column-header-count" id="count-sent">0</span>
            </div>
            <div className="card-list" id="list-sent"></div>
            <button type="button" className="add-card-dashed" data-status="sent">+ Ajouter une nouvelle tâche</button>
          </div>

          <div className="column" data-status="interview">
            <div className="column-header column-header--green">
              <i data-lucide="target"></i>
              <span className="column-header-label">Entretien</span>
              <span className="column-header-count" id="count-interview">0</span>
            </div>
            <div className="card-list" id="list-interview"></div>
            <button type="button" className="add-card-dashed" data-status="interview">+ Ajouter une nouvelle tâche</button>
          </div>

          <div className="column" data-status="rejected">
            <div className="column-header column-header--rose">
              <i data-lucide="folder-x"></i>
              <span className="column-header-label">Refus</span>
              <span className="column-header-count" id="count-rejected">0</span>
            </div>
            <div className="card-list" id="list-rejected"></div>
            <button type="button" className="add-card-dashed" data-status="rejected">+ Ajouter une nouvelle tâche</button>
          </div>
        </main>

        <section className="calendar-view hidden" id="view-calendar">
          <div className="calendar-header">
            <h2 className="calendar-title" id="calendar-title"></h2>
            <div className="calendar-nav">
              <button type="button" className="calendar-nav-btn" id="calendar-prev" aria-label="Mois précédent"><i data-lucide="chevron-left"></i></button>
              <button type="button" className="calendar-nav-btn" id="calendar-today" aria-label="Aujourd&apos;hui"><i data-lucide="dot"></i></button>
              <button type="button" className="calendar-nav-btn" id="calendar-next" aria-label="Mois suivant"><i data-lucide="chevron-right"></i></button>
            </div>
          </div>

          <div className="calendar-grid">
            <div className="calendar-weekdays">
              <div className="calendar-weekday">Lun</div>
              <div className="calendar-weekday">Mar</div>
              <div className="calendar-weekday">Mer</div>
              <div className="calendar-weekday">Jeu</div>
              <div className="calendar-weekday">Ven</div>
              <div className="calendar-weekday">Sam</div>
              <div className="calendar-weekday">Dim</div>
            </div>
            <div className="calendar-weeks" id="calendar-weeks"></div>
          </div>

          <div className="calendar-legend">
            <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--entreprise"></span>Semaine en entreprise</span>
            <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--formation"></span>Journée de formation</span>
            <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--conges"></span>Congés pédagogique</span>
            <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--examen"></span>Examens écrit/oral</span>
            <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--examen_oral"></span>Examen oral (convocation)</span>
            <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--ferie"></span>Jour férié</span>
          </div>
        </section>

        <div className="modal-overlay hidden" id="profile-overlay">
          <div className="modal profile-modal">
            <button type="button" className="modal-close" id="profile-close" title="Fermer"><i data-lucide="x"></i></button>
            <h3>Profil</h3>

            <div className="profile-header">
              <img className="profile-avatar" src="/avatar.jpg" alt={firstName} />
              <div>
                <div className="profile-name-row">
                  <span className="profile-name">{fullName || firstName}</span>
                </div>
                <div className="profile-email">{email}</div>
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">Ton CV</span>
              <div className="cv-upload-row">
                <input type="file" id="cv-file-input" accept=".pdf,.doc,.docx" hidden />
                <button type="button" className="btn-add-contact" id="cv-import-btn"><i data-lucide="upload"></i>Importer</button>
                <button type="button" className="cv-filename-btn hidden" id="cv-filename-btn">
                  <i data-lucide="file-text"></i>
                  <span id="cv-filename-text"></span>
                </button>
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">Thème</span>
              <div className="theme-picker-inline" id="theme-picker-inline">
                <button type="button" className="theme-option" data-theme="system"><i data-lucide="monitor"></i>Système</button>
                <button type="button" className="theme-option" data-theme="light"><i data-lucide="sun"></i>Clair</button>
                <button type="button" className="theme-option" data-theme="dark"><i data-lucide="moon"></i>Sombre</button>
              </div>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button type="submit" className="profile-logout"><i data-lucide="log-out"></i>Se déconnecter</button>
            </form>
          </div>
        </div>

        <div className="modal-overlay hidden" id="detail-overlay">
          <div className="modal detail-modal">
            <button type="button" className="modal-close" id="detail-close" title="Fermer"><i data-lucide="x"></i></button>
            <div id="detail-content"></div>
          </div>
        </div>

        <div className="modal-overlay hidden" id="cv-preview-overlay">
          <div className="modal cv-preview-modal">
            <button type="button" className="modal-close" id="cv-preview-close" title="Fermer"><i data-lucide="x"></i></button>
            <h3 id="cv-preview-title">Ton CV</h3>
            <iframe id="cv-preview-frame" className="cv-preview-frame" title="Aperçu du CV"></iframe>
          </div>
        </div>

        <div className="modal-overlay hidden" id="modal-overlay">
          <div className="modal">
            <button type="button" className="modal-close" id="btn-close" title="Fermer"><i data-lucide="x"></i></button>
            <h3 id="modal-title">Nouvelle offre</h3>
            <p className="modal-hint hidden" id="modal-hint">Colle le lien de l&apos;offre — tu pourras compléter les détails juste après.</p>
            <form id="card-form">
              <label>Lien de l&apos;offre
                <input type="url" id="field-url" placeholder="https://..." />
              </label>
              <div className="field-row">
                <label>Poste <span className="field-required">*</span>
                  <input type="text" id="field-title" placeholder="Intitulé du poste" />
                </label>
                <label>Entreprise
                  <input type="text" id="field-company" placeholder="Nom de l'entreprise" />
                </label>
              </div>
              <div className="field-row">
                <label>Lieu
                  <input type="text" id="field-location" placeholder="Paris, télétravail…" />
                </label>
                <label>Rémunération
                  <input type="text" id="field-salary" placeholder="35-40k€, selon profil…" />
                </label>
              </div>
              <div className="field-group">
                <span className="field-label">Type de contrat</span>
                <div className="contract-picker" id="contract-picker">
                  <button type="button" className="contract-btn" data-contract="CDI">CDI</button>
                  <button type="button" className="contract-btn" data-contract="CDD">CDD</button>
                  <button type="button" className="contract-btn" data-contract="Alternance">Alternance</button>
                  <button type="button" className="contract-btn" data-contract="Stage">Stage</button>
                  <button type="button" className="contract-btn" data-contract="Freelance">Freelance</button>
                </div>
              </div>
              <div className="field-group">
                <span className="field-label">Statut</span>
                <div className="status-picker" id="status-picker">
                  <button type="button" className="status-btn status-btn--slate" data-status="todo"><i data-lucide="circle-dashed"></i>À postuler</button>
                  <button type="button" className="status-btn status-btn--amber" data-status="sent"><i data-lucide="hourglass"></i>Envoyé</button>
                  <button type="button" className="status-btn status-btn--green" data-status="interview"><i data-lucide="target"></i>Entretien</button>
                  <button type="button" className="status-btn status-btn--rose" data-status="rejected"><i data-lucide="folder-x"></i>Refus</button>
                </div>
              </div>
              <div className="field-group hidden" id="interview-stage-group">
                <span className="field-label">Étape de l&apos;entretien</span>
                <div className="interview-stage-picker" id="interview-stage-picker">
                  <button type="button" className="stage-btn" data-stage="1">1er entretien</button>
                  <button type="button" className="stage-btn" data-stage="2">2e entretien</button>
                  <button type="button" className="stage-btn" data-stage="final">Entretien final</button>
                </div>
              </div>
              <label>Sans réponse après le
                <input type="date" id="field-deadline" />
              </label>
              <div className="field-group">
                <span className="field-label">Contact</span>
                <div id="contacts-list"></div>
                <button type="button" id="btn-add-contact" className="btn-add-contact"><i data-lucide="plus"></i>Ajouter un contact</button>
              </div>
              <label>Notes
                <textarea id="field-notes" rows={3} placeholder="Contact, prochaine étape..."></textarea>
              </label>
              <div className="modal-actions">
                <button type="button" id="btn-delete" className="btn-danger hidden">Supprimer</button>
                <div className="modal-actions-right">
                  <button type="button" id="btn-cancel" className="btn-secondary">Annuler</button>
                  <button type="submit" className="btn-primary">Enregistrer</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
      </div>

      <div className="grid-overlay" id="grid-overlay"></div>

      <Script
        id="altora-cv-data"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: `window.__ALTORA_CV__ = ${JSON.stringify({ url: cvUrl, filename: cvFilename })};` }}
      />
      <Script src="/lucide.js" strategy="beforeInteractive" />
      <Script src="/tracker.js" strategy="afterInteractive" />
    </>
  );
}
