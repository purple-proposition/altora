// lucide.createIcons() throws synchronously the moment it hits a
// data-lucide value that isn't in the bundled icon set (e.g. a typo, or an
// icon name that doesn't exist in this pinned lucide version) — and because
// every call site here runs inside a React effect or a plain <script>, an
// uncaught throw there doesn't just skip that one icon, it aborts the rest
// of that render pass entirely, which is exactly what caused prior
// "Application error" crashes on pages with a bad icon name. Every call site
// should go through this instead of calling window.lucide.createIcons()
// directly, so a bad icon name only logs a warning instead of taking the
// whole page down.
export function safeCreateIcons() {
  const w = window as unknown as { lucide?: { createIcons: () => void } };
  if (!w.lucide) return;
  try {
    w.lucide.createIcons();
  } catch (e) {
    console.warn('[lucide] createIcons() failed — check for an invalid data-lucide name', e);
  }
}
