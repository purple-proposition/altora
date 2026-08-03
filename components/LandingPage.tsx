import Link from 'next/link';
import Icon from '@/components/Icon';
import Reveal from '@/components/Reveal';

// Public marketing landing page, shown at "/" only when signed out (see
// app/(tracker)/page.tsx and middleware.ts). Built entirely from the
// existing design tokens in app/tracker.css (--indigo, --card-bg,
// --radius-card/--radius-pill, etc.) rather than new one-off colors, so it
// stays visually identical to the rest of the app and follows the same
// light/dark theme switch instead of hardcoding one look like /login does.
export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <div className="landing-nav-brand">
          <span className="landing-nav-word">Altora</span>
        </div>
        <nav className="landing-nav-links">
          <a href="#etudiants" className="landing-nav-link">Étudiants</a>
          <a href="#ecoles" className="landing-nav-link">Écoles</a>
          <a href="#fonctionnalites" className="landing-nav-link">Fonctionnalités</a>
        </nav>
        <div className="landing-nav-actions">
          <Link href="/login" className="landing-nav-login">Se connecter</Link>
          <Link href="/signup" className="landing-nav-cta">S&apos;inscrire</Link>
        </div>
      </header>

      <main className="landing-hero">
        <span className="landing-eyebrow landing-in landing-in--1">Pour les étudiants en alternance</span>
        <h1 className="landing-title landing-in landing-in--2">
          Toutes tes candidatures,<br />un seul endroit.
        </h1>
        <p className="landing-subtitle landing-in landing-in--3">
          Suis tes candidatures, génère un CV et une lettre de motivation adaptés
          à chaque offre, et passe les filtres ATS avant même d&apos;être lu par
          un recruteur.
        </p>
        <div className="landing-hero-actions landing-in landing-in--4">
          <Link href="/signup" className="landing-nav-cta landing-hero-cta">Créer mon compte</Link>
          <Link href="/login" className="landing-hero-secondary">Se connecter <Icon name="chevron-right" /></Link>
        </div>

        <div className="landing-preview landing-in landing-in--5" aria-hidden="true">
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
          <Link href="/signup" className="landing-category-cta">Découvrir l&apos;espace école <Icon name="chevron-right" /></Link>
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

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Altora</span>
        <Link href="/login" className="landing-footer-link">Se connecter</Link>
      </footer>
    </div>
  );
}
