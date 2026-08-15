import { auth } from '@/auth';
import { getUserCv } from '@/lib/db';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const session = await auth();
  let cvFilename = '';

  if (session?.user?.id) {
    const cv = await getUserCv(session.user.id);
    cvFilename = cv.cvUrl ? cv.cvFilename : '';
  }

  return <GenerateForm hasCv={Boolean(cvFilename)} cvFilename={cvFilename} />;
}
