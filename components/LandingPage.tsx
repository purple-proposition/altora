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
import FaqItem from '@/components/FaqItem';
import RosterAnimation from '@/components/RosterAnimation';
import CopilotAnimation from '@/components/CopilotAnimation';

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
        {/* "sans relancer personne" etait faux, et surtout contredit par la
            section "Vous savez qui relancer, et quand" plus bas : Altora ne
            supprime pas la relance, il dit qui relancer et quand. La
            garantie prend sa place, seule promesse que la concurrence ne
            peut pas tenir, et verifiable au centime pres par le modele,
            garantie remboursee plus zero commission. */}
        <h1 className="landing-title landing-in landing-in--1">
          Votre taux de placement en hausse,<br />ou vous ne payez rien
        </h1>
        {/* Le sous-titre decrit desormais le produit au lieu de redire la
            garantie : elle est deja dans le titre, trois centimetres plus
            haut. */}
        <p className="landing-subtitle landing-in landing-in--2">
          Altora réunit la recherche d&apos;alternance de vos apprenants et son
          pilotage côté école, du premier CV au contrat signé.
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

      <section className="landing-showcase">
        {/* Leads with the billing model, not a feature, right after the hero:
            per Altora's differentiation strategy, the pay-on-placement model
            is the one advantage an installed competitor can't copy without
            cannibalizing its own recurring revenue, whereas the suivi/CV/
            matching features further down are table-stakes any competitor
            already covers. Deliberately qualitative (no % or fee amount):
            the real commercial terms aren't finalized yet, only the
            mechanism (billed on result, not on access) is. */}
        <Reveal className="landing-showcase-row landing-showcase-row--facturation">
          <div className="landing-showcase-text">
            {/* Le hero porte déjà la promesse de remboursement : cette
                section ne la répète pas et prend en charge le modèle
                lui-même. Le récapitulatif à droite garde le remboursement
                visible sans le réaffirmer une deuxième fois en toutes
                lettres. */}
            <h2 className="landing-showcase-title">Payez au placement, pas à la licence</h2>
            <p className="landing-showcase-body">
              Une garantie de 1 000 € à la signature, intégralement remboursée
              si aucun apprenant n&apos;est placé, puis une facturation par
              apprenant placé tant que son contrat est actif.
            </p>
          </div>
          <div className="landing-showcase-visual">
            {/* Récapitulatif de facturation plutôt qu'une liste de
                promesses : le mécanisme se démontre mieux qu'il ne
                s'affirme.

                La derniere ligne est la plus importante des quatre. "Si le
                contrat s'arrete, la facture s'arrete" est l'argument que
                personne d'autre ne peut tenir, et c'est la reponse a
                l'objection immediate d'un directeur qui lit "paye au
                placement" : et si l'alternance casse au bout de deux mois.
                Le montrer dans un recapitulatif vaut mieux que l'affirmer
                dans une phrase de plus.

                Les volumes suivent la cible reelle, des ecoles de 500 a
                2000 alternants. Les anciens chiffres, 24 suivis et 3
                places, decrivaient un client hors cible et affaiblissaient
                la demonstration. */}
            <div className="landing-billing-card">
              <div className="landing-billing-header">
                <span className="landing-billing-title">Facturation</span>
                <span className="landing-billing-period">Promotion en cours</span>
              </div>
              <div className="landing-billing-row">
                <span className="landing-billing-label"><Icon name="shield-check" />Garantie à la signature</span>
                <span className="landing-billing-free">1 000 € remboursables</span>
              </div>
              <div className="landing-billing-row">
                <span className="landing-billing-label"><Icon name="users" />180 apprenants suivis</span>
                <span className="landing-billing-free">Inclus</span>
              </div>
              <div className="landing-billing-row landing-billing-row--billed">
                <span className="landing-billing-label"><Icon name="check-circle" />124 apprenants placés</span>
                <span className="landing-billing-billed">Pendant le contrat</span>
              </div>
              <div className="landing-billing-row">
                <span className="landing-billing-label"><Icon name="circle-dashed" />3 contrats rompus</span>
                <span className="landing-billing-free">Facturation arrêtée</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--jobboards">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">Vos apprenants ne voient que des offres compatibles</h2>
            <p className="landing-showcase-body">
              Altora récupère les offres d&apos;alternance, écarte celles qui ne
              correspondent ni au rythme que vous avez défini ni à vos villes
              d&apos;implantation, et ne présente à l&apos;apprenant que ce qui
              reste.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <MatchingAnimation />
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row--kanban">
          <div className="landing-showcase-text landing-showcase-text--right">
            <h3 className="landing-showcase-title">Une boîte à outils, deux usages complémentaires</h3>
            <p className="landing-showcase-body">
              Le même espace est le cockpit de l&apos;apprenant et l&apos;outil de
              suivi et d&apos;accompagnement de l&apos;école, jamais plus que ce
              qu&apos;il choisit de partager.
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
                {/* Les quatre legendes du carrousel suivent la meme forme :
                    une phrase, une quinzaine de mots, et a chaque fois ce
                    que l'outil apporte aux deux cotes. */}
                Un même tableau pour les candidatures de l&apos;apprenant et
                les points de suivi de l&apos;équipe pédagogique.
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
                Un canal direct entre l&apos;école et chaque apprenant, où
                arrivent aussi ses rappels de candidature.
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
                {/* "Partage" est garde pour Documents, ou c'est le sujet
                    meme de la legende. Ici l'argument est le regroupement,
                    et le duo apprenant plus ecole est deja porte par les
                    trois autres legendes. */}
                Deadlines, entretiens, périodes en entreprise et suivi
                pédagogique réunis dans un seul calendrier.
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
                {/* Le stockage local est remonte dans "Pense pour durer" :
                    c'est un argument de confiance, il porte plus dans la
                    section qui traite des fondations que noye dans une
                    legende de carrousel. */}
                CV, lettres de motivation, cours et documents administratifs
                partagés entre apprenant et école au même endroit.
              </p>
            </div>
            </div>
          </DragScrollCarousel>
          </CalendarSyncProvider>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--annuaire">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">Les recruteurs viennent à vos apprenants</h2>
            <p className="landing-showcase-body">
              Vos entreprises partenaires contactent directement les profils qui
              les intéressent dans le trombinoscope de l&apos;école, sans que vos
              équipes envoient une seule candidature.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <TalentStack />
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--ats">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">Aucune candidature envoyée au hasard</h2>
            <p className="landing-showcase-body">
              Pour chaque offre, le CV et la lettre de motivation sont
              retravaillés sur mesure pour passer les filtres automatiques des
              recruteurs.
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

        <Reveal className="landing-features-section">
          <h2 className="landing-features-title">Pensé pour durer</h2>
          <p className="landing-features-subtitle">
            Sécurité, confidentialité et maîtrise de vos données : des
            fondations, pas des arguments de démo.
          </p>
          <div className="landing-features">
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="lock" /></div>
              <h3 className="landing-feature-title">Sécurité by design</h3>
              <p className="landing-feature-text">Données traitées en conformité RGPD, accès limité aux seules personnes concernées.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="refresh-cw" /></div>
              <h3 className="landing-feature-title">Toujours synchronisé</h3>
              <p className="landing-feature-text">Offres et outils de l&apos;école synchronisés automatiquement, sans ressaisie manuelle.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="sparkles" /></div>
              <h3 className="landing-feature-title">Intelligence transparente</h3>
              <p className="landing-feature-text">Chaque score détaille ce qui le fait monter ou baisser, jamais une boîte noire.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="download" /></div>
              {/* Huit cartes pour quatre colonnes : ajouter le stockage
                  local en neuvieme laissait une carte orpheline sur une
                  troisieme ligne. Il rejoint donc l'export, meme promesse
                  au fond, vos donnees restent les votres. */}
              <h3 className="landing-feature-title">Vos données restent vôtres</h3>
              <p className="landing-feature-text">Documents stockés localement, jamais transmis à nos serveurs, export à tout moment.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="user-cog" /></div>
              <h3 className="landing-feature-title">Confidentialité totale</h3>
              <p className="landing-feature-text">École, apprenant, entreprise : chacun ne voit que ce qui le concerne, jamais plus.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="plus" /></div>
              <h3 className="landing-feature-title">Une plateforme qui évolue</h3>
              <p className="landing-feature-text">De nouvelles fonctionnalités livrées en continu, sans jamais de coût supplémentaire.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="monitor" /></div>
              <h3 className="landing-feature-title">Disponible partout</h3>
              <p className="landing-feature-text">Accessible à tout moment et depuis n&apos;importe quel appareil, sans installation.</p>
            </div>
            <div className="landing-feature">
              <div className="landing-feature-icon"><Icon name="mail" /></div>
              <h3 className="landing-feature-title">Une équipe derrière l&apos;outil</h3>
              <p className="landing-feature-text">Un interlocuteur pour la prise en main, et qui répond quand vous avez une question.</p>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--priorise">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">Vous savez qui relancer, et quand</h2>
            <p className="landing-showcase-body">
              L&apos;analyse en continu des candidatures de la promotion suggère
              les actions à mener en priorité, pour accompagner chaque apprenant
              avant qu&apos;il ne décroche.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <CopilotAnimation />
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row landing-showcase-row--roster">
          <div className="landing-showcase-text">
            <h2 className="landing-showcase-title">Suivre sans surveiller</h2>
            <p className="landing-showcase-body">
              Chaque pastille reprend les couleurs du tableau de suivi, de quoi
              voir en un coup d&apos;œil l&apos;état d&apos;avancement de votre
              promotion.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <RosterAnimation />
          </div>
        </Reveal>
      </section>

      {/* id="tarifs" vit ici depuis que l'en-tête tarifaire a été
          supprimé : elle ne faisait que redire la facturation au résultat,
          déjà portée par le premier temps fort de la page. Le footer
          pointe sur cette ancre, elle doit rester atteignable. */}
      <Reveal id="tarifs" className="pricing-plans pricing-plans--merged">
        <div className="pricing-plan pricing-plan--merged">
          {/* "Facturé au placement" etait la ligne de prix, sous un titre
              d'appel. C'est pourtant le message de la section : il passe en
              titre, et l'appel devient le sous-titre. La ligne de prix
              disparait, sinon la meme phrase se lisait deux fois. */}
          <h2 className="landing-closing-title">Facturé au placement</h2>
          <p className="landing-closing-text">
            Prêt à placer votre prochaine promotion ? Rejoignez les écoles qui
            pilotent le placement de leurs apprenants avec Altora.
          </p>
          <p className="pricing-plan-price-note">Par apprenant placé et tant que son contrat est actif, accès apprenant inclus</p>
          <QuoteCtaButton className="landing-nav-cta pricing-plan-cta" location="landing_pricing" icon="message-circle">Demander un chiffrage</QuoteCtaButton>

          {/* Trois colonnes de quatre puces faisaient tableau comparatif
              alors qu'il n'y a qu'une seule offre. Deux colonnes suffisent
              a dire ce qui compte : ce qui est compris, et ce qui est en
              option. Les fonctionnalites detaillees sont deja montrees par
              les mockups plus haut, les repeter ici alourdissait pour rien. */}
          <div className="pricing-included">
            <div className="pricing-included-col">
              <h4 className="pricing-included-title">Compris</h4>
              <ul className="pricing-plan-features">
                <li><Icon name="check-circle" />La plateforme complète, école et apprenants</li>
                <li><Icon name="check-circle" />Suivi, matching et génération de CV</li>
                <li><Icon name="check-circle" />Mises à jour et support</li>
              </ul>
            </div>
            <div className="pricing-included-col">
              <h4 className="pricing-included-title">
                Accompagnement
                <span className="pricing-included-badge">En option</span>
              </h4>
              <ul className="pricing-plan-features">
                <li><Icon name="check-circle" />Prospection d&apos;entreprises partenaires</li>
                <li><Icon name="check-circle" />Qualification des besoins et relances</li>
                <li><Icon name="check-circle" />Suivi jusqu&apos;à la signature</li>
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      {/* <details> natif plutot qu'un accordeon maison : ouverture au
          clavier, annonce correcte aux lecteurs d'ecran et recherche dans
          la page qui deplie toute seule, sans une ligne de JavaScript.
          Replier la FAQ retire 180 mots de la surface visible sans
          supprimer une reponse : elle ne concerne que le lecteur qui a
          deja une objection precise. */}
      <Reveal className="pricing-faq">
        <h2 className="pricing-faq-title">Questions fréquentes</h2>

        <FaqItem question="Les apprenants paient-ils pour utiliser Altora ?">
          Non, jamais. L&apos;accès est inclus dans ce que souscrit leur école.
        </FaqItem>
        <FaqItem question="Comment est calculé le prix ?">
          Une garantie de 1 000 € est déposée à la signature et intégralement remboursée si aucun apprenant n&apos;est placé. Chaque apprenant placé est ensuite facturé tant que son contrat est actif, et toute rupture arrête la facturation. Le support et les mises à jour ne sont jamais facturés. Contactez-nous pour un chiffrage.
        </FaqItem>
        <FaqItem question="Qu'est-ce que l'accompagnement en option ?">
          Un service humain en complément de la plateforme : notre équipe prend en charge la prospection d&apos;entreprises partenaires, les relances et le suivi jusqu&apos;à la signature.
        </FaqItem>
        <FaqItem question="Proposez-vous une offre pour les cabinets de recrutement ?">
          Pas encore, elle est en cours de construction. Contactez-nous pour en discuter.
        </FaqItem>
        <FaqItem question="Qui a accès aux données de vos apprenants ?">
          Seules l&apos;équipe pédagogique et l&apos;apprenant lui-même. Les entreprises ne voient que ce qu&apos;il choisit de partager via ses candidatures.
        </FaqItem>
        <FaqItem question="Pouvez-vous récupérer vos données si vous quittez Altora ?">
          Oui, export complet disponible à tout moment depuis l&apos;espace admin.
        </FaqItem>
        <FaqItem question="Comment est calculé le score de matching d'un apprenant ?">
          Il combine compétences, expériences, niveau d&apos;études, localisation et préférences renseignées à l&apos;inscription, et détaille ce qui le fait monter ou baisser.
        </FaqItem>
      </Reveal>

      <SiteFooter />
      </div>
    </div>
  );
}
