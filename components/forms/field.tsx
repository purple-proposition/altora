'use client';

import { cn } from '@/lib/cn';

// Champ texte de la charte : label au-dessus, bordure fine, focus noir.
export const inputClass = cn(
  'mt-2 block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5',
  'text-base text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900',
);

export const primaryButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-950 px-4 py-3 text-base font-semibold text-white hover:bg-neutral-800 disabled:opacity-50';

export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-white p-6 font-sans"
      style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.035) 14px 15px)' }}
    >
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-neutral-500">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <p className="mt-8 text-center text-base text-neutral-500">{footer}</p>}
      </div>
    </main>
  );
}

export const linkClass = 'font-medium text-neutral-950 underline underline-offset-4';
