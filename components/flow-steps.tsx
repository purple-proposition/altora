import { cn } from '@/lib/cn';

const STEPS = ['CV', 'Profil', 'Offre', 'Résultat'] as const;

// Repère de progression du parcours : étape courante en noir, étapes passées
// cochées, étapes à venir en gris.
export function FlowSteps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label="Étapes">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              'flex size-6 items-center justify-center rounded-full text-xs font-semibold',
              i < current && 'bg-neutral-900 text-white',
              i === current && 'border-2 border-neutral-900 text-neutral-900',
              i > current && 'border border-neutral-300 text-neutral-400',
            )}
            aria-current={i === current ? 'step' : undefined}
          >
            {i + 1}
          </span>
          <span className={cn(i === current ? 'font-semibold text-neutral-950' : i < current ? 'text-neutral-700' : 'text-neutral-400')}>{label}</span>
          {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-neutral-300" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
