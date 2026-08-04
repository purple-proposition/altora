'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import AltoraLogo from '@/components/AltoraLogo';
import QuoteCtaButton from '@/components/QuoteCtaButton';
import QuoteModal from '@/components/QuoteModal';

// Shared nav for every public marketing page (landing, pricing) — see
// .landing-nav in tracker.css for the floating-card styling. Anchor links
// go through "/" explicitly so they work correctly from /pricing too.
//
// Stays a flex sibling above .landing-card rather than moving into it. It
// only reads the page's scroll to react to it: past a small threshold, the
// nav compacts (half its vertical padding, a smaller logo) and the
// links/actions collapse into a hamburger popup — the nav's own position
// never changes. Reads window scroll, not .landing-card's — the page
// scrolls normally (see .landing/.landing-card in tracker.css), it isn't
// its own nested scroll container.
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!scrolled) setMenuOpen(false);
  }, [scrolled]);

  return (
    <header className={`landing-nav${scrolled ? ' landing-nav--scrolled' : ''}`}>
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
        <QuoteCtaButton className="landing-nav-cta">Contacter un expert</QuoteCtaButton>
        <div className="landing-nav-menu-wrap">
          <button
            type="button"
            className="landing-nav-menu-btn"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} />
          </button>
          <div className={`landing-nav-popup${menuOpen ? ' landing-nav-popup--visible' : ''}`}>
            <Link href="/#fonctionnalites" className="landing-nav-popup-link" onClick={() => setMenuOpen(false)}>Fonctionnalités</Link>
            <Link href="/pricing" className="landing-nav-popup-link" onClick={() => setMenuOpen(false)}>Tarifs</Link>
            <Link href="/login" className="landing-nav-popup-link" onClick={() => setMenuOpen(false)}>Se connecter</Link>
            <QuoteCtaButton className="landing-nav-cta landing-nav-popup-cta" onClick={() => setMenuOpen(false)}>Contacter un expert</QuoteCtaButton>
          </div>
        </div>
      </div>
      <QuoteModal />
    </header>
  );
}
