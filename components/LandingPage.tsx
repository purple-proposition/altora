import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/Icon';

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
          <Image src="/rocket-school-logo.jpg" alt="Rocket School" width={32} height={32} className="landing-nav-logo" priority />
          <span className="landing-nav-word">Altora</span>
        </div>
        <div className="landing-nav-actions">
          <Link href="/login" className="landing-nav-login">Se connecter</Link>
          <Link href="/signup" className="landing-nav-cta">S&apos;inscrire</Link>
        </div>
      </header>

      <main className="landing-hero">
        <span className="landing-eyebrow">Pour les étudiants en alternance</span>
        <h1 className="landing-title">
          Toutes tes candidatures,<br />un seul endroit.
        </h1>
        <p className="landing-subtitle">
          Suis tes candidatures, génère un CV et une lettre de motivation adaptés
          à chaque offre, et passe les filtres ATS avant même d&apos;être lu par
          un recruteur.
        </p>
        <div className="landing-hero-actions">
          <Link href="/signup" className="landing-nav-cta landing-hero-cta">Créer mon compte</Link>
          <Link href="/login" className="landing-hero-secondary">Se connecter <Icon name="chevron-right" /></Link>
        </div>

        <div className="landing-preview" aria-hidden="true">
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

      <section className="landing-features">
        <div className="landing-feature">
          <div className="landing-feature-icon"><Icon name="list-checks" /></div>
          <h3 className="landing-feature-title">Un tableau pour tout suivre</h3>
          <p className="landing-feature-text">
            À postuler, envoyé, entretien, refus : chaque candidature a sa place,
            sans tableur ni post-it.
          </p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon"><Icon name="file-text" /></div>
          <h3 className="landing-feature-title">CV et lettre sur mesure</h3>
          <p className="landing-feature-text">
            Une fiche de poste collée, et ton CV comme ta lettre de motivation
            se réorganisent pour elle, sans jamais inventer une expérience.
          </p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon"><Icon name="target" /></div>
          <h3 className="landing-feature-title">Conçu pour passer les robots</h3>
          <p className="landing-feature-text">
            Avant un recruteur, un ATS lit ton CV. Le tien est structuré pour
            qu&apos;il le comprenne, et pour être lu jusqu&apos;au bout.
          </p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature-icon"><Icon name="graduation-cap" /></div>
          <h3 className="landing-feature-title">Pensé pour ton école</h3>
          <p className="landing-feature-text">
            Rythme d&apos;alternance et rentrée définis par ton école, appliqués
            automatiquement à tes documents.
          </p>
        </div>
      </section>

      <footer className="landing-footer">
        <span>© {new Date().getFullYear()} Altora</span>
        <Link href="/login" className="landing-footer-link">Se connecter</Link>
      </footer>
    </div>
  );
}
