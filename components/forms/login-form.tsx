'use client';

import { useState } from 'react';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type LoginValues = { email: string; password: string };

// Formulaire de connexion réutilisable. Le parent décide quoi faire des
// valeurs via onSubmit ; ce composant ne fait que collecter les champs.
export function LoginForm({
  onSubmit,
  error,
  busy = false,
  className,
  forgotHref,
}: {
  onSubmit: (values: LoginValues) => void | Promise<void>;
  error?: string;
  busy?: boolean;
  className?: string;
  forgotHref?: string;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ email, password });
  }

  const input = cn(
    'mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5',
    'text-base text-neutral-900 placeholder:text-neutral-400 outline-none',
    'focus:border-neutral-900',
  );

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-5', className)}>
      <label className="block">
        <span className="block text-sm font-medium text-neutral-900">Email</span>
        <input className={input} type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
      </label>

      <label className="block">
        <span className="flex items-baseline justify-between text-sm font-medium text-neutral-900">
          Mot de passe
          {forgotHref && (
            <a href={forgotHref} className="text-sm font-normal text-neutral-900 underline underline-offset-4">Mot de passe oublié ?</a>
          )}
        </span>
        <span className="relative block">
          <input
            className={cn(input, 'pr-11')}
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Ton mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute inset-y-0 right-0 mt-2 flex w-11 items-center justify-center text-neutral-500 hover:text-neutral-900"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-3 text-base font-semibold text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {busy ? 'Connexion…' : 'Se connecter'}
        {!busy && <ChevronRight size={18} />}
      </button>
    </form>
  );
}
