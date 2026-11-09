'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

const MIN = 12;

export default function RecoverPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await fetch('/api/auth/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setBusy(false);
      setError(data.error || 'Impossible de réinitialiser le mot de passe.');
      return;
    }
    await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    setNewCode(data.recoveryCode);
  }

  if (newCode) {
    return (
      <main style={{ maxWidth: 420, margin: '0 auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1 style={{ fontSize: 24, margin: '0 0 12px' }}>Nouveau code de secours</h1>
        <p style={{ margin: '0 0 16px' }}>L&apos;ancien code ne fonctionne plus. Note celui-ci, il ne sera plus affiché.</p>
        <pre style={{ fontSize: 20, letterSpacing: 2, padding: 16, border: '1px solid #000', margin: '0 0 16px' }}>{newCode}</pre>
        <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} />
          J&apos;ai noté mon nouveau code
        </label>
        <button type="button" disabled={!saved} onClick={() => { router.push('/generate'); router.refresh(); }} style={{ padding: '12px 16px', background: '#000', color: '#fff', border: 0, opacity: saved ? 1 : 0.4 }}>
          Accéder à mon espace
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, margin: '0 0 24px' }}>Code de secours</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 16 }}>Email
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>Code de secours
          <input type="text" required value={code} onChange={e => setCode(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box', letterSpacing: 2 }} />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>Nouveau mot de passe ({MIN} caractères minimum)
          <input type="password" required minLength={MIN} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }} />
        </label>
        {error && <p style={{ color: '#b00', margin: '0 0 16px' }}>{error}</p>}
        <button type="submit" disabled={busy} style={{ padding: '12px 16px', background: '#000', color: '#fff', border: 0 }}>
          {busy ? 'Vérification…' : 'Réinitialiser'}
        </button>
      </form>
    </main>
  );
}
