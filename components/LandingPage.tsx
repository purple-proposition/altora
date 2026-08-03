import Link from 'next/link';
import Icon from '@/components/Icon';
import Reveal from '@/components/Reveal';
import SiteNav from '@/components/SiteNav';
import SiteFooter from '@/components/SiteFooter';

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
  return (
    <div className="landing">
      <SiteNav />

      <main className="landing-hero">
        <h1 className="landing-title landing-in landing-in--1">
          Le copilote IA qui optimise<br />le taux de placement de votre promotion.
        </h1>
        <p className="landing-subtitle landing-in landing-in--2">
          Aujourd&apos;hui, vos étudiants jonglent entre Excel, LinkedIn et les mails
          pour chercher leur alternance. Avec Altora, ils suivent leurs candidatures,
          génèrent CV et lettre par IA et passent les filtres ATS au même endroit.
          Votre équipe pédagogique, elle, voit toute la promotion avancer en temps réel.
        </p>
        <div className="landing-hero-actions landing-in landing-in--3">
          <Link href="/signup" className="landing-nav-cta landing-hero-cta">Essayer Altora</Link>
        </div>

        <div className="landing-preview landing-in landing-in--4" aria-hidden="true">
          <div className="landing-preview-card">
            <div className="landing-preview-row">
              <span className="inline-pill inline-pill--slate"><Icon name="circle-dashed" />3</span>
              <span className="inline-pill inline-pill--amber"><Icon name="hourglass" />2</span>
              <span className="inline-pill inline-pill--green"><Icon name="target" />1</span>
              <span className="inline-pill inline-pill--rose"><Icon name="folder-x" />0</span>
            </div>
            <div className="landing-preview-cols">
              <div className="landing-preview-col">
                <div className="landing-preview-col-head"><Icon name="circle-dashed" />À postuler</div>
                <div className="landing-preview-chip">Chargé·e de marketing digital</div>
                <div className="landing-preview-chip">Growth &amp; Acquisition</div>
              </div>
              <div className="landing-preview-col">
                <div className="landing-preview-col-head"><Icon name="hourglass" />Envoyé</div>
                <div className="landing-preview-chip">Assistant chef de projet</div>
              </div>
              <div className="landing-preview-col">
                <div className="landing-preview-col-head"><Icon name="target" />Entretien</div>
                <div className="landing-preview-chip">Alternant·e communication</div>
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
            Ton alternance a son propre rythme, entre les rentrées, les périodes
            en entreprise et les cours. Altora garde toutes tes candidatures au
            même endroit, prêtes à temps.
          </p>
          <ul className="landing-category-list">
            <li><Icon name="check-circle" />Un tableau pour suivre chaque candidature</li>
            <li><Icon name="check-circle" />CV et lettre générés pour chaque offre</li>
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
        <Reveal className="landing-showcase-row">
          <div className="landing-showcase-text">
            <span className="landing-showcase-eyebrow">Matching IA</span>
            <h3 className="landing-showcase-title">Un score de compatibilité, pas juste une liste d&apos;offres</h3>
            <p className="landing-showcase-body">
              Chaque offre reçoit un score calculé à partir des compétences, de
              l&apos;expérience, du niveau d&apos;études et de la localisation de
              l&apos;étudiant &mdash; et l&apos;IA explique ce score au lieu de se
              contenter de l&apos;afficher.
            </p>
          </div>
          <div className="landing-showcase-visual">
            <div className="landing-match-card">
              <div className="landing-match-score">92%</div>
              <div className="landing-match-label">de compatibilité</div>
              <ul className="landing-match-notes">
                <li className="is-positive"><Icon name="check-circle" />Profil très adapté</li>
                <li className="is-warning"><Icon name="circle-help" />Une compétence CRM augmenterait votre score</li>
                <li className="is-warning"><Icon name="circle-help" />+12% avec un projet marketing en plus</li>
              </ul>
            </div>
          </div>
        </Reveal>

        <Reveal className="landing-showcase-row">
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
            <span className="landing-showcase-eyebrow">Copilote pour votre équipe pédagogique</span>
            <h3 className="landing-showcase-title">L&apos;IA priorise les actions, pas seulement les chiffres</h3>
            <p className="landing-showcase-body">
              Altora analyse en continu les candidatures de la promotion et
              suggère les actions à mener en priorité, pour accompagner chaque
              étudiant avant qu&apos;il ne décroche.
            </p>
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
          <h3 className="landing-feature-title">CV et lettre sur mesure</h3>
          <p className="landing-feature-text">
            Une fiche de poste collée, et ton CV comme ta lettre de motivation
            se réorganisent pour elle, sans jamais inventer une expérience.
          </p>
        </Reveal>
        <Reveal className="landing-feature">
          <div className="landing-feature-icon"><Icon name="target" /></div>
          <h3 className="landing-feature-title">Conçu pour passer les robots</h3>
          <p className="landing-feature-text">
            Avant un recruteur, un ATS lit ton CV. Le tien est structuré pour
            qu&apos;il le comprenne, et pour être lu jusqu&apos;au bout.
          </p>
        </Reveal>
        <Reveal className="landing-feature">
          <div className="landing-feature-icon"><Icon name="graduation-cap" /></div>
          <h3 className="landing-feature-title">Pensé pour ton école</h3>
          <p className="landing-feature-text">
            Rythme d&apos;alternance et rentrée définis par ton école, appliqués
            automatiquement à tes documents.
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
  );
}
