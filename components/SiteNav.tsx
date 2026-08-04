'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import AltoraLogo from '@/components/AltoraLogo';

// Shared sticky nav for every public marketing page (landing, pricing) —
// see .landing-nav in tracker.css for the floating-card styling. Anchor
// links go through "/" explicitly so they work correctly from /pricing too.
//
// Sits inside .landing-card (the actual scroll container — .landing itself
// never scrolls) so it can stick to the top of it. Standardized scroll
// reaction past a small threshold: the nav compacts (half its vertical
// padding, a smaller logo) and the links/actions collapse into a hamburger
// popup, so content passes behind a frosted-glass bar instead of a hard
// edge.
export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const scrollEl = document.querySelector('.landing-card');
    if (!scrollEl) return;
    const onScroll = () => setScrolled(scrollEl.scrollTop > 8);
    onScroll();
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
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
        <Link href="/signup" className="landing-nav-cta">Essayer Altora</Link>
        <button
          type="button"
          className="landing-nav-menu-btn"
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Icon name={menuOpen ? 'x' : 'menu'} />
        </button>
      </div>
      {menuOpen && (
        <div className="landing-nav-popup">
          <Link href="/#fonctionnalites" className="landing-nav-popup-link" onClick={() => setMenuOpen(false)}>Fonctionnalités</Link>
          <Link href="/pricing" className="landing-nav-popup-link" onClick={() => setMenuOpen(false)}>Tarifs</Link>
          <Link href="/login" className="landing-nav-popup-link" onClick={() => setMenuOpen(false)}>Se connecter</Link>
          <Link href="/signup" className="landing-nav-cta landing-nav-popup-cta" onClick={() => setMenuOpen(false)}>Essayer Altora</Link>
        </div>
      )}
    </header>
  );
}
