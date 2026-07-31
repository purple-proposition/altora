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

      <Script id="altora-theme" strategy="beforeInteractive">
        {`
          var theme = localStorage.getItem('altora-theme') || 'system';
          if (theme === 'dark' || theme === 'light') {
            document.documentElement.setAttribute('data-theme', theme);
          }
        `}
      </Script>
      <Script src={`/lucide.js?v=${assetVersion('lucide.js')}`} strategy="beforeInteractive" />
      <Script id="altora-icons" strategy="afterInteractive">
        {'lucide.createIcons();'}
      </Script>
    </>
  );
}
