'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';

export type LoginValues = { email: string; password: string };

// Formulaire de connexion réutilisable. Le parent décide quoi faire des
// valeurs via onSubmit ; ce composant ne fait que collecter les champs.
// Palette Tailwind « neutral ».
export function LoginForm({
  onSubmit,
  error,
  busy = false,
  className,
}: {
  onSubmit: (values: LoginValues) => void | Promise<void>;
  error?: string;
  busy?: boolean;
  className?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ email, password });
  }

  const label = 'mt-7 block';
  const labelText = 'block text-sm font-medium text-neutral-100';
  const input = cn(
    'mt-2.5 block w-full rounded-full border border-neutral-700 bg-transparent px-4.5 py-3.5',
    'text-base text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-neutral-100',
  );

  return (
    <form onSubmit={handleSubmit} className={cn('mt-0', className)}>
      <label className={label}>
        <span className={labelText}>Email</span>
        <input className={input} type="email" required autoComplete="email" placeholder="nom@exemple.com" value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <label className={label}>
        <span className={labelText}>Mot de passe</span>
        <input className={input} type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 block w-full rounded-full bg-neutral-100 px-4.5 py-3.5 text-base font-medium text-neutral-950 disabled:opacity-50"
      >
        {busy ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  );
}
