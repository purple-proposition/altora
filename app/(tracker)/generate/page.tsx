import { auth } from '@/auth';
import { getUserCv } from '@/lib/db';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const session = await auth();
  let hasCv = false;

  if (session?.user?.id) {
    const cv = await getUserCv(session.user.id);
    hasCv = Boolean(cv.cvUrl);
  }

  return <GenerateForm hasCv={hasCv} />;
}
