'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const COLLAPSED_KEY = 'altora-sidebar-collapsed';

type SidebarCollapseValue = { collapsed: boolean; toggle: () => void };

const SidebarCollapseContext = createContext<SidebarCollapseValue | null>(null);

export function SidebarCollapseProvider({ children }: { children: React.ReactNode }) {
  // Starts expanded (matching the server-rendered markup) and only reads the
  // saved preference after mount — reading localStorage in the initial state
  // would render differently than the server did and trip a hydration mismatch.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    if (localStorage.getItem(COLLAPSED_KEY) === '1') setCollapsed(true);
  }, []);

  function toggle() {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  }

  return (
    <SidebarCollapseContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse() {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) throw new Error('useSidebarCollapse must be used within a SidebarCollapseProvider');
  return ctx;
}
