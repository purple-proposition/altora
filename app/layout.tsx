import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './fonts.css';
import './dev-grid.css';
import GridOverlayToggle from '@/components/GridOverlayToggle';

// GA4 property "Altora" (analytics.google.com), measurement ID only —
// not a secret, it's meant to ship in every page's client-side source.
// afterInteractive: loads after the page is interactive rather than
// blocking initial render, same tradeoff Next.js recommends for
// analytics scripts that don't need to run before paint.
const GA_MEASUREMENT_ID = 'G-5E514S4GEX';

// next/font/google still downloads at build time and self-hosts the woff2
// (same zero-external-request benefit as geist/font/sans below), just for
// Inter instead of Geist Sans — variable name kept as --font-geist-sans so
// every existing var(--font-geist-sans) reference in tracker.css/layout
// doesn't need touching.
const inter = Inter({ subsets: ['latin'], variable: '--font-geist-sans' });

// Self-hosted via next/font instead of a <link> to fonts.googleapis.com —
// that external stylesheet cost a DNS lookup + connection to
// fonts.googleapis.com, then another to fonts.gstatic.com for the actual
// woff2 files, all on the critical path before body text could render with
// its real font. next/font downloads the font at build time and serves it
// from the same origin, with the right file preloaded automatically — one
// fewer render-blocking round trip on every single page.
//
// fonts.css is imported here (rather than tracker.css, which only loads
// inside the (tracker) layout) so the Goudy Bookletter 1911 brand font reaches every page,
// including login/signup. The "g" grid overlay lives here for the same
// reason: it must show on every route (login, signup, pricing, the
// landing page, the dashboard) and stay that way regardless of future
// changes to any individual page's own layout — living once in the root
// layout instead of being re-declared per page is what makes that durable.
export const metadata: Metadata = {
  title: 'Altora',
  description: 'Suivi de candidatures, génération de CV et lettre de motivation avec analyse ATS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body style={{ margin: 0, padding: 0, fontFamily: 'var(--font-geist-sans), system-ui, sans-serif' }}>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
        <div className="grid-overlay" id="grid-overlay">
          {Array.from({ length: 12 }).map((_, i) => <span key={i}></span>)}
        </div>
        <GridOverlayToggle />
      </body>
    </html>
  );
}
