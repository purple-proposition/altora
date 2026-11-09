'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError('Email ou mot de passe incorrect.');
      return;
    }
    router.push(searchParams.get('callbackUrl') || '/generate');
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 420, margin: '0 auto', padding: 24, fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, margin: '0 0 24px' }}>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 16 }}>Email
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }} />
        </label>
        <label style={{ display: 'block', marginBottom: 16 }}>Mot de passe
          <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', padding: 12, fontSize: 16, boxSizing: 'border-box' }} />
        </label>
        {error && <p style={{ color: '#b00', margin: '0 0 16px' }}>{error}</p>}
        <button type="submit" disabled={busy} style={{ padding: '12px 16px', background: '#000', color: '#fff', border: 0 }}>
          {busy ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <p style={{ marginTop: 24 }}>
        <Link href="/recover">Mot de passe oublié ? Utiliser mon code de secours</Link>
      </p>
      <p>Pas encore d&apos;espace ? <Link href="/signup">Créer mon espace</Link></p>
    </main>
  );
}
