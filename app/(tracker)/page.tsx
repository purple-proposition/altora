import Script from 'next/script';
import Image from 'next/image';
import Link from 'next/link';
import TopbarActions from '@/components/TopbarActions';
import SidebarCollapseToggle from '@/components/SidebarCollapseToggle';
import { auth, signOut } from '@/auth';
import { getUserCv } from '@/lib/db';
import { assetVersion } from '@/lib/assetVersion';
import Icon from '@/components/Icon';

export default async function TrackerPage() {
  const session = await auth();
  const fullName = session?.user?.name || '';
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || '';
  const email = session?.user?.email || '';

  let cvUrl = '';
  let cvFilename = '';
  if (session?.user?.id) {
    const cv = await getUserCv(session.user.id);
    cvUrl = cv.cvUrl;
    cvFilename = cv.cvFilename;
  }

  const rawDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayLabel = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  // Escape "<" so a filename containing "</script>" can't break out of the
  // inline script tag below (JSON.stringify does not escape it on its own).
  const cvDataJson = JSON.stringify({ url: cvUrl, filename: cvFilename }).replace(/</g, '\\u003c');

  return (
    <>
        <div className="topbar-sticky">
          <div className="topbar-breadcrumb">
            <SidebarCollapseToggle />
            <button type="button" className="breadcrumb-item breadcrumb-item--link" id="breadcrumb-home-btn"><Icon name="home" />Accueil</button>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-item breadcrumb-item--active"><Icon name="users" /><span id="breadcrumb-active-label">Accueil</span></span>
            <TopbarActions />
          </div>

          <div className="topbar-toolbar hidden" id="topbar-toolbar">
            <div className="toolbar-left">
              <h1 className="toolbar-title">Mes candidatures</h1>
              <span className="toolbar-count" id="toolbar-count">0</span>
            </div>
            <div className="toolbar-right">
              <div className="toolbar-search">
                <Icon name="search" />
                <input type="text" id="board-search" placeholder="Rechercher une candidature..." />
              </div>
              <button type="button" className="toolbar-filter" title="Filtrer" aria-label="Filtrer"><Icon name="sliders-horizontal" /></button>
            </div>
          </div>
        </div>

        <section className="summary-card" id="view-home">
          <div className="summary-date">{todayLabel}</div>
          <h1 className="summary-greeting">
            <span id="greeting">Bonjour</span> <Image className="avatar" src="/avatar.jpg" alt={firstName} width={32} height={32} /> <button type="button" className="greeting-name-btn" id="greeting-name-btn">{firstName}</button>,
          </h1>
          <p className="summary-subtitle">
            <span className="period-trigger-wrap">
              <button type="button" className="period-trigger" id="period-trigger">
                <span id="period-label">Aujourd&apos;hui</span><Icon name="chevron-down" />
              </button>
              <span className="period-popup hidden" id="period-popup">
                <button type="button" className="period-option active" data-period="today">Aujourd&apos;hui</button>
                <button type="button" className="period-option" data-period="week">Cette semaine</button>
                <button type="button" className="period-option" data-period="month">Ce mois-ci</button>
              </span>
            </span>, tu as <span className="inline-pill inline-pill--slate"><Icon name="circle-dashed" /><span id="summary-todo">0</span></span> <span id="label-todo">offres à postuler</span>,
            <span className="inline-pill inline-pill--amber"><Icon name="hourglass" /><span id="summary-sent">0</span></span> <span id="label-sent">candidatures envoyées</span>,
            <span className="inline-pill inline-pill--green"><Icon name="target" /><span id="summary-interview">0</span></span> <span id="label-interview">entretiens planifiés</span> et
            <span className="inline-pill inline-pill--rose"><Icon name="folder-x" /><span id="summary-rejected">0</span></span> <span id="label-rejected">refus reçus</span>.
          </p>
        </section>

        <main className="board hidden" id="board">
          <div className="column" data-status="todo">
            <div className="column-header column-header--slate">
              <Icon name="circle-dashed" />
              <span className="column-header-label">À postuler</span>
              <span className="column-header-count" id="count-todo">0</span>
            </div>
            <div className="card-list" id="list-todo"></div>
            <button type="button" className="add-card-dashed" data-status="todo">+ Ajouter une nouvelle tâche</button>
          </div>

          <div className="column" data-status="sent">
            <div className="column-header column-header--amber">
              <Icon name="hourglass" />
              <span className="column-header-label">Envoyé</span>
              <span className="column-header-count" id="count-sent">0</span>
            </div>
            <div className="card-list" id="list-sent"></div>
            <button type="button" className="add-card-dashed" data-status="sent">+ Ajouter une nouvelle tâche</button>
          </div>

          <div className="column" data-status="interview">
            <div className="column-header column-header--green">
              <Icon name="target" />
              <span className="column-header-label">Entretien</span>
              <span className="column-header-count" id="count-interview">0</span>
            </div>
            <div className="card-list" id="list-interview"></div>
            <button type="button" className="add-card-dashed" data-status="interview">+ Ajouter une nouvelle tâche</button>
          </div>

          <div className="column" data-status="rejected">
            <div className="column-header column-header--rose">
              <Icon name="folder-x" />
              <span className="column-header-label">Refus</span>
              <span className="column-header-count" id="count-rejected">0</span>
            </div>
            <div className="card-list" id="list-rejected"></div>
            <button type="button" className="add-card-dashed" data-status="rejected">+ Ajouter une nouvelle tâche</button>
          </div>
        </main>

        <section className="calendar-view hidden" id="view-calendar">
          <div className="calendar-header">
            <h1 className="calendar-title" id="calendar-title"></h1>
            <div className="calendar-nav">
              <button type="button" className="calendar-nav-btn" id="calendar-prev" aria-label="Mois précédent"><Icon name="chevron-left" /></button>
              <button type="button" className="calendar-nav-btn" id="calendar-today" aria-label="Aujourd&apos;hui"><Icon name="circle" /></button>
              <button type="button" className="calendar-nav-btn" id="calendar-next" aria-label="Mois suivant"><Icon name="chevron-right" /></button>
              <span className="calendar-legend-trigger-wrap">
                <button type="button" className="calendar-nav-btn" id="calendar-legend-trigger" aria-label="Légende des couleurs" aria-expanded="false" aria-controls="calendar-legend-popup"><Icon name="circle-help" /></button>
                <div className="calendar-legend-popup hidden" id="calendar-legend-popup">
                  <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--entreprise"></span>Semaine en entreprise</span>
                  <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--formation"></span>Journée de formation</span>
                  <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--conges"></span>Congés pédagogique</span>
                  <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--examen"></span>Examens écrit/oral</span>
                  <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--examen_oral"></span>Examen oral (convocation)</span>
                  <span className="calendar-legend-item"><span className="calendar-legend-dot calendar-legend-dot--ferie"></span>Jour férié</span>
                </div>
              </span>
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
        </section>

        <div className="modal-overlay hidden" id="profile-overlay" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
          <div className="modal profile-modal" tabIndex={-1}>
            <button type="button" className="modal-close" id="profile-close" title="Fermer" aria-label="Fermer"><Icon name="x" /></button>
            <h2 id="profile-modal-title">Profil</h2>

            <div className="profile-header">
              <Image className="profile-avatar" src="/avatar.jpg" alt={firstName} width={56} height={56} />
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
                <button type="button" className="btn-add-contact" id="cv-import-btn"><Icon name="upload" />Importer</button>
                <button type="button" className="cv-filename-btn hidden" id="cv-filename-btn">
                  <Icon name="file-text" />
                  <span id="cv-filename-text"></span>
                </button>
              </div>
            </div>

            <div className="field-group">
              <span className="field-label">Thème</span>
              <div className="theme-picker-inline" id="theme-picker-inline">
                <button type="button" className="theme-option" data-theme="system"><Icon name="monitor" />Système</button>
                <button type="button" className="theme-option" data-theme="light"><Icon name="sun" />Clair</button>
                <button type="button" className="theme-option" data-theme="dark"><Icon name="moon" />Sombre</button>
              </div>
            </div>

            <div className="field-group">
              <Link href="/profil" className="btn-add-contact">
                <Icon name="user-cog" />Mon profil candidat
              </Link>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button type="submit" className="profile-logout"><Icon name="log-out" />Se déconnecter</button>
            </form>
          </div>
        </div>

        <div className="modal-overlay hidden" id="detail-overlay" role="dialog" aria-modal="true" aria-label="Détail de l'offre">
          <div className="modal detail-modal" tabIndex={-1}>
            <button type="button" className="modal-close" id="detail-close" title="Fermer" aria-label="Fermer"><Icon name="x" /></button>
            <div id="detail-content"></div>
          </div>
        </div>

        <div className="modal-overlay hidden" id="cv-preview-overlay" role="dialog" aria-modal="true" aria-labelledby="cv-preview-title">
          <div className="modal cv-preview-modal" tabIndex={-1}>
            <button type="button" className="modal-close" id="cv-preview-close" title="Fermer" aria-label="Fermer"><Icon name="x" /></button>
            <h2 id="cv-preview-title">Ton CV</h2>
            <iframe id="cv-preview-frame" className="cv-preview-frame" title="Aperçu du CV"></iframe>
          </div>
        </div>

        <div className="modal-overlay hidden" id="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal" tabIndex={-1}>
            <button type="button" className="modal-close" id="btn-close" title="Fermer" aria-label="Fermer"><Icon name="x" /></button>
            <h2 id="modal-title">Nouvelle offre</h2>
            <p className="modal-hint hidden" id="modal-hint">Colle le lien de l&apos;offre, tu pourras compléter les détails juste après.</p>
            <form id="card-form">
              <label>Lien de l&apos;offre
                <input type="url" id="field-url" placeholder="https://..." />
              </label>
              <p className="url-parse-status hidden" id="url-parse-status"></p>
              <details className="job-description-details" id="job-description-details">
                <summary className="job-description-summary">Texte de l&apos;offre (optionnel)</summary>
                <textarea
                  id="field-job-description"
                  rows={4}
                  placeholder="Rempli automatiquement si le lien peut être analysé, ou colle ici le texte de l'offre si le site le bloque. Sert uniquement à générer le CV plus tard, n'apparaît pas sur la carte."
                ></textarea>
              </details>
              <div className="field-row">
                <label>Poste <span className="field-required">*</span>
                  <input type="text" id="field-title" placeholder="Intitulé du poste" required aria-required="true" />
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
              <fieldset className="field-group">
                <legend className="field-label">Type de contrat</legend>
                <div className="contract-picker" id="contract-picker" role="radiogroup">
                  <button type="button" className="contract-btn" data-contract="Alternance" role="radio" aria-checked="false">Alternance</button>
                  <button type="button" className="contract-btn" data-contract="Stage" role="radio" aria-checked="false">Stage</button>
                  <button type="button" className="contract-btn" data-contract="Freelance" role="radio" aria-checked="false">Freelance</button>
                </div>
              </fieldset>
              <fieldset className="field-group">
                <legend className="field-label">Statut</legend>
                <div className="status-picker" id="status-picker" role="radiogroup">
                  <button type="button" className="status-btn status-btn--slate" data-status="todo" role="radio" aria-checked="false"><Icon name="circle-dashed" />À postuler</button>
                  <button type="button" className="status-btn status-btn--amber" data-status="sent" role="radio" aria-checked="false"><Icon name="hourglass" />Envoyé</button>
                  <button type="button" className="status-btn status-btn--green" data-status="interview" role="radio" aria-checked="false"><Icon name="target" />Entretien</button>
                  <button type="button" className="status-btn status-btn--rose" data-status="rejected" role="radio" aria-checked="false"><Icon name="folder-x" />Refus</button>
                </div>
              </fieldset>
              <div className="field-group">
                <button type="button" className="school-toggle-btn" id="field-school-toggle" data-school="false" role="switch" aria-checked="false">
                  <Icon name="graduation-cap" />
                  <span>Offre proposée par l&apos;école</span>
                  <span className="school-toggle-switch"></span>
                </button>
              </div>
              <fieldset className="field-group hidden" id="interview-stage-group">
                <legend className="field-label">Étape de l&apos;entretien</legend>
                <div className="interview-stage-picker" id="interview-stage-picker" role="radiogroup">
                  <button type="button" className="stage-btn" data-stage="1" role="radio" aria-checked="false">1er entretien</button>
                  <button type="button" className="stage-btn" data-stage="2" role="radio" aria-checked="false">2e entretien</button>
                  <button type="button" className="stage-btn" data-stage="final" role="radio" aria-checked="false">Entretien final</button>
                </div>
                <label className="interview-at-label">Date et heure de l&apos;entretien
                  <input type="datetime-local" id="field-interview-at" />
                </label>
              </fieldset>
              <label>Sans réponse après le
                <input type="date" id="field-deadline" />
              </label>
              <div className="field-group">
                <span className="field-label">Contact</span>
                <div id="contacts-list"></div>
                <button type="button" id="btn-add-contact" className="btn-add-contact"><Icon name="plus" />Ajouter un contact</button>
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

      <Script
        id="altora-cv-data"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: `window.__ALTORA_CV__ = ${cvDataJson};` }}
      />
      {/* Only the home page's kanban board/calendar (built imperatively by
          tracker.js) still uses data-lucide + this global runtime — every
          other page's icons are real lucide-react components now, so this
          no longer needs to load anywhere else (see (tracker)/layout.tsx). */}
      <Script id="altora-lucide" src={`/lucide.js?v=${assetVersion('lucide.js')}`} strategy="afterInteractive" />
      <Script src={`/tracker.js?v=${assetVersion('tracker.js')}`} strategy="afterInteractive" />
    </>
  );
}
