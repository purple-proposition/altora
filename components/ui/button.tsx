import * as React from 'react';
import { cn } from '@/lib/cn';

// Bouton de base, palette neutral. Variantes : primary (noir plein) et
// outline (bordure fine), tailles default et sm.
export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm';
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-neutral-400',
        size === 'default' ? 'h-11 px-4 text-base' : 'h-9 px-3 text-sm',
        variant === 'default' && 'bg-neutral-950 text-white hover:bg-neutral-800',
        variant === 'outline' && 'border border-neutral-300 bg-neutral-50 text-neutral-900 hover:bg-neutral-100',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
