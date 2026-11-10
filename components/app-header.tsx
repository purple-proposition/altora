'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { LogOut, UserRound } from 'lucide-react';

// En-tête de l'espace connecté : nom de l'app, accès au profil, déconnexion.
export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-neutral-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
        <Link href="/generate" className="text-base font-bold tracking-tight text-neutral-950">Altora</Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/generate?step=profil"
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <UserRound size={16} />Mon profil
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
          >
            <LogOut size={16} />Se déconnecter
          </button>
        </nav>
      </div>
    </header>
  );
}
