'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import AltoraLogo from '@/components/AltoraLogo';
import QuoteCtaButton from '@/components/QuoteCtaButton';
import QuoteModal from '@/components/QuoteModal';

// Shared nav for every public marketing page (landing, pricing) — see
// .landing-nav-sticky/.landing-nav in tracker.css for the floating-card
// styling. Anchor links go through "/" explicitly so they work correctly
// from /pricing too.
//
// The header itself (.landing-nav) stays a narrow, centered pill — the
// sticky positioning lives on the full-width wrapper around it
// (.landing-nav-sticky) instead, so its own opaque background covers the
// whole viewport width once pinned. A previous attempt made .landing-nav
// itself position:sticky directly: since it's narrower than the
// viewport, whatever was scrolling behind it stayed visible on both
// sides once pinned, reading as broken rather than floating.
//
// Past a small scroll threshold, the nav also compacts (half its
// vertical padding, a smaller logo) and the links/actions collapse into
// a hamburger popup. Reads window scroll, not any nested container —
// the page scrolls normally (see .landing/.landing-card in tracker.css).
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
    <div className="landing-nav-sticky">
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
        <QuoteCtaButton className="landing-nav-cta" location="nav">Contacter un expert</QuoteCtaButton>
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
            <QuoteCtaButton className="landing-nav-cta landing-nav-popup-cta" location="nav_popup" onClick={() => setMenuOpen(false)}>Contacter un expert</QuoteCtaButton>
          </div>
        </div>
      </div>
      <QuoteModal />
    </header>
    </div>
  );
}
