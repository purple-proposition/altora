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
        <RecoveryCodeBlock code={newCode} saved={saved} onSaved={setSaved} onContinue={() => { router.push('/generate'); router.refresh(); }} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Code de secours"
      subtitle="Saisis le code noté à la création de ton espace, puis choisis un nouveau mot de passe."
      footer={<Link href="/login" className="font-medium text-neutral-950 underline underline-offset-4">Retour à la connexion</Link>}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field id="recover-email" label="Email">
          <Input id="recover-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field id="recover-code" label="Code de secours">
          <Input id="recover-code" className="font-mono tracking-widest" type="text" required value={code} onChange={(e) => setCode(e.target.value)} />
        </Field>
        <Field id="recover-password" label="Nouveau mot de passe">
          <Input id="recover-password" type="password" required minLength={MIN} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy ? 'Vérification…' : 'Réinitialiser'}
        </Button>
      </form>
    </AuthShell>
  );
}
