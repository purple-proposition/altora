'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const MIN = 12;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Shown once, right after account creation, then never again.
  const [recoveryCode, setRecoveryCode] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setBusy(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(data.error || 'Impossible de créer ton espace.');
      return;
    }
    // Account exists now: sign in right away, then show the recovery code.
    await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    setRecoveryCode(data.recoveryCode);
  }

  if (recoveryCode) {
    return (
      <main style={{ maxWidth: 420, margin: '0 auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Ton code de secours</h1>
        <p style={{ margin: '0 0 16px' }}>
          Note-le maintenant, il ne sera plus affiché. Sans lui et sans ton mot de passe, tu ne pourras plus accéder à ton espace.
        </p>
        <pre style={{ fontSize: 20, letterSpacing: 2, padding: 16, border: '1px solid #000', margin: '0 0 16px' }}>{recoveryCode}</pre>
        <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} />
          J&apos;ai noté mon code de secours
        </label>
        <button type="button" disabled={!saved} onClick={() => { router.push('/generate'); router.refresh(); }} style={{ padding: '12px 16px', background: '#000', color: '#fff', border: 0, opacity: saved ? 1 : 0.4 }}>
          Accéder à mon espace
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, margin: '0 0 24px' }}>Créer mon espace</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 16 }}>Email
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>Mot de passe ({MIN} caractères minimum)
          <input type="password" required minLength={MIN} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>Confirmer le mot de passe
          <input type="password" required minLength={MIN} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }} />
        </label>
        {error && <p style={{ color: '#b00', margin: '0 0 16px' }}>{error}</p>}
        <button type="submit" disabled={busy} style={{ padding: '12px 16px', background: '#000', color: '#fff', border: 0 }}>
          {busy ? 'Création…' : 'Créer mon espace'}
        </button>
      </form>
      <p style={{ marginTop: 24 }}>Déjà un espace ? <Link href="/login">Se connecter</Link></p>
    </main>
  );
}
