'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { LoginForm, type LoginValues } from '@/components/forms/login-form';
import { AuthShell } from '@/components/forms/auth-shell';

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
    <AuthShell
      title="Bon retour"
      subtitle="Connecte-toi pour accéder à ton espace."
      footer={<>Pas encore de compte ? <Link href="/signup" className="font-medium text-neutral-950 underline underline-offset-4">Créer mon espace</Link></>}
    >
      <LoginForm busy={busy} error={error} onSubmit={handleSubmit} />
    </AuthShell>
  );
}
