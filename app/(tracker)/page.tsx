import Script from 'next/script';
import { auth, signOut } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export default async function TrackerPage() {
  const session = await auth();
  const fullName = session?.user?.name || '';
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || '';
  const email = session?.user?.email || '';
  const userExtra = session?.user as { school?: string | null; promotion?: string | null } | undefined;
  const school = userExtra?.school || '';
  const promotion = userExtra?.promotion || '';

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
      <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="sidebar-logo" src="/rocket-school-logo.jpg" alt="Rocket School" />
          <span className="sidebar-brand-name">Rocket School</span>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Menu</span>
          <div className="sidebar-item-group">
            <button type="button" className="sidebar-item sidebar-item--active" id="sidebar-suivi-toggle">
              <i data-lucide="layout-dashboard"></i>
              <span className="sidebar-item-label">Suivi des candidatures</span>
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
        </nav>

        <div className="sidebar-bottom">
          <button type="button" className="sidebar-item" id="settings-btn">
            <i data-lucide="settings"></i><span className="sidebar-item-label">Configuration</span>
          </button>
          <button type="button" className="sidebar-user" id="sidebar-profile-btn">
            <img className="sidebar-user-avatar" src="/avatar.jpg" alt={firstName} />
            <span className="sidebar-user-text">
              <span className="sidebar-user-name">{firstName}</span>
              <span className="sidebar-user-email">Étudiant{promotion ? ` · ${promotion}` : ''}</span>
            </span>
            <i data-lucide="chevron-right" className="sidebar-user-chevron"></i>
          </button>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/login' });
            }}
          >
            <button type="submit" className="sidebar-logout">Se déconnecter</button>
          </form>
        </div>
      </aside>

      <div className="app">
        <section className="summary-card">
          <p className="summary-text">
            <span id="greeting">Bonjour</span> <img className="avatar" src="/avatar.jpg" alt={firstName} /> <button type="button" className="greeting-name-btn" id="greeting-name-btn">{firstName}</button>,{' '}
            <span className="period-trigger-wrap">
              <button type="button" className="period-trigger" id="period-trigger">
                <span id="period-label">aujourd&apos;hui</span><i data-lucide="chevron-down"></i>
              </button>
              <span className="period-popup hidden" id="period-popup">
                <button type="button" className="period-option active" data-period="today">Aujourd&apos;hui</button>
                <button type="button" className="period-option" data-period="week">Cette semaine</button>
                <button type="button" className="period-option" data-period="month">Ce mois-ci</button>
              </span>
            </span> tu as <span className="inline-pill inline-pill--slate"><i data-lucide="circle-dashed"></i><span id="summary-todo">0</span></span> <span id="label-todo">offres à postuler</span>,
            <span className="inline-pill inline-pill--amber"><i data-lucide="hourglass"></i><span id="summary-sent">0</span></span> <span id="label-sent">candidatures envoyées</span>,
            <span className="inline-pill inline-pill--green"><i data-lucide="target"></i><span id="summary-interview">0</span></span> <span id="label-interview">entretiens planifiés</span> et
            <span className="inline-pill inline-pill--rose"><i data-lucide="folder-x"></i><span id="summary-rejected">0</span></span> <span id="label-rejected">refus reçus</span>.
          </p>
        </section>

        <main className="board" id="board">
          <div className="column" data-status="todo">
            <div className="column-top">
              <span className="stat-pill stat-pill--slate"><i data-lucide="circle-dashed"></i>À postuler</span>
              <button className="add-card-btn" data-status="todo" title="Ajouter une candidature"><i data-lucide="plus"></i></button>
            </div>
            <div className="stat-number-row"><span className="stat-value" id="stat-todo">0</span></div>
            <div className="stat-bar-row">
              <div className="stat-bar-track"><div className="stat-bar-fill stat-bar-fill--slate" id="bar-todo"></div></div>
              <span className="stat-bar-pct" id="pct-todo">0%</span>
            </div>
            <div className="card-list" id="list-todo"></div>
          </div>

          <div className="column" data-status="sent">
            <div className="column-top">
              <span className="stat-pill stat-pill--amber"><i data-lucide="hourglass"></i>Envoyé</span>
              <button className="add-card-btn" data-status="sent" title="Ajouter une candidature"><i data-lucide="plus"></i></button>
            </div>
            <div className="stat-number-row"><span className="stat-value" id="stat-sent">0</span></div>
            <div className="stat-bar-row">
              <div className="stat-bar-track"><div className="stat-bar-fill stat-bar-fill--amber" id="bar-sent"></div></div>
              <span className="stat-bar-pct" id="pct-sent">0%</span>
            </div>
            <div className="card-list" id="list-sent"></div>
          </div>

          <div className="column" data-status="interview">
            <div className="column-top">
              <span className="stat-pill stat-pill--green"><i data-lucide="target"></i>Entretien</span>
              <button className="add-card-btn" data-status="interview" title="Ajouter une candidature"><i data-lucide="plus"></i></button>
            </div>
            <div className="stat-number-row"><span className="stat-value" id="stat-interview">0</span></div>
            <div className="stat-bar-row">
              <div className="stat-bar-track"><div className="stat-bar-fill stat-bar-fill--green" id="bar-interview"></div></div>
              <span className="stat-bar-pct" id="pct-interview">0%</span>
            </div>
            <div className="card-list" id="list-interview"></div>
          </div>

          <div className="column" data-status="rejected">
            <div className="column-top">
              <span className="stat-pill stat-pill--rose"><i data-lucide="folder-x"></i>Refus</span>
              <button className="add-card-btn" data-status="rejected" title="Ajouter une candidature"><i data-lucide="plus"></i></button>
            </div>
            <div className="stat-number-row"><span className="stat-value" id="stat-rejected">0</span></div>
            <div className="stat-bar-row">
              <div className="stat-bar-track"><div className="stat-bar-fill stat-bar-fill--rose" id="bar-rejected"></div></div>
              <span className="stat-bar-pct" id="pct-rejected">0%</span>
            </div>
            <div className="card-list" id="list-rejected"></div>
          </div>
        </main>

        <div className="modal-overlay hidden" id="profile-overlay">
          <div className="modal profile-modal">
            <button type="button" className="modal-close" id="profile-close" title="Fermer"><i data-lucide="x"></i></button>
            <h3>Profil</h3>

            <div className="profile-header">
              <img className="profile-avatar" src="/avatar.jpg" alt={firstName} />
              <div>
                <div className="profile-name-row">
                  <span className="profile-name">{fullName || firstName}</span>
                  <span className="pill-pro">Compte pro</span>
                </div>
                <div className="profile-email">{email}</div>
              </div>
            </div>

            <div className="field-row">
              <div className="field-group">
                <span className="field-label">École</span>
                <div className="profile-static-value">{school || '—'}</div>
              </div>
              <div className="field-group">
                <span className="field-label">Promotion</span>
                <div className="profile-static-value">{promotion || '—'}</div>
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
          </div>
        </div>

        <div className="modal-overlay hidden" id="cv-preview-overlay">
          <div className="modal cv-preview-modal">
            <button type="button" className="modal-close" id="cv-preview-close" title="Fermer"><i data-lucide="x"></i></button>
            <h3 id="cv-preview-title">Ton CV</h3>
            <iframe id="cv-preview-frame" className="cv-preview-frame" title="Aperçu du CV"></iframe>
          </div>
        </div>

        <button className="fab" id="fab-import" title="Importer une offre">
          <i data-lucide="plus"></i>
        </button>

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
      <Script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js" strategy="afterInteractive" />
      <Script src="/tracker.js" strategy="afterInteractive" />
    </>
  );
}
