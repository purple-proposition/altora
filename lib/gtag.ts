// Thin wrapper around the global gtag() queued by the GA4 snippet in
// app/layout.tsx. Guards against gtag not existing yet (script still
// loading, or blocked by an ad blocker) instead of throwing, losing an
// analytics event silently beats crashing the page over it.
export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', name, params);
}
