import Script from 'next/script';
import '../tracker.css';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';
import GridOverlayToggle from '@/components/GridOverlayToggle';
import SchoolAdminToggle from '@/components/SchoolAdminToggle';
import { SidebarCollapseProvider } from '@/components/SidebarCollapseContext';
import { assetVersion } from '@/lib/assetVersion';
import { isUserSchoolAdmin } from '@/lib/school';

export default async function TrackerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const fullName = session?.user?.name || '';
  const firstName = fullName.split(' ')[0] || session?.user?.email?.split('@')[0] || '';
  const userExtra = session?.user as { promotion?: string | null } | undefined;
  const promotion = userExtra?.promotion || '';
  const isSchoolAdmin = session?.user?.id ? await isUserSchoolAdmin(session.user.id) : false;

  return (
    <>
      <SidebarCollapseProvider>
        <div className="app-shell">
          <Sidebar fullName={fullName} firstName={firstName} promotion={promotion} isSchoolAdmin={isSchoolAdmin} />
          <div className="app">{children}</div>
        </div>
      </SidebarCollapseProvider>

      <div className="grid-overlay" id="grid-overlay"></div>
      <GridOverlayToggle />
      <SchoolAdminToggle />

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
      {/* Sidebar.tsx renders icons itself (on every route change, via
          useEffect) since a one-shot script here would only ever catch
          whichever page was current the one time it fired. */}
      <Script id="altora-lucide" src={`/lucide.js?v=${assetVersion('lucide.js')}`} strategy="afterInteractive" />
    </>
  );
}
