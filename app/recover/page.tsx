'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { AuthShell, inputClass, primaryButtonClass, linkClass } from '@/components/forms/field';
import { cn } from '@/lib/cn';

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
      <AuthShell title="Nouveau code de secours" subtitle="L'ancien code ne fonctionne plus. Note celui-ci : il ne sera plus affiché.">
        <p className="rounded-lg bg-neutral-100 px-4 py-4 text-center font-mono text-xl tracking-widest text-neutral-950">{newCode}</p>
        <label className="mt-6 flex items-center gap-3 text-sm text-neutral-900">
          <input type="checkbox" className="h-4 w-4 accent-neutral-950" checked={saved} onChange={e => setSaved(e.target.checked)} />
          J&apos;ai noté mon nouveau code
        </label>
        <button type="button" disabled={!saved} onClick={() => { router.push('/generate'); router.refresh(); }} className={cn(primaryButtonClass, 'mt-6')}>
          Accéder à mon espace
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Code de secours"
      subtitle="Saisis le code noté à la création de ton espace, puis choisis un nouveau mot de passe."
      footer={<><Link href="/login" className={linkClass}>Retour à la connexion</Link></>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="block">
          <span className="block text-sm font-medium text-neutral-900">Email</span>
          <input className={inputClass} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-neutral-900">Code de secours</span>
          <input className={cn(inputClass, 'font-mono tracking-widest')} type="text" required value={code} onChange={e => setCode(e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-neutral-900">Nouveau mot de passe</span>
          <input className={inputClass} type="password" required minLength={MIN} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className={primaryButtonClass}>
          {busy ? 'Vérification…' : 'Réinitialiser'}
        </button>
      </form>
    </AuthShell>
  );
}
