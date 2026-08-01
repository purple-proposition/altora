'use client';

import { useEffect } from 'react';

// Same recovery screen as error.tsx, but for the rare case where the crash
// happens in the root layout itself (error.tsx can't catch that — Next
// requires this separate file, which has to render its own <html>/<body>
// since it replaces the root layout entirely while active).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Uncaught root-layout error:', error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
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
            background: '#141414',
            color: '#f5f5f5',
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>Une erreur inattendue est survenue</h1>
          <p style={{ fontSize: 14, color: '#a1a1aa', maxWidth: 420, margin: 0 }}>
            Le reste de tes données est intact — rien n&apos;a été perdu. Tu peux réessayer, ou revenir à l&apos;accueil.
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
      </body>
    </html>
  );
}
