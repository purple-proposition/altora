import Image from 'next/image';
import Link from 'next/link';
import Icon from '@/components/Icon';
import Reveal from '@/components/Reveal';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';
import CountUpPercent from '@/components/CountUpPercent';
import TalentStack from '@/components/TalentStack';
import DragScrollCarousel from '@/components/DragScrollCarousel';

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
          Le copilote IA qui optimise<br />votre taux de placement.
        </h1>
        <p className="landing-subtitle landing-in landing-in--2">
          Les écoles et leurs apprenants jonglent aujourd&apos;hui entre une multitude
          d&apos;outils. Avec Altora, tout se gère au même endroit pour les
          accompagner vers la réussite de leur alternance.
        </p>
        <div className="landing-hero-actions landing-in landing-in--3">
          <Link href="/signup" className="landing-nav-cta landing-hero-cta">Essayer Altora</Link>
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
          <Link href="/signup" className="landing-category-cta">Essayer Altora <Icon name="chevron-right" /></Link>
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

      <section className="landing-showcase">
        <Reveal className="landing-showcase-row--kanban">
          <div className="landing-showcase-text landing-showcase-text--right">
            <h3 className="landing-showcase-title">Le suivi pédagogique voit où en est chaque étudiant</h3>
            <p className="landing-showcase-body">
              Chaque étudiant gère son propre tableau kanban, avec les offres
              qu&apos;il ajoute et celles que l&apos;école lui suggère. L&apos;équipe
              pédagogique consulte ce même tableau pour voir où il en est, à
              quoi il a déjà postulé, et intervenir au bon moment.
            </p>
          </div>
          <DragScrollCarousel className="landing-showcase-carousel">
            <div className="landing-kanban-board landing-showcase-carousel-item">
              <div className="column">
                <div className="column-header column-header--slate">
                  <Icon name="circle-dashed" />
                  <span className="column-header-label">À faire</span>
                  <span className="column-header-count">4</span>
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
                  <div className="card card--slate">
                    <div className="card-heading">
                      <span className="card-title">Stagiaire Communication</span>
                      <span className="card-heading-sep"> chez </span>
                      <span className="card-company">Bureau Vallée</span>
                    </div>
                    <div className="card-meta-row">
                      <span className="card-meta-item"><Icon name="map-pin" />Boulogne-Billancourt</span>
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

            <div className="landing-messaging-board landing-showcase-carousel-item">
              <div className="inbox-message landing-inbox-message landing-inbox-message--unread">
                <span className="landing-inbox-avatar landing-inbox-avatar--person">C</span>
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

            <div className="landing-calendar-board landing-showcase-carousel-item">
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
                  <span className="landing-calendar-day-event"><Icon name="target" />L&apos;Oréal</span>
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
                <span className="landing-calendar-day">24</span>
                <span className="landing-calendar-day">25</span>
                <span className="landing-calendar-day">26</span>
                <span className="landing-calendar-day">27</span>
                <span className="landing-calendar-day">28</span>
                <span className="landing-calendar-day">29</span>
                <span className="landing-calendar-day">30</span>
                <span className="landing-calendar-day">31</span>
                <span className="landing-calendar-day landing-calendar-day--muted">1</span>
                <span className="landing-calendar-day landing-calendar-day--muted">2</span>
                <span className="landing-calendar-day landing-calendar-day--muted">3</span>
                <span className="landing-calendar-day landing-calendar-day--muted">4</span>
                <span className="landing-calendar-day landing-calendar-day--muted">5</span>
                <span className="landing-calendar-day landing-calendar-day--muted">6</span>
              </div>
            </div>
          </DragScrollCarousel>
        </Reveal>

        <Reveal className="landing-showcase-row">
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">Votre CV généré, avec un score ATS avant même de l&apos;envoyer</h3>
            <p className="landing-showcase-body">
              Quand vous choisissez une offre et lancez la génération, Altora
              produit votre CV et vous donne aussitôt son score de
              compatibilité avec cette offre &mdash; compétences, expérience,
              niveau d&apos;études, localisation &mdash; en expliquant ce qui
              le fait monter ou baisser, pas juste un chiffre brut.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <div className="landing-match-card">
              <CountUpPercent value={92} />
              <div className="landing-match-label">de compatibilité avec l&apos;offre</div>
              <ul className="landing-match-notes">
                <li className="is-positive"><Icon name="check-circle" />Profil très adapté</li>
                <li className="is-warning"><Icon name="circle-help" />Une compétence CRM augmenterait votre score</li>
                <li className="is-warning"><Icon name="circle-help" />+12% avec un projet marketing en plus</li>
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--priorise">
          <div className="landing-showcase-visual">
            <div className="landing-copilot-card">
              <div className="landing-copilot-item">
                <Icon name="target" />
                <p>12 étudiants n&apos;ont envoyé aucune candidature depuis 10 jours : proposez-leur ces 5 offres adaptées.</p>
              </div>
              <div className="landing-copilot-item">
                <Icon name="check-circle" />
                <p>8 étudiants présentent plus de 90% de compatibilité avec cette nouvelle offre.</p>
              </div>
              <div className="landing-copilot-item">
                <Icon name="circle-help" />
                <p>Cet étudiant n&apos;a obtenu aucun entretien malgré 20 candidatures : une prise de contact individuelle est recommandée.</p>
              </div>
            </div>
          </div>
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">L&apos;IA priorise les actions, pas seulement les chiffres</h3>
            <p className="landing-showcase-body">
              Altora analyse en continu les candidatures de la promotion et
              suggère les actions à mener en priorité, pour accompagner chaque
              étudiant avant qu&apos;il ne décroche.
            </p>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--annuaire">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">L&apos;annuaire de votre promotion ouvert aux recruteurs</h2>
            <p className="landing-showcase-body">
              Vos entreprises partenaires postent une offre et grâce à notre
              système de matching repèrent aussitôt les profils qui leur
              correspondent le mieux et les contactent directement sans
              passer par un intermédiaire.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <TalentStack />
          </div>
        </Reveal>
      </section>

      <section id="fonctionnalites" className="landing-features">
        <Reveal className="landing-feature">
          <div className="landing-feature-icon"><Icon name="list-checks" /></div>
          <h3 className="landing-feature-title">Un tableau pour tout suivre</h3>
          <p className="landing-feature-text">
            À postuler, envoyé, entretien, refus : chaque candidature a sa place,
            sans tableur ni post-it.
          </p>
        </Reveal>
        <Reveal className="landing-feature">
          <div className="landing-feature-icon"><Icon name="file-text" /></div>
          <h3 className="landing-feature-title">CV et lettre de motivation sur mesure</h3>
          <p className="landing-feature-text">
            Une fiche de poste collée, et votre CV comme votre lettre de
            motivation se réorganisent pour elle, sans jamais inventer une
            expérience.
          </p>
        </Reveal>
        <Reveal className="landing-feature">
          <div className="landing-feature-icon"><Icon name="target" /></div>
          <h3 className="landing-feature-title">Conçu pour passer les robots</h3>
          <p className="landing-feature-text">
            Avant un recruteur, un ATS lit votre CV. Le vôtre est structuré
            pour qu&apos;il le comprenne, et pour être lu jusqu&apos;au bout.
          </p>
        </Reveal>
        <Reveal className="landing-feature">
          <div className="landing-feature-icon landing-feature-icon--school"><Icon name="graduation-cap" /></div>
          <h3 className="landing-feature-title">Pensé pour votre école</h3>
          <p className="landing-feature-text">
            Rythme d&apos;alternance et rentrée définis par votre école,
            appliqués automatiquement à vos documents.
          </p>
        </Reveal>
      </section>

      <Reveal className="landing-closing">
        <h2 className="landing-closing-title">Prêt à piloter toute votre promotion depuis un seul endroit ?</h2>
        <p className="landing-closing-text">
          Rejoignez les écoles qui centralisent le suivi de leurs alternants avec Altora.
        </p>
        <div className="landing-closing-actions">
          <Link href="/signup" className="landing-nav-cta landing-hero-cta">Essayer Altora</Link>
        </div>
      </Reveal>

      <SiteFooter />
      </div>
    </div>
  );
}
