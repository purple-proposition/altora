import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';
import GenerateForm from '@/components/GenerateForm';

export default async function GeneratePage() {
  const session = await auth();
  let hasCv = false;

  if (session?.user?.id) {
    await ensureSchema();
    const rows = await sql`SELECT cv_url FROM users WHERE id = ${session.user.id}`;
    hasCv = Boolean(rows[0]?.cv_url);
  }

  return <GenerateForm hasCv={hasCv} />;
}
