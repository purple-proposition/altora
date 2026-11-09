import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Fusionne des classes conditionnelles en gérant les conflits (clsx + tailwind-merge).
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
