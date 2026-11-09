import * as React from 'react';
import { cn } from '@/lib/cn';
import { Label } from '@/components/ui/label';

// Groupe label + contrôle + aide/erreur, empilés verticalement.
export function Field({ id, label, hint, error, className, children, labelExtra }: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
  labelExtra?: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {labelExtra}
      </div>
      {children}
      {hint && <p className="text-sm text-neutral-500">{hint}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
