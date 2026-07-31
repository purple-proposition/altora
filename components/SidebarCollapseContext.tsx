'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const COLLAPSED_KEY = 'altora-sidebar-collapsed';
const MOBILE_QUERY = '(max-width: 1000px)';

type SidebarCollapseValue = { collapsed: boolean; toggle: () => void; mobileOpen: boolean; closeMobile: () => void };

const SidebarCollapseContext = createContext<SidebarCollapseValue | null>(null);

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  // Starts expanded (matching the server-rendered markup) and only reads the
  // saved preference after mount — reading localStorage in the initial state
  // would render differently than the server did and trip a hydration mismatch.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(COLLAPSED_KEY) === '1') setCollapsed(true);
  }, []);

  // Below the tablet breakpoint the sidebar isn't a rail that shrinks to
  // icons — .sidebar is a fixed off-canvas drawer there instead (see the
  // @media block in tracker.css), so the SAME topbar button needs to mean
  // something different depending on viewport: shrink-to-icons on desktop,
  // open/close the drawer on mobile. This is session-only (never persisted)
  // since "the drawer happened to be open" isn't a preference worth
  // remembering across visits the way the desktop rail width is.
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggle() {
    if (typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches) {
      setMobileOpen(prev => !prev);
      return;
    }
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <SidebarCollapseContext.Provider value={{ collapsed, toggle, mobileOpen, closeMobile }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse() {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) throw new Error('useSidebarCollapse must be used within a SidebarCollapseProvider');
  return ctx;
}
