'use client';

import { useEffect } from 'react';
import { useSidebarCollapse } from './SidebarCollapseContext';
import { safeCreateIcons } from '@/lib/icons';

export default function SidebarCollapseToggle() {
  const { collapsed, toggle } = useSidebarCollapse();

  // The icon swaps (panel-left-close / panel-left-open) on every toggle, and
  // lucide only turns a fresh <i data-lucide> into an SVG when createIcons()
  // runs again — Sidebar.tsx already re-runs it on collapse changes, but this
  // button can mount after that (e.g. on a fresh page navigation), so it
  // needs its own pass too.
  useEffect(() => {
    const w = window as unknown as { lucide?: { createIcons: () => void } };
    if (w.lucide) {
      safeCreateIcons();
      return;
    }
    const id = setInterval(() => {
      if (w.lucide) {
        safeCreateIcons();
        clearInterval(id);
      }
    }, 50);
    return () => clearInterval(id);
  }, [collapsed]);

  return (
    <button
      type="button"
      className="topbar-collapse-btn"
      onClick={toggle}
      title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
      aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
    >
      <i data-lucide={collapsed ? 'panel-left-open' : 'panel-left-close'}></i>
    </button>
  );
}
