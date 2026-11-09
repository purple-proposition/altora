import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter } from 'next/font/google';
import './swiss.css';

// Mesure GA4 (propriété Altora), identifiant public.
const GA_MEASUREMENT_ID = 'G-5E514S4GEX';

// Une seule famille typographique pour toute l'interface, auto-hébergée.
const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata: Metadata = {
  title: 'Altora',
  description: 'Adapter son CV et sa lettre à chaque offre',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>
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
      </body>
    </html>
  );
}
