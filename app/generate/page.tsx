import { auth } from '@/auth';
import { getUserCv, sql, ensureSchema } from '@/lib/db';
import { getUserProfile, emptyProfile, isProfileComplete } from '@/lib/profile';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const session = await auth();
  const fullName = session?.user?.name ?? '';
  const firstName = fullName.split(' ')[0] || '';

  let cvFilename = '';
  let profile = emptyProfile(fullName, session?.user?.email ?? '');
  let profileReady = false;
  // Sert uniquement à savoir si l'écran d'import d'offre doit se présenter
  // comme la première candidature ou comme une de plus.
  let hasGenerations = false;

  if (session?.user?.id) {
    await ensureSchema();
    const [cv, stored, generations] = await Promise.all([
      getUserCv(session.user.id),
      getUserProfile(session.user.id),
      sql`SELECT 1 FROM generations WHERE user_id = ${session.user.id} LIMIT 1`,
    ]);
    cvFilename = cv.cvUrl ? cv.cvFilename : '';
    if (stored) profile = stored;
    hasGenerations = generations.length > 0;
    // Le profil n'est "prêt" que s'il a réellement de quoi générer (un nom et
    // au moins une expérience) : c'est ce qui décide si on ouvre le parcours
    // au tout début ou directement sur l'import d'une offre.
    profileReady = isProfileComplete(stored);
  }

  return (
    <GenerateForm
      firstName={firstName}
      hasCv={Boolean(cvFilename)}
      cvFilename={cvFilename}
      profile={profile}
      profileReady={profileReady}
      hasGenerations={hasGenerations}
    />
  );
}
