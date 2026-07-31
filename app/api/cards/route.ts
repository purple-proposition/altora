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

const MAX_CARD_JSON_LENGTH = 50_000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  let card: { id?: unknown; [key: string]: unknown };
  try {
    card = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }
  if (typeof card?.id !== 'string' || !card.id.trim()) {
    return NextResponse.json({ error: 'id manquant' }, { status: 400 });
  }

  const { id, ...data } = card;
  const json = JSON.stringify(data);
  if (json.length > MAX_CARD_JSON_LENGTH) {
    return NextResponse.json({ error: 'Données trop volumineuses' }, { status: 400 });
  }

  await ensureSchema();
  try {
    await sql`
      INSERT INTO cards (id, user_id, data)
      VALUES (${id}, ${session.user.id}, ${json}::jsonb)
    `;
  } catch {
    return NextResponse.json({ error: 'Une candidature avec cet identifiant existe déjà' }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
