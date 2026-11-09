'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';

export type LoginValues = { email: string; password: string };

// Formulaire de connexion. Le parent gère la requête via onSubmit.
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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      className={cn('flex flex-col gap-5', className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ email, password });
      }}
    >
      <Field id="login-email" label="Email">
        <Input id="login-email" type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>

      <Field
        id="login-password"
        label="Mot de passe"
        labelExtra={<Link href="/recover" className="text-sm text-neutral-900 underline underline-offset-4">Mot de passe oublié ?</Link>}
      >
        <div className="relative">
          <Input
            id="login-password"
            className="pr-11"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Ton mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-neutral-500 hover:text-neutral-900"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Connexion…' : 'Se connecter'}
        {!busy && <ChevronRight size={18} />}
      </Button>
    </form>
  );
}
