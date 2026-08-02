'use client';
import Icon from '@/components/Icon';

import { useSidebarCollapse } from './SidebarCollapseContext';

export default function SidebarCollapseToggle() {
  const { collapsed, toggle } = useSidebarCollapse();

  return (
    <button
      type="button"
      className="topbar-collapse-btn"
      onClick={toggle}
      title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
      aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
    >
      <Icon name={collapsed ? 'panel-left-open' : 'panel-left-close'} />
    </button>
  );
}
