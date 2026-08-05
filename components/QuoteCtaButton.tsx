'use client';

import { trackEvent } from '@/lib/gtag';

// Every "Demander un devis" button on the public site fires this same
// window event instead of linking to /signup — QuoteModal (mounted once,
// in SiteNav) listens for it, so any button anywhere can open the shared
// modal without threading state/context through server components.
export const OPEN_QUOTE_MODAL_EVENT = 'open-quote-modal';

export default function QuoteCtaButton({
  className,
  children,
  onClick,
  location,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  // Which instance of this button got clicked (nav, hero, closing...) —
  // every call site on the public site passes its own, so GA can tell
  // them apart instead of lumping every "Contacter un expert" together.
  location: string;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        trackEvent('cta_click', { cta_location: location });
        window.dispatchEvent(new Event(OPEN_QUOTE_MODAL_EVENT));
      }}
    >
      {children}
    </button>
  );
}
