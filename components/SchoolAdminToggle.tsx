'use client';

import { useEffect } from 'react';

// Dev/demo shortcut: Cmd/Ctrl+Shift+A flips the current user's own
// is_school_admin flag so you can preview the admin UI instantly, then
// flip back to the student view the same way.
export default function SchoolAdminToggle() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || !e.shiftKey) return;
      if (e.key.toLowerCase() !== 'a') return;
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      e.preventDefault();
      fetch('/api/school/toggle-admin', { method: 'POST' })
        .then(res => res.json())
        .then(({ isAdmin }) => {
          window.location.href = isAdmin ? '/ecole' : '/?view=home';
        })
        .catch(() => {});
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
