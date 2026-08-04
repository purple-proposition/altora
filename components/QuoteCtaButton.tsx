'use client';

// Every "Demander un devis" button on the public site fires this same
// window event instead of linking to /signup — QuoteModal (mounted once,
// in SiteNav) listens for it, so any button anywhere can open the shared
// modal without threading state/context through server components.
export const OPEN_QUOTE_MODAL_EVENT = 'open-quote-modal';

export default function QuoteCtaButton({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        window.dispatchEvent(new Event(OPEN_QUOTE_MODAL_EVENT));
      }}
    >
      {children}
    </button>
  );
}
