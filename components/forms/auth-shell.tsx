import { cn } from '@/lib/cn';

// Cadre commun des pages d'authentification : carte centrée sur fond à hachures.
export function AuthShell({ title, subtitle, children, footer, className }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-white p-6 font-sans"
      style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 14px, rgba(0,0,0,0.035) 14px 15px)' }}
    >
      <div className={cn('w-full max-w-[400px] rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200', className)}>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950">{title}</h1>
        {subtitle && <p className="mt-2 text-base text-neutral-500">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 text-center text-base text-neutral-500">{footer}</div>}
      </div>
    </main>
  );
}
