import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Self-hosted via next/font instead of a <link> to fonts.googleapis.com —
// that external stylesheet cost a DNS lookup + connection to
// fonts.googleapis.com, then another to fonts.gstatic.com for the actual
// woff2 files, all on the critical path before body text could render with
// its real font. next/font downloads the font at build time and serves it
// from the same origin, with the right file preloaded automatically — one
// fewer render-blocking round trip on every single page. ("BBH Hegarty" in
// the old URL wasn't a real Google Fonts family and Google silently ignored
// it, so dropping it changes nothing visually — login/signup's inline
// fallback to "Inter" already covers that logo text.)
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
      </body>
    </html>
  );
}
