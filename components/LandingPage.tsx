import Image from 'next/image';
import Icon from '@/components/Icon';
import MatchingAnimation from '@/components/MatchingAnimation';
import HeroCalendar from '@/components/HeroCalendar';
import KanbanAnimation from '@/components/KanbanAnimation';
import MessagingAnimation from '@/components/MessagingAnimation';
import { CalendarSyncProvider } from '@/components/CalendarSyncContext';
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
// Toute la page s'adresse à l'école, à la deuxième personne, et décrit les
// apprenants à la troisième ("vos apprenants", "votre promotion"). L'outil
// sert réellement les deux, mais c'est l'école qui signe : per
// Altora_Concept_Projet.docx le décideur payeur est un "responsable des
// relations entreprises / pédagogique", et le document met en garde contre
// le fait de copier le positionnement candidat d'un concurrent, puisque la
// différenciation d'Altora est d'être le poste de pilotage de l'école.
// C'est cette voix unique qui a rendu inutile l'ancienne grille
// "écoles / étudiants / entreprises" : la question de savoir à qui on parle
// ne se pose plus.
//
// Rythme des sections : un temps fort centré, puis deux alignées à gauche,
// en boucle. Les quatre temps forts sont la facturation au résultat (le
// seul avantage qu'un acteur installé ne peut pas copier sans cannibaliser
// son revenu récurrent), le carrousel produit, "Pensé pour durer" et les
// tarifs. L'annuaire ouvre les sections alignées à gauche : per la note de
// différenciation, c'est le seul angle sur lequel MentorGoal ne se bat pas
// publiquement. "Vue d'ensemble" ferme le bloc produit parce qu'elle
// s'appuie sur les statuts (à faire, envoyé, entretien, refus) que le
// carrousel introduit plus haut. La FAQ est volontairement hors rythme,
// en clôture : c'est la convention sur une landing page, et elle répond
// symétriquement au hero qui ouvre hors rythme lui aussi.
export default function LandingPage() {
  // Same formatting as the real summary-date (app/(tracker)/page.tsx),
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
          La plateforme qui optimise<br />votre taux de placement
        </h1>
        <p className="landing-subtitle landing-in landing-in--2">
          Altora réunit la recherche d&apos;alternance de vos apprenants et son
          pilotage côté école. Vous ne payez qu&apos;à partir du moment où un
          alternant est placé.
        </p>
        <div className="landing-hero-actions landing-in landing-in--3">
          <QuoteCtaButton className="landing-nav-cta" location="hero" icon="message-circle">Contacter un expert</QuoteCtaButton>
        </div>

        <div className="landing-preview landing-in landing-in--4" aria-hidden="true">
          {/* Mirrors the real .app-shell exactly: a transparent sidebar rail
              sitting flat on the page background, next to a separate white
              bordered card (.app) that holds the topbar + content, not one
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

      {/* Leads with the billing model, not a feature, right after the hero:
          per Altora's differentiation strategy, the pay-on-placement model
          is the one advantage an installed competitor can't copy without
          cannibalizing its own recurring revenue, whereas the suivi/CV/
          matching features further down are table-stakes any competitor
          already covers. Deliberately qualitative (no % or fee amount):
          the real commercial terms aren't finalized yet, only the
          mechanism (billed on result, not on access) is. */}
      <Reveal className="landing-risk-banner">
        <div className="landing-risk-banner-icon"><Icon name="shield-check" /></div>
        <h2 className="landing-risk-banner-title">Vous ne payez qu&apos;un alternant placé</h2>
        <p className="landing-risk-banner-text">
          Aucun coût d&apos;entrée, aucun engagement à la signature. Altora ne
          facture votre école qu&apos;à partir du moment où un alternant est
          effectivement placé, jamais pour un simple accès à la plateforme.
        </p>
        <ul className="landing-risk-banner-list">
          <li><Icon name="check-circle" />Zéro risque financier pour tester la plateforme sur votre promotion</li>
          <li><Icon name="check-circle" />Facturation déclenchée uniquement par un placement réel</li>
          <li><Icon name="check-circle" />Rien à payer si aucun alternant n&apos;est placé</li>
        </ul>
      </Reveal>

      <section className="landing-showcase">
        <Reveal className="landing-showcase-row landing-showcase-row--annuaire">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">L&apos;annuaire de votre promotion ouvert aux recruteurs</h2>
            <p className="landing-showcase-body">
              Vos entreprises partenaires consultent le trombinoscope de
              toute l&apos;école, toutes promotions confondues, et contactent
              directement les profils qui les intéressent. Vos équipes
              n&apos;envoient plus les candidatures une par une.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <TalentStack />
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--jobboards">
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">Le matching suit vos règles</h3>
            <p className="landing-showcase-body">
              Altora récupère les offres d&apos;alternance, écarte celles qui
              ne correspondent ni au rythme que vous avez défini ni à vos
              villes d&apos;implantation, et ne présente à l&apos;apprenant que
              ce qui reste.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <MatchingAnimation />
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row--kanban">
          <div className="landing-showcase-text landing-showcase-text--right">
            <h3 className="landing-showcase-title">Une seule boîte à outils, deux utilisations complémentaires</h3>
            <p className="landing-showcase-body">
              Côté apprenant, c&apos;est le cockpit de son alternance. Côté
              école, c&apos;est le même espace qui devient un outil de suivi
              et d&apos;accompagnement, jamais plus que ce que
              l&apos;apprenant choisit de partager.
            </p>
          </div>
          <CalendarSyncProvider>
          <DragScrollCarousel className="landing-showcase-carousel" circular>
            <div className="landing-showcase-carousel-item" key="kanban">
            <KanbanAnimation />
            <div className="landing-showcase-caption">
              <div className="landing-showcase-caption-header">
                <div className="landing-feature-icon"><Icon name="list-checks" /></div>
                <h3 className="landing-showcase-caption-title">À faire</h3>
              </div>
              <p className="landing-feature-text">
                Chaque étudiant suit ses candidatures sur un tableau
                unique, avec les offres qu&apos;il ajoute et celles
                suggérées par l&apos;école. L&apos;équipe pédagogique
                s&apos;appuie sur ce même tableau pour ses points de suivi :
                où il en est, à quoi il a déjà postulé, s&apos;il faut
                relancer.
              </p>
            </div>
            </div>

            <div className="landing-showcase-carousel-item" key="messaging">
            <MessagingAnimation />
            <div className="landing-showcase-caption">
              <div className="landing-showcase-caption-header">
                <div className="landing-feature-icon"><Icon name="mail" /></div>
                <h3 className="landing-showcase-caption-title">Boîte de réception</h3>
              </div>
              <p className="landing-feature-text">
                Les rappels de candidature arrivent directement dans la
                boîte de réception de l&apos;étudiant. L&apos;école y
                dispose du même canal direct vers chaque apprenant, sans
                dépendre de sa messagerie personnelle.
              </p>
            </div>
            </div>

            <div className="landing-showcase-carousel-item" key="calendar">
            <HeroCalendar />
            <div className="landing-showcase-caption">
              <div className="landing-showcase-caption-header">
                <div className="landing-feature-icon"><Icon name="calendar" /></div>
                <h3 className="landing-showcase-caption-title">Calendrier</h3>
              </div>
              <p className="landing-feature-text">
                Deadlines, entretiens, rentrées, périodes en entreprise et
                suivi pédagogique : un seul calendrier, partagé par
                l&apos;étudiant et l&apos;école.
              </p>
            </div>
            </div>

            <div className="landing-showcase-carousel-item" key="documents">
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
                CV, lettres de motivation, cours et documents administratifs
                partagés entre étudiant et école au même endroit, stockés
                localement et jamais transmis à nos serveurs.
              </p>
            </div>
            </div>
          </DragScrollCarousel>
          </CalendarSyncProvider>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--ats">
          <div className="landing-showcase-text">
            <h3 className="landing-showcase-title">Chaque candidature prête avant l&apos;envoi</h3>
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
              <div className="landing-copilot-item landing-copilot-item--positive">
                <Icon name="check-circle" />
                <p>8 étudiants présentent plus de 90% de compatibilité avec cette nouvelle offre.</p>
              </div>
              <div className="landing-copilot-item landing-copilot-item--warning">
                <Icon name="target" />
                <p>12 étudiants n&apos;ont envoyé aucune candidature depuis 10 jours : proposez-leur ces 5 offres adaptées.</p>
              </div>
              <div className="landing-copilot-item landing-copilot-item--urgent">
                <Icon name="circle-alert" />
                <p><strong>Thomas</strong> n&apos;a obtenu aucun entretien malgré 20 candidatures : une prise de contact individuelle est recommandée.</p>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-features-section">
          <h2 className="landing-features-title">Pensé pour durer</h2>
          <p className="landing-features-subtitle">
            Une base technique solide, pensée pour accompagner votre école
            sur la durée, pas seulement pour la démo.
          </p>
          <div className="landing-features">
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="lock" /></div>
              <h3 className="landing-feature-title">Sécurité by design</h3>
              <p className="landing-feature-text">Données hébergées et traitées en conformité RGPD, accès limité à l&apos;équipe pédagogique et à l&apos;étudiant concerné.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="refresh-cw" /></div>
              <h3 className="landing-feature-title">Toujours synchronisé</h3>
              <p className="landing-feature-text">Offres et outils existants de l&apos;école synchronisés automatiquement, sans ressaisie manuelle.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="sparkles" /></div>
              <h3 className="landing-feature-title">Intelligence transparente</h3>
              <p className="landing-feature-text">Chaque score de matching détaille ce qui le fait monter ou baisser, jamais une boîte noire.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="download" /></div>
              <h3 className="landing-feature-title">Vos données vous appartiennent</h3>
              <p className="landing-feature-text">Export complet disponible à tout moment depuis l&apos;espace admin.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="user-cog" /></div>
              <h3 className="landing-feature-title">Confidentialité totale</h3>
              <p className="landing-feature-text">École, étudiant, entreprise : chacun ne voit que ce qui le concerne, jamais plus.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="plus" /></div>
              <h3 className="landing-feature-title">Toujours à jour</h3>
              <p className="landing-feature-text">De nouvelles fonctionnalités livrées en continu, sans coût supplémentaire.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="monitor" /></div>
              <h3 className="landing-feature-title">Disponible partout</h3>
              <p className="landing-feature-text">Une plateforme accessible à tout moment, hébergée sur une infrastructure fiable.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="mail" /></div>
              <h3 className="landing-feature-title">Un accompagnement humain</h3>
              <p className="landing-feature-text">Une équipe disponible pour vous accompagner dans la prise en main d&apos;Altora.</p>
            </div>
          </div>
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
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-2.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Inès</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-3.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Thomas</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--rose" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-lina.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Lina</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-sofiane.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Sofiane</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
              <div className="landing-roster-student">
                <span className="landing-roster-avatar"><Image src="/landing-preview-avatar-manon.jpg" alt="" fill sizes="48px" /></span>
                <span className="landing-roster-name">Manon</span>
                <span className="landing-roster-dots">
                  <span className="landing-roster-dot landing-roster-dot--slate" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--amber" />
                  <span className="landing-roster-dot landing-roster-dot--green" />
                </span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* id="tarifs" vit ici depuis que l'en-tête tarifaire a été
          supprimé : elle ne faisait que redire la facturation au résultat,
          déjà portée par le premier temps fort de la page. Le footer
          pointe sur cette ancre, elle doit rester atteignable. */}
      <Reveal id="tarifs" className="pricing-plans pricing-plans--merged">
        <div className="pricing-plan pricing-plan--merged">
          <h2 className="landing-closing-title">Prêt à améliorer le taux de placement de votre promotion ?</h2>
          <p className="landing-closing-text">
            Rejoignez les écoles qui centralisent le suivi de leurs alternants avec Altora.
          </p>
          <p className="pricing-plan-tagline pricing-plan-tagline--name">La plateforme complète pour votre établissement, facturée au placement, accès étudiant inclus</p>
          <div className="pricing-plan-price">Facturé au placement</div>
          <p className="pricing-plan-price-note">Contactez-nous pour un chiffrage</p>
          <QuoteCtaButton className="landing-nav-cta pricing-plan-cta" location="landing_pricing" icon="message-circle">Contacter un expert</QuoteCtaButton>

          <div className="pricing-merged-groups">
            <div className="pricing-merged-group">
              <h4 className="pricing-merged-group-title"><Icon name="graduation-cap" />Inclus, facturé au placement</h4>
              <ul className="pricing-plan-features">
                <li><Icon name="check-circle" />Gestion des étudiants et des offres partenaires</li>
                <li><Icon name="check-circle" />Tableaux de bord et suivi des candidatures</li>
                <li><Icon name="check-circle" />Copilote IA pour l&apos;équipe pédagogique</li>
                <li><Icon name="check-circle" />Statistiques de placement de la promotion</li>
              </ul>
            </div>
            <div className="pricing-merged-group">
              <h4 className="pricing-merged-group-title"><Icon name="users" />Pour l&apos;étudiant, gratuit et inclus</h4>
              <ul className="pricing-plan-features">
                <li><Icon name="check-circle" />Tableau de suivi de ses candidatures</li>
                <li><Icon name="check-circle" />CV et lettre de motivation générés par IA</li>
                <li><Icon name="check-circle" />Score de matching sur chaque offre</li>
                <li><Icon name="check-circle" />CV structuré pour passer les ATS</li>
              </ul>
            </div>
            <div className="pricing-merged-group">
              <h4 className="pricing-merged-group-title">
                <Icon name="sparkles" />Accompagnement Premium
                <span className="pricing-merged-group-badge">En option</span>
              </h4>
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

      <Reveal className="pricing-faq">
        <h2 className="pricing-faq-title">Questions fréquentes</h2>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Les étudiants paient-ils pour utiliser Altora ?</h3>
          <p className="pricing-faq-answer">
            Non. L&apos;accès étudiant est inclus, sans coût pour l&apos;étudiant
            ni pour l&apos;école.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Comment est calculé le prix ?</h3>
          <p className="pricing-faq-answer">
            Altora ne facture votre école qu&apos;à partir du moment où un
            alternant est effectivement placé, jamais pour un accès à la
            plateforme. Contactez-nous pour un chiffrage.
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

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Qui a accès aux données de vos étudiants ?</h3>
          <p className="pricing-faq-answer">
            Seules l&apos;équipe pédagogique de l&apos;école et l&apos;étudiant
            lui-même. Les entreprises ne voient que ce que l&apos;étudiant
            choisit de partager via ses candidatures.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Pouvez-vous récupérer vos données si vous quittez Altora ?</h3>
          <p className="pricing-faq-answer">
            Oui, export complet disponible à tout moment depuis l&apos;espace
            admin.
          </p>
        </div>

        <div className="pricing-faq-item">
          <h3 className="pricing-faq-question">Comment est calculé le score de matching IA d&apos;un étudiant ?</h3>
          <p className="pricing-faq-answer">
            Il combine compétences, expériences, niveau d&apos;études,
            localisation et préférences renseignées à l&apos;inscription.
            L&apos;IA explique aussi ce qui le fait monter ou baisser.
          </p>
        </div>
      </Reveal>

      <SiteFooter />
      </div>
    </div>
  );
}
