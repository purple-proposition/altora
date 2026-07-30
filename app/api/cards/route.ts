import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await ensureSchema();
  const rows = await sql`SELECT id, data FROM cards WHERE user_id = ${session.user.id} ORDER BY created_at ASC`;
  const cards = rows.map(r => ({ ...(r.data as object), id: r.id }));
  return NextResponse.json({ cards });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const card = await req.json();
  if (!card?.id) return NextResponse.json({ error: 'id manquant' }, { status: 400 });

  await ensureSchema();
  const { id, ...data } = card;
  await sql`
    INSERT INTO cards (id, user_id, data)
    VALUES (${id}, ${session.user.id}, ${JSON.stringify(data)}::jsonb)
  `;
  return NextResponse.json({ ok: true });
}
