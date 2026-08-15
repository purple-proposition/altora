import { auth } from '@/auth';
import { getUserCv } from '@/lib/db';
import { getUserProfile, emptyProfile, isProfileComplete } from '@/lib/profile';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const session = await auth();
  const fullName = session?.user?.name ?? '';
  const firstName = fullName.split(' ')[0] || '';

  let cvFilename = '';
  let profile = emptyProfile(fullName, session?.user?.email ?? '');
  let profileReady = false;

  if (session?.user?.id) {
    const [cv, stored] = await Promise.all([
      getUserCv(session.user.id),
      getUserProfile(session.user.id),
    ]);
    cvFilename = cv.cvUrl ? cv.cvFilename : '';
    if (stored) profile = stored;
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
    />
  );
}
