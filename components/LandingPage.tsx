import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Reveal from '@/components/Reveal';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import CountUpPercent from '@/components/CountUpPercent';
import TalentStack from '@/components/TalentStack';
import DragScrollCarousel from '@/components/DragScrollCarousel';
import QuoteCtaButton from '@/components/QuoteCtaButton';

// Public marketing landing page, shown at "/" only when signed out (see
// app/(tracker)/page.tsx and middleware.ts). Built entirely from the
// existing design tokens in app/tracker.css (--indigo, --card-bg,
// --radius-card/--radius-pill, etc.) rather than new one-off colors, so it
// stays visually identical to the rest of the app and follows the same
// light/dark theme switch instead of hardcoding one look like /login does.
//
// Hero and category order lead with écoles, not étudiants: per
// Altora_Concept_Projet.docx the paying decision-maker is a school's
// "responsable des relations entreprises / pédagogique", not the student —
// the doc explicitly warns against mirroring a candidate-first competitor's
// positioning, since Altora's real differentiation is being the CRM/copilot
// the school runs its whole promotion on.
export default function LandingPage() {
  // Same formatting as the real summary-date (app/(tracker)/page.tsx) —
  // computed at request time, so it always reads as "today" rather than
  // being hardcoded to whatever date this mockup was written on.
  const rawPreviewDate = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const previewDateLabel = rawPreviewDate.charAt(0).toUpperCase() + rawPreviewDate.slice(1);

  return (
    <div className="landing">
      <SiteNav />

      <div className="landing-card">
      <main className="landing-hero">
        <h1 className="landing-title landing-in landing-in--1">
          La plateforme qui optimise<br />votre taux de placement.
        </h1>
        <p className="landing-subtitle landing-in landing-in--2">
          Les écoles et leurs apprenants jonglent aujourd&apos;hui entre une multitude
          d&apos;outils. Avec Altora, tout se gère au même endroit pour les
          accompagner vers la réussite de leur alternance.
        </p>
        <div className="landing-hero-actions landing-in landing-in--3">
          <QuoteCtaButton className="landing-nav-cta landing-hero-cta" location="hero">Contacter un expert</QuoteCtaButton>
        </div>

        <div className="landing-preview landing-in landing-in--4" aria-hidden="true">
          {/* Mirrors the real .app-shell exactly: a transparent sidebar rail
              sitting flat on the page background, next to a separate white
              bordered card (.app) that holds the topbar + content — not one
              single box wrapping both, which is not how the real dashboard
              is built. */}
          <div className="landing-preview-shell">
            <div className="landing-preview-sidebar">
              <span className="landing-preview-sidebar-logo"><Icon name="graduation-cap" /></span>
              <nav className="landing-preview-sidebar-nav">
                <span className="landing-preview-sidebar-icon is-active"><Icon name="home" /></span>
                <span className="landing-preview-sidebar-icon"><Icon name="list-checks" /></span>
                <span className="landing-preview-sidebar-icon"><Icon name="calendar" /></span>
                <span className="landing-preview-sidebar-icon"><Icon name="file-text" /></span>
                <span className="landing-preview-sidebar-icon"><Icon name="folder" /></span>
                <span className="landing-preview-sidebar-icon"><Icon name="mail" /></span>
              </nav>
              <Image
                className="landing-preview-sidebar-avatar"
                src="/landing-preview-avatar.jpg"
                alt="Camille"
                width={28}
                height={28}
              />
            </div>
            <div className="landing-preview-card">
              <div className="landing-preview-titlebar">
                <span className="landing-preview-collapse-btn"><Icon name="panel-left-close" /></span>
                <span className="landing-preview-crumb landing-preview-crumb--active"><Icon name="home" />Accueil</span>
                <div className="landing-preview-window-actions">
                  <span className="landing-preview-window-btn"><Icon name="mail" /></span>
                  <span className="landing-preview-window-btn"><Icon name="bell" /></span>
                </div>
              </div>
              <div className="landing-preview-content">
                <div className="landing-preview-date">{previewDateLabel}</div>
                <div className="landing-preview-greeting-title">
                  Bonjour <Image className="landing-preview-greeting-avatar" src="/landing-preview-avatar.jpg" alt="Camille" width={20} height={20} /> Camille,
                </div>
                <div className="landing-preview-panel-row">
                  <div className="landing-preview-panel">
                    <div className="landing-preview-panel-title"><Icon name="list-checks" />À faire</div>
                    <div className="landing-preview-panel-list">
                      <span className="inline-pill inline-pill--slate"><Icon name="circle-dashed" />À postuler<span className="landing-preview-panel-count">8</span></span>
                      <span className="inline-pill inline-pill--amber"><Icon name="hourglass" />Envoyé<span className="landing-preview-panel-count">4</span></span>
                      <span className="inline-pill inline-pill--green"><Icon name="target" />Entretien<span className="landing-preview-panel-count">1</span></span>
                      <span className="inline-pill inline-pill--rose"><Icon name="folder-x" />Refus<span className="landing-preview-panel-count">0</span></span>
                    </div>
                  </div>
                  <div className="landing-preview-panel">
                    <div className="landing-preview-panel-title-row">
                      <div className="landing-preview-panel-title"><Icon name="calendar" />Calendrier</div>
                      <span className="landing-preview-panel-badge">3</span>
                    </div>
                    <div className="landing-preview-panel-list">
                      <span className="inline-pill inline-pill--green"><Icon name="target" />Entretien chez Sephora</span>
                      <span className="inline-pill inline-pill--cyan"><Icon name="briefcase" />Job dating entreprise</span>
                      <span className="inline-pill inline-pill--indigo"><Icon name="graduation-cap" />Rentrée en formation</span>
                    </div>
                  </div>
                  <div className="landing-preview-panel">
                    <div className="landing-preview-panel-title-row">
                      <div className="landing-preview-panel-title"><Icon name="mail" />Boîte de réception</div>
                      <span className="landing-preview-panel-badge">2</span>
                    </div>
                    <div className="landing-preview-panel-list">
                      <span className="inline-pill inline-pill--slate"><Icon name="mail" />Rentrée le 4 octobre</span>
                      <span className="inline-pill inline-pill--slate"><Icon name="mail" />Une nouvelle offre est disponible</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className="landing-showcase">
        <Reveal className="landing-showcase-row landing-showcase-row--jobboards">
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">Le matching se fait directement avec les job boards</h3>
            <p className="landing-showcase-body">
              Connecté aux job boards, Altora récupère automatiquement les
              offres, puis suggère celles qui correspondent au profil de
              chaque apprenant.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <div className="landing-matching-card">
              <div className="landing-matching-step">
                <div className="landing-matching-step-icon"><Icon name="map-pin" /></div>
                <div className="landing-matching-step-body">
                  <p className="landing-matching-step-label">Ville de l&apos;école</p>
                  <p className="landing-matching-step-result">Offres récupérées uniquement sur les villes où l&apos;école est implantée.</p>
                </div>
              </div>
              <div className="landing-matching-step">
                <div className="landing-matching-step-icon"><Icon name="car" /></div>
                <div className="landing-matching-step-body">
                  <p className="landing-matching-step-label">Mobilité de l&apos;apprenant</p>
                  <p className="landing-matching-step-result">Le rayon et le mode de transport renseignés écartent les offres trop loin.</p>
                </div>
              </div>
              <div className="landing-matching-step">
                <div className="landing-matching-step-icon"><Icon name="calendar-clock" /></div>
                <div className="landing-matching-step-body">
                  <p className="landing-matching-step-label">Rythme d&apos;alternance</p>
                  <p className="landing-matching-step-result">Seules les offres compatibles avec le rythme défini par l&apos;école sont conservées.</p>
                </div>
              </div>
              <div className="landing-matching-step">
                <div className="landing-matching-step-icon"><Icon name="graduation-cap" /></div>
                <div className="landing-matching-step-body">
                  <p className="landing-matching-step-label">Niveau requis</p>
                  <p className="landing-matching-step-result">L&apos;IA analyse la fiche de poste pour estimer le niveau requis.</p>
                </div>
              </div>
              <div className="landing-matching-step landing-matching-step--muted">
                <div className="landing-matching-step-icon"><Icon name="calendar" /></div>
                <div className="landing-matching-step-body">
                  <p className="landing-matching-step-label">Date de début</p>
                  <p className="landing-matching-step-result">Affichée à titre indicatif : les dates de début sont souvent négociables.</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row--kanban">
          <div className="landing-showcase-text landing-showcase-text--right">
            <h3 className="landing-showcase-title">Une seule boîte à outils, deux façons de s&apos;en servir</h3>
            <p className="landing-showcase-body">
              Côté apprenant, c&apos;est le cockpit de son alternance. Côté
              école, c&apos;est le même espace qui devient un vrai levier de
              suivi et d&apos;accompagnement, jamais plus que ce que
              l&apos;apprenant choisit de partager.
            </p>
          </div>
          <DragScrollCarousel className="landing-showcase-carousel">
            <div className="landing-showcase-carousel-item">
            <div className="landing-kanban-board">
              <div className="column">
                <div className="column-header column-header--slate">
                  <Icon name="circle-dashed" />
                  <span className="column-header-label">À faire</span>
                  <span className="column-header-count">3</span>
                </div>
                <div className="card-list">
                  <div className="card card--slate">
                    <span className="card-school-badge"><Icon name="graduation-cap" />Proposée par l&apos;école</span>
                    <div className="card-heading">
                      <span className="card-title">Alternance Marketing Digital</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">L&apos;Oréal</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Clichy</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                      <span className="card-link card-link--generate"><Icon name="sparkles" />Générer CV</span>
                    </div>
                  </div>
                  <div className="card card--slate">
                    <div className="card-heading">
                      <span className="card-title">Assistant chef de projet</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">Decathlon</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Paris 15e</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                      <span className="card-link card-link--generate"><Icon name="sparkles" />Générer CV</span>
                    </div>
                  </div>
                  <div className="card card--slate">
                    <span className="card-school-badge"><Icon name="graduation-cap" />Proposée par l&apos;école</span>
                    <div className="card-heading">
                      <span className="card-title">Alternance Growth Marketing</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">Doctolib</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Paris 9e</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                      <span className="card-link card-link--generate"><Icon name="sparkles" />Générer CV</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="column-header column-header--amber">
                  <Icon name="hourglass" />
                  <span className="column-header-label">Envoyé</span>
                  <span className="column-header-count">3</span>
                </div>
                <div className="card-list">
                  <div className="card card--amber">
                    <div className="card-heading">
                      <span className="card-title">Chargé de communication</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">BlaBlaCar</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Paris 11e</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                    </div>
                  </div>
                  <div className="card card--amber">
                    <div className="card-heading">
                      <span className="card-title">Alternant CRM &amp; Data Marketing</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">Sephora</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Neuilly-sur-Seine</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                    </div>
                  </div>
                  <div className="card card--amber">
                    <div className="card-heading">
                      <span className="card-title">Chargé de Projet Marketing</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">Rocket School</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Paris 8e</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="column">
                <div className="column-header column-header--green">
                  <Icon name="target" />
                  <span className="column-header-label">Entretien</span>
                  <span className="column-header-count">2</span>
                </div>
                <div className="card-list">
                  <div className="card card--green">
                    <div className="card-heading">
                      <span className="card-title">Alternance RH</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">Sephora</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Neuilly-sur-Seine</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                    </div>
                    <span className="card-interview-pill"><Icon name="calendar" />Le 31 juillet à 18h00</span>
                  </div>
                  <div className="card card--green">
                    <div className="card-heading">
                      <span className="card-title">Assistant Chef de Produit</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">L&apos;Oréal</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Clichy</span>
                    </div>
                    <div className="card-link-row">
                      <span className="card-link"><Icon name="external-link" />Voir l&apos;offre</span>
                    </div>
                    <span className="card-interview-pill"><Icon name="calendar" />Le 5 août à 10h30</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-showcase-caption">
              <div className="landing-showcase-caption-header">
                <div className="landing-feature-icon"><Icon name="list-checks" /></div>
                <h3 className="landing-showcase-caption-title">À faire</h3>
              </div>
              <p className="landing-feature-text">
                Côté apprenant, c&apos;est son tableau de candidatures, avec les
                offres qu&apos;il ajoute et celles que l&apos;école lui suggère.
                Côté école, c&apos;est le même tableau qui devient la base des
                points de suivi : où il en est, à quoi il a déjà postulé,
                s&apos;il faut relancer.
              </p>
            </div>
            </div>

            <div className="landing-showcase-carousel-item">
            <div className="landing-messaging-board">
              <div className="inbox-message landing-inbox-message landing-inbox-message--unread">
                <span className="landing-inbox-avatar landing-inbox-avatar--person">
                  <Image src="/landing-preview-avatar-cassandra.jpg" alt="Cassandra" fill sizes="28px" />
                </span>
                <div className="inbox-message-body">
                  <div className="inbox-message-top">
                    <span className="inbox-message-sender">Cassandra de Lumina School</span>
                    <span className="inbox-message-email">cassandra@lumina-school.fr</span>
                    <span className="inbox-message-time">09:14</span>
                  </div>
                  <p className="inbox-message-subject">Ton CV a été mis à jour, tout est prêt pour BlaBlaCar</p>
                  <p className="inbox-message-preview">J&apos;ai relu ta candidature, n&apos;oublie pas d&apos;ajouter ton projet marketing avant de l&apos;envoyer.</p>
                </div>
                <span className="inbox-message-unread-dot" />
              </div>
              <div className="inbox-message landing-inbox-message landing-inbox-message--unread">
                <span className="landing-inbox-avatar landing-inbox-avatar--school"><Icon name="target" /></span>
                <div className="inbox-message-body">
                  <div className="inbox-message-top">
                    <span className="inbox-message-sender">Altora</span>
                    <span className="inbox-message-email">notifications@altora.fr</span>
                    <span className="inbox-message-time">11:02</span>
                  </div>
                  <p className="inbox-message-subject">Nouvelle offre compatible à 92% avec ton profil</p>
                  <p className="inbox-message-preview">Alternance Growth Marketing chez Doctolib, à Paris 9e. Génère ton CV en un clic.</p>
                </div>
                <span className="inbox-message-unread-dot" />
              </div>
              <div className="inbox-message landing-inbox-message landing-inbox-message--read">
                <span className="landing-inbox-avatar landing-inbox-avatar--school"><Icon name="graduation-cap" /></span>
                <div className="inbox-message-body">
                  <div className="inbox-message-top">
                    <span className="inbox-message-sender">Lumina School</span>
                    <span className="inbox-message-email">contact@lumina-school.fr</span>
                    <span className="inbox-message-time">Hier</span>
                  </div>
                  <p className="inbox-message-subject">Rappel : évaluations B3 les 24, 25 et 26 juin</p>
                  <p className="inbox-message-preview">Le planning détaillé des évaluations est disponible sur ton espace élève.</p>
                </div>
              </div>
            </div>
            <div className="landing-showcase-caption">
              <div className="landing-showcase-caption-header">
                <div className="landing-feature-icon"><Icon name="mail" /></div>
                <h3 className="landing-showcase-caption-title">Boîte de réception</h3>
              </div>
              <p className="landing-feature-text">
                Côté apprenant, c&apos;est là qu&apos;arrivent ses rappels de
                candidature. Côté école, c&apos;est le canal direct vers chaque
                apprenant pour toute la communication interne, sans dépendre
                de sa messagerie personnelle.
              </p>
            </div>
            </div>

            <div className="landing-showcase-carousel-item">
            <div className="landing-calendar-board">
              <div className="landing-calendar-weekdays">
                <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
              </div>
              <div className="landing-calendar-grid">
                <span className="landing-calendar-day landing-calendar-day--muted">27</span>
                <span className="landing-calendar-day landing-calendar-day--muted">28</span>
                <span className="landing-calendar-day landing-calendar-day--muted">29</span>
                <span className="landing-calendar-day landing-calendar-day--muted">30</span>
                <span className="landing-calendar-day landing-calendar-day--muted">31</span>
                <span className="landing-calendar-day">1</span>
                <span className="landing-calendar-day">2</span>
                <span className="landing-calendar-day landing-calendar-day--examen">3</span>
                <span className="landing-calendar-day landing-calendar-day--examen landing-calendar-day--today">4</span>
                <span className="landing-calendar-day landing-calendar-day--examen landing-calendar-day--has-event">
                  <span className="landing-calendar-day-number">5</span>
                  <span className="card-interview-pill landing-calendar-day-event"><Icon name="target" />L&apos;Oréal</span>
                </span>
                <span className="landing-calendar-day landing-calendar-day--examen">6</span>
                <span className="landing-calendar-day landing-calendar-day--examen">7</span>
                <span className="landing-calendar-day">8</span>
                <span className="landing-calendar-day">9</span>
                <span className="landing-calendar-day landing-calendar-day--conges">10</span>
                <span className="landing-calendar-day landing-calendar-day--conges">11</span>
                <span className="landing-calendar-day landing-calendar-day--conges">12</span>
                <span className="landing-calendar-day landing-calendar-day--conges">13</span>
                <span className="landing-calendar-day landing-calendar-day--conges">14</span>
                <span className="landing-calendar-day landing-calendar-day--ferie">15</span>
                <span className="landing-calendar-day">16</span>
                <span className="landing-calendar-day landing-calendar-day--formation">17</span>
                <span className="landing-calendar-day landing-calendar-day--formation">18</span>
                <span className="landing-calendar-day landing-calendar-day--formation">19</span>
                <span className="landing-calendar-day landing-calendar-day--formation">20</span>
                <span className="landing-calendar-day landing-calendar-day--formation">21</span>
                <span className="landing-calendar-day">22</span>
                <span className="landing-calendar-day">23</span>
                <span className="landing-calendar-day landing-calendar-day--entreprise">24</span>
                <span className="landing-calendar-day landing-calendar-day--entreprise">25</span>
                <span className="landing-calendar-day landing-calendar-day--entreprise">26</span>
                <span className="landing-calendar-day landing-calendar-day--entreprise">27</span>
                <span className="landing-calendar-day landing-calendar-day--entreprise">28</span>
                <span className="landing-calendar-day">29</span>
                <span className="landing-calendar-day">30</span>
                <span className="landing-calendar-day landing-calendar-day--entreprise">31</span>
                <span className="landing-calendar-day landing-calendar-day--muted">1</span>
                <span className="landing-calendar-day landing-calendar-day--muted">2</span>
                <span className="landing-calendar-day landing-calendar-day--muted">3</span>
                <span className="landing-calendar-day landing-calendar-day--muted">4</span>
                <span className="landing-calendar-day landing-calendar-day--muted">5</span>
                <span className="landing-calendar-day landing-calendar-day--muted">6</span>
              </div>
            </div>
            <div className="landing-showcase-caption">
              <div className="landing-showcase-caption-header">
                <div className="landing-feature-icon"><Icon name="calendar" /></div>
                <h3 className="landing-showcase-caption-title">Calendrier</h3>
              </div>
              <p className="landing-feature-text">
                Côté apprenant, c&apos;est son planning : dates butoirs,
                entretiens à venir. Côté école, c&apos;est le même calendrier
                qui accueille les rentrées, les périodes en entreprise et
                les points de suivi.
              </p>
            </div>
            </div>

            <div className="landing-showcase-carousel-item landing-showcase-carousel-item--tail">
            <div className="documents-grid landing-documents-board">
              <div className="folder-card">
                <div className="folder-card-header">
                  <Icon name="folder" />
                  <span className="folder-card-name">Mes CV</span>
                </div>
                <div className="folder-card-body">
                  <div className="doc-thumb-grid">
                    <div className="doc-thumb-bare">
                      <div className="doc-thumb-sheet">
                        <div className="doc-thumb-page">
                          <span className="doc-thumb-page-title" />
                          <span className="doc-thumb-page-line" />
                          <span className="doc-thumb-page-line" />
                          <span className="doc-thumb-page-line doc-thumb-page-line--short" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="folder-card">
                <div className="folder-card-header">
                  <Icon name="folder" />
                  <span className="folder-card-name">Mes lettres de motivation</span>
                </div>
                <div className="folder-card-body">
                  <p className="folder-empty">Aucune lettre générée pour le moment.</p>
                </div>
              </div>
              <div className="folder-card">
                <div className="folder-card-header">
                  <Icon name="folder" />
                  <span className="folder-card-name">Cours</span>
                </div>
                <div className="folder-card-body">
                  <div className="doc-thumb-grid">
                    <div className="doc-thumb-bare doc-thumb-fan">
                      <div className="doc-thumb-fan-layer doc-thumb-fan-layer--0">
                        <div className="doc-thumb-sheet">
                          <div className="doc-thumb-page">
                            <span className="doc-thumb-page-title" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line doc-thumb-page-line--short" />
                          </div>
                        </div>
                      </div>
                      <div className="doc-thumb-fan-layer doc-thumb-fan-layer--1">
                        <div className="doc-thumb-sheet">
                          <div className="doc-thumb-page">
                            <span className="doc-thumb-page-title" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line doc-thumb-page-line--short" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="folder-card">
                <div className="folder-card-header">
                  <Icon name="folder" />
                  <span className="folder-card-name">Administratif</span>
                </div>
                <div className="folder-card-body">
                  <div className="doc-thumb-grid">
                    <div className="doc-thumb-bare doc-thumb-fan">
                      <div className="doc-thumb-fan-layer doc-thumb-fan-layer--0">
                        <div className="doc-thumb-sheet">
                          <div className="doc-thumb-page">
                            <span className="doc-thumb-page-title" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line doc-thumb-page-line--short" />
                          </div>
                        </div>
                      </div>
                      <div className="doc-thumb-fan-layer doc-thumb-fan-layer--1">
                        <div className="doc-thumb-sheet">
                          <div className="doc-thumb-page">
                            <span className="doc-thumb-page-title" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line doc-thumb-page-line--short" />
                          </div>
                        </div>
                      </div>
                      <div className="doc-thumb-fan-layer doc-thumb-fan-layer--2">
                        <div className="doc-thumb-sheet">
                          <div className="doc-thumb-page">
                            <span className="doc-thumb-page-title" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line" />
                            <span className="doc-thumb-page-line doc-thumb-page-line--short" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-showcase-caption">
              <div className="landing-showcase-caption-header">
                <div className="landing-feature-icon"><Icon name="folder" /></div>
                <h3 className="landing-showcase-caption-title">Documents</h3>
              </div>
              <p className="landing-feature-text">
                Côté apprenant, c&apos;est là qu&apos;il range ses CV et lettres
                de motivation, avec les conseils de l&apos;école dessus. Côté
                école, c&apos;est le même espace pour déposer cours et
                documents administratifs, sans passer par la boîte mail.
                Ces documents restent stockés localement et ne transitent
                jamais par nos serveurs, pour garantir leur confidentialité.
              </p>
            </div>
            </div>
          </DragScrollCarousel>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--roster">
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">Une vue d&apos;ensemble fiable, pas un outil de surveillance</h3>
            <p className="landing-showcase-body">
              D&apos;un coup d&apos;œil sur toute la promotion, chaque pastille
              reprend les couleurs du tableau de suivi (à faire, envoyé,
              entretien, refus), sans jamais afficher le détail des
              démarches de chacun. De quoi ouvrir la conversation avec un
              étudiant, pas la remplacer.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <div className="landing-roster-card">
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Camille</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-2.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Inès</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-3.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Thomas</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--rose" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-cassandra.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Lina</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Sofiane</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-2.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Manon</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                </span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-features-section">
          <h2 className="landing-features-title">Pensé pour durer.</h2>
          <div className="landing-features">
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="lock" /></div>
              <h3 className="landing-feature-title">RGPD natif</h3>
              <p className="landing-feature-text">Données hébergées et traitées en conformité RGPD, accès limité à l&apos;équipe pédagogique et à l&apos;étudiant concerné.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="refresh-cw" /></div>
              <h3 className="landing-feature-title">Connecté à vos outils</h3>
              <p className="landing-feature-text">Job boards et outils existants de l&apos;école synchronisés automatiquement, sans ressaisie manuelle.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="sparkles" /></div>
              <h3 className="landing-feature-title">IA explicable</h3>
              <p className="landing-feature-text">Chaque score de matching détaille ce qui le fait monter ou baisser, jamais une boîte noire.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="download" /></div>
              <h3 className="landing-feature-title">Export à tout moment</h3>
              <p className="landing-feature-text">Vos données vous appartiennent : export complet disponible à tout moment depuis l&apos;espace admin.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="user-cog" /></div>
              <h3 className="landing-feature-title">Accès par rôle</h3>
              <p className="landing-feature-text">École, étudiant, entreprise : chacun ne voit que ce qui le concerne, jamais plus.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="plus" /></div>
              <h3 className="landing-feature-title">Mises à jour continues</h3>
              <p className="landing-feature-text">De nouvelles fonctionnalités livrées en continu, incluses dans l&apos;abonnement.</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--ats">
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">Un agent IA pour accompagner chaque apprenant</h3>
            <p className="landing-showcase-body">
              Altora commence par expliquer à l&apos;alternant ce qu&apos;est
              un ATS et comment reformuler son CV et sa lettre de motivation
              pour le passer. Pour chaque fiche de poste, l&apos;IA retravaille
              ensuite son CV pour qu&apos;il corresponde parfaitement à
              l&apos;offre, réécrit sa lettre de motivation dans un format
              idéal, et prépare si besoin le mail à envoyer au recruteur.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <div className="landing-match-card">
              <CountUpPercent value={84} />
              <div className="landing-match-label">de compatibilité ATS avec l&apos;offre</div>
              <ul className="landing-match-notes">
                <li className="is-positive"><Icon name="check-circle" />Suite Adobe, CRM et gestion de campagnes maîtrisés</li>
                <li className="is-positive"><Icon name="check-circle" />Disponibilité alignée avec la date de début de l&apos;offre</li>
                <li className="is-warning"><Icon name="circle-help" />Aucune certification Adobe mentionnée</li>
                <li className="is-warning"><Icon name="circle-help" />Ne maîtrise pas l&apos;espagnol, demandé dans l&apos;offre</li>
                <li className="is-ai"><Icon name="sparkles" />Verbes d&apos;action renforcés : administre, pilote, anime</li>
                <li className="is-ai"><Icon name="sparkles" />Compétences réordonnées par pertinence pour ce poste</li>
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--priorise">
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">L&apos;IA priorise les actions, pas seulement les chiffres</h3>
            <p className="landing-showcase-body">
              Altora analyse en continu les candidatures de la promotion et
              suggère les actions à mener en priorité, pour accompagner chaque
              étudiant avant qu&apos;il ne décroche.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <div className="landing-copilot-card">
              <div className="landing-copilot-item landing-copilot-item--warning">
                <Icon name="target" />
                <p>12 étudiants n&apos;ont envoyé aucune candidature depuis 10 jours : proposez-leur ces 5 offres adaptées.</p>
              </div>
              <div className="landing-copilot-item landing-copilot-item--positive">
                <Icon name="check-circle" />
                <p>8 étudiants présentent plus de 90% de compatibilité avec cette nouvelle offre.</p>
              </div>
              <div className="landing-copilot-item landing-copilot-item--urgent">
                <Icon name="circle-help" />
                <p><strong>Thomas</strong> n&apos;a obtenu aucun entretien malgré 20 candidatures : une prise de contact individuelle est recommandée.</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--annuaire">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">L&apos;annuaire de votre promotion ouvert aux recruteurs</h2>
            <p className="landing-showcase-body">
              Vos entreprises partenaires postent une offre. Le matching
              leur montre aussitôt les profils qui correspondent le mieux,
              qu&apos;elles contactent directement, sans intermédiaire.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <TalentStack />
          </div>
        </Reveal>
      </section>

      <section className="landing-categories">
        <Reveal id="ecoles" className="landing-category">
          <div className="landing-category-icon"><Icon name="users" /></div>
          <h2 className="landing-category-title">Écoles &amp; organismes de formation</h2>
          <p className="landing-category-text">
            Suis la recherche d&apos;alternance de toute une promotion, sans
            relancer chaque étudiant un par un pour savoir où il en est.
          </p>
          <ul className="landing-category-list">
            <li><Icon name="check-circle" />Vue d&apos;ensemble de toute la promotion</li>
            <li><Icon name="check-circle" />Rythme d&apos;alternance de l&apos;école appliqué automatiquement</li>
            <li><Icon name="check-circle" />Suivi des candidatures de chaque alternant</li>
          </ul>
          <QuoteCtaButton className="landing-category-cta" location="category_ecoles">Contacter un expert <Icon name="chevron-right" /></QuoteCtaButton>
        </Reveal>

        <Reveal id="etudiants" className="landing-category">
          <div className="landing-category-icon"><Icon name="list-checks" /></div>
          <h2 className="landing-category-title">Étudiants en alternance</h2>
          <p className="landing-category-text">
            Votre alternance a son propre rythme, entre les rentrées, les
            périodes en entreprise et les cours. Altora garde toutes vos
            candidatures au même endroit, prêtes à temps.
          </p>
          <ul className="landing-category-list">
            <li><Icon name="check-circle" />Un tableau pour suivre chaque candidature</li>
            <li><Icon name="check-circle" />CV et lettre de motivation générés pour chaque offre</li>
            <li><Icon name="check-circle" />Un CV structuré pour passer les ATS</li>
          </ul>
          <Link href="/signup" className="landing-category-cta">Créer mon compte <Icon name="chevron-right" /></Link>
        </Reveal>

        <Reveal className="landing-category">
          <div className="landing-category-icon"><Icon name="file-check-2" /></div>
          <h2 className="landing-category-title">Entreprises partenaires</h2>
          <p className="landing-category-text">
            Publiez vos offres d&apos;alternance et échangez directement avec les
            écoles qui vous envoient des profils qualifiés.
          </p>
          <ul className="landing-category-list">
            <li><Icon name="check-circle" />Recevoir des profils qualifiés par les écoles</li>
            <li><Icon name="check-circle" />Consulter les candidatures, programmer les entretiens</li>
            <li><Icon name="check-circle" />Suivre vos recrutements en alternance</li>
          </ul>
          <span className="landing-category-cta landing-category-cta--soon">Bientôt disponible</span>
        </Reveal>
      </section>

      <Reveal id="tarifs" className="pricing-hero">
        <h2 className="pricing-title">Un tarif pour chaque acteur de l&apos;alternance</h2>
        <p className="landing-subtitle">
          L&apos;accès étudiant est inclus dans l&apos;abonnement de l&apos;école.
          Les écoles souscrivent à la plateforme, avec un accompagnement humain
          disponible en option.
        </p>
      </Reveal>

      <Reveal className="pricing-plans pricing-plans--merged">
        <div className="pricing-plan pricing-plan--merged">
          <h3 className="pricing-plan-name">Abonnement SaaS</h3>
          <p className="pricing-plan-tagline">La plateforme complète pour votre établissement, accès étudiant inclus</p>
          <div className="pricing-plan-price">Sur devis</div>
          <p className="pricing-plan-price-note">Selon la taille de votre promotion</p>
          <QuoteCtaButton className="landing-nav-cta pricing-plan-cta" location="landing_pricing">Contacter un expert</QuoteCtaButton>

          <div className="pricing-merged-groups">
            <div className="pricing-merged-group">
              <h4 className="pricing-merged-group-title">Inclus dans l&apos;abonnement</h4>
              <ul className="pricing-plan-features">
                <li><Icon name="check-circle" />Gestion des étudiants et des offres partenaires</li>
                <li><Icon name="check-circle" />Tableaux de bord et suivi des candidatures</li>
                <li><Icon name="check-circle" />Copilote IA pour l&apos;équipe pédagogique</li>
                <li><Icon name="check-circle" />Statistiques de placement de la promotion</li>
              </ul>
            </div>
            <div className="pricing-merged-group">
              <h4 className="pricing-merged-group-title">Pour l&apos;étudiant, gratuit et inclus</h4>
              <ul className="pricing-plan-features">
                <li><Icon name="check-circle" />Tableau de suivi de ses candidatures</li>
                <li><Icon name="check-circle" />CV et lettre de motivation générés par IA</li>
                <li><Icon name="check-circle" />Score de matching sur chaque offre</li>
                <li><Icon name="check-circle" />CV structuré pour passer les ATS</li>
              </ul>
            </div>
            <div className="pricing-merged-group">
              <h4 className="pricing-merged-group-title">Accompagnement Premium, en option</h4>
              <ul className="pricing-plan-features">
                <li><Icon name="check-circle" />Prospection de nouvelles entreprises</li>
                <li><Icon name="check-circle" />Prise de contact et qualification des besoins</li>
                <li><Icon name="check-circle" />Organisation des entretiens, relances</li>
                <li><Icon name="check-circle" />Suivi jusqu&apos;à la signature du contrat</li>
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal className="landing-closing">
        <h2 className="landing-closing-title">Prêt à piloter toutes vos promotions depuis un seul espace ?</h2>
        <p className="landing-closing-text">
          Rejoignez les écoles qui centralisent le suivi de leurs alternants avec Altora.
        </p>
        <div className="landing-closing-actions">
          <QuoteCtaButton className="landing-nav-cta landing-hero-cta" location="closing">Contacter un expert</QuoteCtaButton>
        </div>
      </Reveal>

      <Reveal className="pricing-faq">
        <h2 className="pricing-faq-title">Questions fréquentes</h2>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Les étudiants paient-ils pour utiliser Altora ?</h3>
          <p className="pricing-faq-answer">
            Non. L&apos;accès étudiant est inclus dans l&apos;abonnement souscrit par
            leur école.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Comment est calculé le prix de l&apos;abonnement école ?</h3>
          <p className="pricing-faq-answer">
            Sur devis, selon la taille de votre promotion et les fonctionnalités
            activées, contactez-nous pour un chiffrage.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Qu&apos;est-ce que l&apos;Accompagnement Premium ?</h3>
          <p className="pricing-faq-answer">
            Un service humain en complément de la plateforme : notre équipe prend
            en charge la prospection d&apos;entreprises partenaires, les relances et
            le suivi jusqu&apos;à la signature du contrat.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Proposez-vous une offre pour les cabinets de recrutement ou les agences d&apos;intérim ?</h3>
          <p className="pricing-faq-answer">
            Pas encore, cette offre est en cours de construction. Contactez-nous
            pour en discuter.
          </p>
        </div>
      </Reveal>

      <SiteFooter />
      </div>
    </div>
  );
}
