import Script from 'next/script';
import '../tracker.css';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';
import { assetVersion } from '@/lib/assetVersion';

export default async function TrackerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const fullName = session?.user?.name || '';
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || '';
  const userExtra = session?.user as { promotion?: string | null } | undefined;
  const promotion = userExtra?.promotion || '';

  return (
    <>
      <div className="app-shell">
        <Sidebar fullName={fullName} firstName={firstName} promotion={promotion} />
        <div className="app">{children}</div>
      </div>

      <div className="grid-overlay" id="grid-overlay"></div>

      {/* beforeInteractive only runs on the very first hard page load of the
          whole app — since every session actually starts at /login (outside
          this layout) and reaches "/" via a client-side redirect, this
          layout is mounted client-side, and beforeInteractive scripts here
          never fire at all. afterInteractive fires correctly regardless of
          how the layout was mounted. */}
      <Script id="altora-theme" strategy="afterInteractive">
        {`
          var theme = localStorage.getItem('altora-theme') || 'system';
          if (theme === 'dark' || theme === 'light') {
            document.documentElement.setAttribute('data-theme', theme);
          }
        `}
      </Script>
      <Script id="altora-lucide" src={`/lucide.js?v=${assetVersion('lucide.js')}`} strategy="afterInteractive" />
      <Script id="altora-icons" strategy="afterInteractive">
        {`
          (function renderIcons() {
            if (window.lucide) { lucide.createIcons(); }
            else { setTimeout(renderIcons, 50); }
          })();
        `}
      </Script>
    </>
  );
}
