import { sql, ensureSchema } from './db';

export type Experience = { company: string; title: string; dates: string; bullets: string[] };
export type Formation = { school: string; degree: string; dates: string; bullets: string[] };

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  portfolio: string;
  city: string;
  civility: '' | 'M' | 'Mme'; // accord masculin/féminin des intitulés de poste et de la lettre
  availability: string; // ex: "à partir d'octobre 2026", "immédiate"
  profil: string;
  experiences: Experience[];
  formation: Formation[];
  competences: string; // items séparés par " · "
  outils: string; // items séparés par " · "
  langues: string;
  // Règles/consignes propres à cet utilisateur (style, interdits, structure...),
  // injectées telles quelles dans le prompt de génération en plus des règles
  // ATS/rédaction standard — c'est ici que vont les "immuables" personnels.
  customInstructions: string;
};

export function emptyProfile(name = '', email = ''): UserProfile {
  return {
    name, email, phone: '', linkedin: '', portfolio: '', city: '',
    civility: '', availability: '', profil: '',
    experiences: [], formation: [],
    competences: '', outils: '', langues: '',
    customInstructions: '',
  };
}

export function isProfileComplete(p: UserProfile | null): p is UserProfile {
  return !!p && !!p.name && p.experiences.length > 0;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  await ensureSchema();
  const rows = await sql`SELECT profile FROM users WHERE id = ${userId}`;
  return (rows[0]?.profile as UserProfile | null) ?? null;
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  await ensureSchema();
  await sql`UPDATE users SET profile = ${JSON.stringify(profile)}::jsonb WHERE id = ${userId}`;
}
