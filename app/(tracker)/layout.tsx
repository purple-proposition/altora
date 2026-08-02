import Script from 'next/script';
import '../tracker.css';
import { auth } from '@/auth';
import Sidebar from '@/components/Sidebar';
import GridOverlayToggle from '@/components/GridOverlayToggle';
import SchoolAdminToggle from '@/components/SchoolAdminToggle';
import { SidebarCollapseProvider } from '@/components/SidebarCollapseContext';
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
          <main className="app">{children}</main>
        </div>
      </SidebarCollapseProvider>

      <div className="grid-overlay" id="grid-overlay">
        {Array.from({ length: 12 }).map((_, i) => <span key={i}></span>)}
      </div>
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
      {/* lucide.js (the global runtime, ~98KB gzipped) used to load here on
          every single route — but every React-rendered icon now goes through
          lucide-react (see components/Icon.tsx), and the only markup still
          using data-lucide + this global runtime is the kanban board/
          calendar that tracker.js builds imperatively, which only ever
          exists on the home page. Loading it on Documents/École/Profil/Inbox
          was pure dead weight; it's now loaded there instead (see
          app/(tracker)/page.tsx). */}
    </>
  );
}
