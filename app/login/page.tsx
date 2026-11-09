'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { LoginForm, type LoginValues } from '@/components/forms/login-form';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit({ email, password }: LoginValues) {
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

        <LoginForm busy={busy} error={error} onSubmit={handleSubmit} />

        <Link className="auth-link" href="/recover">Mot de passe oublié ? Utiliser mon code de secours</Link>

        <div className="auth-footer">
          Pas encore de compte ? <Link href="/signup">Créer mon espace</Link>
        </div>
      </div>
    </main>
  );
}
