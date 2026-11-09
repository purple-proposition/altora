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
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Connexion à Altora</h1>
        <p className="auth-subtitle">Entre ton email et ton mot de passe.</p>

        <form onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-label">Email</span>
            <input className="auth-input" type="email" required autoComplete="email" placeholder="nom@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label className="auth-field">
            <span className="auth-label">Mot de passe</span>
            <input className="auth-input" type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-button" type="submit" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <Link className="auth-link" href="/recover">Mot de passe oublié ? Utiliser mon code de secours</Link>

        <div className="auth-footer">
          Pas encore de compte ? <Link href="/signup">Créer mon espace</Link>
        </div>
      </div>
    </main>
  );
}
