import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

// Only what the sidebar submenu needs to render a folder list.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await ensureSchema();
  const rows = await sql`
    SELECT id, name FROM folders WHERE user_id = ${session.user.id} ORDER BY name ASC
  `;
  return NextResponse.json({ folders: rows.map(r => ({ id: r.id, name: r.name })) });
}
