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
  // Type de contrat visé. Pilote la vérification faite sur l'offre avant
  // génération : une offre en CDI n'est écartée que si la personne cherche
  // une alternance ou un stage.
  soughtContract: '' | 'alternance' | 'stage' | 'cdi';
  school: string; // école ou organisme de formation actuel
  availability: string; // début souhaité, ex: "à partir d'octobre 2026", "immédiate"
  rhythm: string; // rythme de l'alternance, ex: "4j entreprise / 1j école"
  profil: string;
  experiences: Experience[];
  formation: Formation[];
  competences: string; // items séparés par " · "
  outils: string; // items séparés par " · "
  langues: string;
  interests: string; // centres d'intérêt, items séparés par " · "
  // Règles/consignes propres à cet utilisateur (style, interdits, structure...),
  // injectées telles quelles dans le prompt de génération en plus des règles
  // ATS/rédaction standard — c'est ici que vont les "immuables" personnels.
  customInstructions: string;
};

export function emptyProfile(name = '', email = ''): UserProfile {
  return {
    name, email, phone: '', linkedin: '', portfolio: '', city: '',
    civility: '', soughtContract: '', school: '', availability: '', rhythm: '', profil: '',
    experiences: [], formation: [],
    competences: '', outils: '', langues: '', interests: '',
    customInstructions: '',
  };
}

export function isProfileComplete(p: UserProfile | null): p is UserProfile {
  return !!p && !!p.name && p.experiences.length > 0;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  await ensureSchema();
  const rows = await sql`SELECT profile FROM users WHERE id = ${userId}`;
  const stored = rows[0]?.profile as Partial<UserProfile> | null;
  if (!stored) return null;

  // Older/partial profile rows (saved before a field existed, or missing
  // nested keys) must never reach the client as-is: ProfileForm calls
  // .map()/.join() straight on experiences/formation/bullets, and a
  // missing array there throws a client-side exception instead of
  // rendering the form. Merge onto full defaults so every field is
  // always at least its empty value.
  return {
    ...emptyProfile(),
    ...stored,
    experiences: (stored.experiences ?? []).map(e => ({
      company: e?.company ?? '',
      title: e?.title ?? '',
      dates: e?.dates ?? '',
      bullets: e?.bullets ?? [],
    })),
    formation: (stored.formation ?? []).map(f => ({
      school: f?.school ?? '',
      degree: f?.degree ?? '',
      dates: f?.dates ?? '',
      bullets: f?.bullets ?? [],
    })),
  };
}

export async function saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
  await ensureSchema();
  await sql`UPDATE users SET profile = ${JSON.stringify(profile)}::jsonb WHERE id = ${userId}`;
}
