import * as React from 'react';
import { cn } from '@/lib/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-neutral-300 bg-neutral-50 px-4 text-base text-neutral-900',
        'placeholder:text-neutral-400 outline-none transition-colors',
        'focus-visible:border-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-200',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
