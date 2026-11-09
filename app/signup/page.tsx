'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AuthShell, inputClass, primaryButtonClass, linkClass } from '@/components/forms/field';
import { cn } from '@/lib/cn';

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
        <p className="rounded-lg bg-neutral-100 px-4 py-4 text-center font-mono text-xl tracking-widest text-neutral-950">{recoveryCode}</p>
        <label className="mt-6 flex items-center gap-3 text-sm text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={saved} onChange={e => setSaved(e.target.checked)} />
          J&apos;ai noté mon code de secours
        </label>
        <button type="button" disabled={!saved} onClick={() => { router.push('/generate'); router.refresh(); }} className={cn(primaryButtonClass, 'mt-6')}>
          Accéder à mon espace
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Créer mon espace"
      subtitle={`Un mot de passe d'au moins ${MIN} caractères.`}
      footer={<>Déjà un espace ? <Link href="/login" className={linkClass}>Se connecter</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="block">
          <span className="block text-sm font-medium text-neutral-900">Email</span>
          <input className={inputClass} type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-neutral-900">Mot de passe</span>
          <input className={inputClass} type="password" required minLength={MIN} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-neutral-900">Confirmer le mot de passe</span>
          <input className={inputClass} type="password" required minLength={MIN} autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Création…' : 'Créer mon espace'}
        </button>
      </form>
    </AuthShell>
  );
}
