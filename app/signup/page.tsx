'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AuthShell } from '@/components/forms/auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { RecoveryCodeBlock } from '@/components/forms/recovery-code-block';

const MIN = 12;

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Affiché une seule fois, juste après la création du compte.
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
    await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    setRecoveryCode(data.recoveryCode);
  }

  if (recoveryCode) {
    return (
      <AuthShell title="Ton code de secours" subtitle="Note-le maintenant : il ne sera plus affiché. Sans lui ni ton mot de passe, tu ne pourras plus accéder à ton espace.">
        <RecoveryCodeBlock code={recoveryCode} saved={saved} onSaved={setSaved} onContinue={() => { router.push('/generate'); router.refresh(); }} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Créer mon espace"
      subtitle={`Un mot de passe d'au moins ${MIN} caractères.`}
      footer={<>Déjà un espace ? <Link href="/login" className="font-medium text-neutral-950 underline underline-offset-4">Se connecter</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id="signup-email" label="Email">
          <Input id="signup-email" type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="signup-password" label="Mot de passe">
          <Input id="signup-password" type="password" required minLength={MIN} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field id="signup-confirm" label="Confirmer le mot de passe">
          <Input id="signup-confirm" type="password" required minLength={MIN} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Création…' : 'Créer mon espace'}
        </Button>
      </form>
    </AuthShell>
  );
}
