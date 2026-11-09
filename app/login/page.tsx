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
    <main
      className="flex min-h-screen items-center justify-center bg-white p-6 font-sans"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.035) 14px 15px)',
      }}
    >
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950">Bon retour</h1>
        <p className="mt-2 text-base text-neutral-500">Connecte-toi pour accéder à ton espace.</p>

        <div className="mt-8">
          <LoginForm busy={busy} error={error} onSubmit={handleSubmit} forgotHref="/recover" />
        </div>

        <p className="mt-8 text-center text-base text-neutral-500">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="font-medium text-neutral-950 underline underline-offset-4">Créer mon espace</Link>
        </p>
      </div>
    </main>
  );
}
