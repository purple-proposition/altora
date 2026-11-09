'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const inputStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box' as const };
const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#666', marginBottom: '6px' };
const buttonStyle = { width: '100%', padding: '12px', borderRadius: '999px', border: 'none', background: '#4f46e5', color: '#fff', fontSize: '16px', fontWeight: 700, cursor: 'pointer' };

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite');
  // Purely for the welcome message — the token itself is re-verified
  // server-side by the "invite" Credentials provider (see auth.ts) on
  // sign-in, this lookup on its own never grants anything.
  const inviteName = getInvite(inviteCode)?.name ?? null;
  const [error, setError] = useState('');

  // Email code flow (public sign-up).
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

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

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Impossible d'envoyer le code. Réessaie.");
      return;
    }
    setStep('code');
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await signIn('otp', { email, code, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError('Code incorrect ou expiré.');
      return;
    }
    router.push('/generate');
    router.refresh();
  }

  const showForm = !inviteCode;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: '#f5f5f7', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '380px', background: '#fff', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <AltoraLogo style={{ width: '128px', height: '32px' }} />
        </div>

        {showForm ? (
          step === 'email' ? (
            <form onSubmit={requestCode} style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, margin: '0 0 16px', textAlign: 'center' }}>Créer ton compte ou te connecter</p>
              <label htmlFor="signup-email" style={labelStyle}>Email</label>
              <input id="signup-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
              {error && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}
              <button type="submit" disabled={busy} style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Envoi…' : 'Recevoir mon code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, margin: '0 0 8px', textAlign: 'center' }}>Entre ton code</p>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px', textAlign: 'center' }}>Il a été envoyé à {email}. Valable 10 minutes.</p>
              <label htmlFor="signup-code" style={labelStyle}>Code à 6 chiffres</label>
              <input id="signup-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required autoComplete="one-time-code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} style={{ ...inputStyle, letterSpacing: '0.4em', textAlign: 'center' }} />
              {error && <p style={{ color: '#c0392b', fontSize: '13px', margin: '0 0 16px' }}>{error}</p>}
              <button type="submit" disabled={busy || code.length !== 6} style={{ ...buttonStyle, opacity: busy || code.length !== 6 ? 0.6 : 1 }}>
                {busy ? 'Vérification…' : 'Accéder à mon espace'}
              </button>
              <button type="button" onClick={() => { setStep('email'); setCode(''); setError(''); }} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: '#4f46e5', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                Changer d&apos;adresse
              </button>
            </form>
          )
        ) : error ? (
          <p style={{ fontSize: '13px', color: '#c0392b', margin: 0 }}>{error}</p>
        ) : inviteName ? (
          <p style={{ fontSize: '15px', color: '#171717', fontWeight: 600, margin: 0 }}>
            Bienvenue {inviteName} 👋 connexion en cours…
          </p>
        ) : (
          <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>Connexion en cours…</p>
        )}
      </div>
    </main>
  );
}
