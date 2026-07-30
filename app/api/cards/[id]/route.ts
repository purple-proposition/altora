import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  const rows = await sql`SELECT id, data FROM cards WHERE id = ${id} AND user_id = ${session.user.id}`;
  if (!rows[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ ...(rows[0].data as object), id: rows[0].id });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const patch = await req.json();
  const { id: _drop, ...patchData } = patch;

  await ensureSchema();
  const existing = await sql`SELECT data FROM cards WHERE id = ${id} AND user_id = ${session.user.id}`;
  if (!existing[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const merged = { ...(existing[0].data as object), ...patchData };
  await sql`
    UPDATE cards SET data = ${JSON.stringify(merged)}::jsonb, updated_at = now()
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  await sql`DELETE FROM cards WHERE id = ${id} AND user_id = ${session.user.id}`;
  return NextResponse.json({ ok: true });
}
