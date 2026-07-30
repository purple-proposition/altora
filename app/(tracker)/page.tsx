import Script from 'next/script';

export default function TrackerPage() {
  return (
    <>
      <div className="app">
        <header className="topbar">
          <h1>Altora</h1>
        </header>

        <section className="summary-card">
          <p className="summary-text">
            <span id="greeting">Bonjour</span> <img className="avatar" src="/avatar.jpg" alt="Jesse" /> Jesse,{' '}
            <span className="period-trigger-wrap">
              <button type="button" className="period-trigger" id="period-trigger">
                <span id="period-label">aujourd&apos;hui</span><i data-lucide="chevron-down"></i>
              </button>
              <span className="period-popup hidden" id="period-popup">
                <button type="button" className="period-option active" data-period="today">Aujourd&apos;hui</button>
                <button type="button" className="period-option" data-period="week">Cette semaine</button>
                <button type="button" className="period-option" data-period="month">Ce mois-ci</button>
              </span>
            </span> tu as <span className="inline-pill inline-pill--slate"><i data-lucide="circle-dashed"></i><span id="summary-todo">0</span></span> offres à postuler,
            <span className="inline-pill inline-pill--amber"><i data-lucide="hourglass"></i><span id="summary-sent">0</span></span> candidatures envoyées,
            <span className="inline-pill inline-pill--green"><i data-lucide="target"></i><span id="summary-interview">0</span></span> entretiens planifiés et
            <span className="inline-pill inline-pill--rose"><i data-lucide="folder-x"></i><span id="summary-rejected">0</span></span> refus reçus.
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

        <div className="settings-trigger-wrap">
          <button className="fab settings-fab" id="settings-btn" title="Réglages">
            <i data-lucide="settings"></i>
          </button>
          <div className="theme-popup hidden" id="theme-popup">
            <button type="button" className="theme-option" data-theme="system"><i data-lucide="monitor"></i>Système</button>
            <button type="button" className="theme-option" data-theme="light"><i data-lucide="sun"></i>Clair</button>
            <button type="button" className="theme-option" data-theme="dark"><i data-lucide="moon"></i>Sombre</button>
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

      <div className="grid-overlay" id="grid-overlay"></div>

      <Script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js" strategy="afterInteractive" />
      <Script src="/tracker.js" strategy="afterInteractive" />
    </>
  );
}
