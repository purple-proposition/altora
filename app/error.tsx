'use client';

import { useEffect } from 'react';

// Catches any uncaught error thrown while rendering a page or its layouts
// (a bad API response shape, a null ref, tracker.js/React DOM fighting over
// the same node, etc) and shows a recoverable screen instead of Next's bare
// "Application error" page, which otherwise leaves the visitor with no way
// back in except an address-bar reload. Inline styles on purpose — this
// renders exactly when something upstream may have gone wrong, so it can't
// depend on tracker.css (loaded only inside the (tracker) layout) actually
// being present.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Uncaught client error:', error);
  }, [error]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        minHeight: '100vh',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: '#141414',
        color: '#f5f5f5',
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>Une erreur inattendue est survenue</h1>
      <p style={{ fontSize: 14, color: '#a1a1aa', maxWidth: 420, margin: 0 }}>
        Le reste de tes données est intact, rien n&apos;a été perdu. Tu peux réessayer, ou revenir à l&apos;accueil.
      </p>
      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: 'none',
            background: '#4f46e5',
            color: '#fff',
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Réessayer
        </button>
        <a
          href="/"
          style={{
            padding: '10px 20px',
            borderRadius: 999,
            border: '1px solid #333',
            color: '#f5f5f5',
            fontWeight: 500,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Retour à l&apos;accueil
        </a>
      </div>
    </div>
  );
}
