'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import AltoraLogo from '@/components/AltoraLogo';
import { getInvite } from '@/lib/invites';

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  // Purely for the welcome message — the token itself is re-verified
  // server-side by the "invite" Credentials provider (see auth.ts) on
  // sign-in, this lookup on its own never grants anything.
  const inviteName = getInvite(inviteCode)?.name ?? null;
  const [error, setError] = useState('');

  useEffect(() => {
    if (!inviteCode) return;
    let cancelled = false;
    signIn('invite', { token: inviteCode, redirect: false }).then((res) => {
      if (cancelled) return;
      if (res?.error) {
        setError("Ce lien n'est plus valide.");
        return;
      }
      router.push('/');
      router.refresh();
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f5f5f7', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <AltoraLogo style={{ width: '128px', height: '32px' }} />
        </div>

        {!inviteCode ? (
          <>
            <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, margin: '0 0 8px' }}>Accès sur invitation uniquement</p>
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              Altora est en bêta privée pour le moment. Si on t&apos;a promis un accès, utilise le lien qu&apos;on t&apos;a envoyé.
            </p>
          </>
        ) : error ? (
          <p style={{ fontSize: '13px', color: '#c0392b', margin: 0 }}>{error}</p>
        ) : inviteName ? (
          <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, margin: 0 }}>
            Bienvenue {inviteName} 👋 connexion en cours…
          </p>
        ) : (
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Connexion en cours…</p>
        )}

        <p style={{ fontSize: '13px', color: '#666', textAlign: 'center', marginTop: '16px' }}>
          Déjà un compte ? <Link href="/login" style={{ color: '#4f46e5', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
