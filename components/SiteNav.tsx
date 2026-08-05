'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Icon from '@/components/Icon';
import AltoraLogo from '@/components/AltoraLogo';
import QuoteCtaButton from '@/components/QuoteCtaButton';
import QuoteModal from '@/components/QuoteModal';

// Shared nav for every public marketing page — see .landing-nav-sticky/
// .landing-nav in tracker.css for the floating-card styling. Fonctionnalités
// and Tarifs used to be separate nav links (Tarifs to its own /pricing
// page) — both were folded into the single landing page, so the nav is
// now just the brand and the CTA.
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
// a hamburger popup. Reads .landing-card's own scroll, not the window —
// .landing-card is the actual scroll container (overflow-y:auto), kept
// that way on purpose so its rounded top/bottom corners stay fixed in
// place under this sticky nav while its content scrolls, instead of
// scrolling away with a plain in-flow block.
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
    <div className="landing-nav-sticky">
    <header className={`landing-nav${scrolled ? ' landing-nav--scrolled' : ''}`}>
      <div className="landing-nav-brand">
        <Link href="/" aria-label="Altora">
          <AltoraLogo className="landing-nav-logo" />
        </Link>
      </div>
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
            <QuoteCtaButton className="landing-nav-cta landing-nav-popup-cta" location="nav_popup" onClick={() => setMenuOpen(false)}>Contacter un expert</QuoteCtaButton>
          </div>
        </div>
      </div>
      <QuoteModal />
    </header>
    </div>
  );
}
