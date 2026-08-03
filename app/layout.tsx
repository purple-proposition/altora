import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './fonts.css';
import './dev-grid.css';
import GridOverlayToggle from '@/components/GridOverlayToggle';

// Self-hosted via next/font instead of a <link> to fonts.googleapis.com —
// that external stylesheet cost a DNS lookup + connection to
// fonts.googleapis.com, then another to fonts.gstatic.com for the actual
// woff2 files, all on the critical path before body text could render with
// its real font. next/font downloads the font at build time and serves it
// from the same origin, with the right file preloaded automatically — one
// fewer render-blocking round trip on every single page.
//
// fonts.css is imported here (rather than tracker.css, which only loads
// inside the (tracker) layout) so the Gloock brand font reaches every page,
// including login/signup. The "g" grid overlay lives here for the same
// reason: it must show on every route (login, signup, pricing, the
// landing page, the dashboard) and stay that way regardless of future
// changes to any individual page's own layout — living once in the root
// layout instead of being re-declared per page is what makes that durable.
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Altora',
  description: 'Suivi de candidatures, génération de CV et lettre de motivation avec analyse ATS',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.className}>
      <body style={{ margin: 0, padding: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {children}
        <div className="grid-overlay" id="grid-overlay">
          {Array.from({ length: 12 }).map((_, i) => <span key={i}></span>)}
        </div>
        <GridOverlayToggle />
      </body>
    </html>
  );
}
