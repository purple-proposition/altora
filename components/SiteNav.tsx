import Link from 'next/link';
import AltoraLogo from '@/components/AltoraLogo';

// Shared sticky nav for every public marketing page (landing, pricing) —
// see .landing-nav in tracker.css for the floating-card styling. Anchor
// links go through "/" explicitly so they work correctly from /pricing too.
export default function SiteNav() {
  return (
    <header className="landing-nav">
      <div className="landing-nav-brand">
        <Link href="/" aria-label="Altora">
          <AltoraLogo className="landing-nav-logo" />
        </Link>
      </div>
      <nav className="landing-nav-links">
        <Link href="/#fonctionnalites" className="landing-nav-link">Fonctionnalités</Link>
        <Link href="/pricing" className="landing-nav-link">Tarifs</Link>
      </nav>
      <div className="landing-nav-actions">
        <Link href="/login" className="landing-nav-login">Se connecter</Link>
        <Link href="/signup" className="landing-nav-cta">Essayer Altora</Link>
      </div>
    </header>
  );
}
