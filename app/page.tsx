import { redirect } from 'next/navigation';
import { auth } from '@/auth';

// Pas de landing : on envoie directement vers la connexion ou l'espace.
export default async function Home() {
  const session = await auth();
  redirect(session ? '/generate' : '/login');
}
