import { auth } from '@/auth';
import { getUserCv } from '@/lib/db';
import { getUserProfile } from '@/lib/profile';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const session = await auth();
  let cvFilename = '';
  let civility: '' | 'M' | 'Mme' = '';

  if (session?.user?.id) {
    const [cv, profile] = await Promise.all([
      getUserCv(session.user.id),
      getUserProfile(session.user.id),
    ]);
    cvFilename = cv.cvUrl ? cv.cvFilename : '';
    civility = profile?.civility ?? '';
  }

  return <GenerateForm hasCv={Boolean(cvFilename)} cvFilename={cvFilename} civility={civility} />;
}
