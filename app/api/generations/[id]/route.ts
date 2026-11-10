import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  const rows = await sql`
    SELECT id, card_id, company, poste, contract_type, job_description, cv_url, lettre_url, analysis, email, cv_data, lettre_data, created_at
    FROM generations
    WHERE id = ${id} AND user_id = ${session.user.id}
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const row = rows[0];
  return NextResponse.json({
    id: row.id,
    cardId: row.card_id,
    company: row.company,
    poste: row.poste,
    contractType: row.contract_type,
    jobDescription: row.job_description,
    cvUrl: row.cv_url,
    lettreUrl: row.lettre_url,
    analysis: row.analysis,
    email: row.email,
    cvData: row.cv_data,
    lettreData: row.lettre_data,
    createdAt: row.created_at,
  });
}

// Enregistre les modifications faites dans l'éditeur (CV et lettre), pour
// qu'un rechargement de page les retrouve. Aucun appel au modèle.
const MAX_BODY_CHARS = 200_000;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) return NextResponse.json({ error: 'Trop volumineux' }, { status: 413 });
  let body: { cvData?: unknown; lettreData?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }
  const isObject = (v: unknown) => typeof v === 'object' && v !== null && !Array.isArray(v);
  if (!isObject(body.cvData) && !isObject(body.lettreData)) {
    return NextResponse.json({ error: 'Rien à enregistrer' }, { status: 400 });
  }

  const { id } = await params;
  await ensureSchema();
  const rows = await sql`
    UPDATE generations
    SET cv_data = COALESCE(${isObject(body.cvData) ? JSON.stringify(body.cvData) : null}::jsonb, cv_data),
        lettre_data = COALESCE(${isObject(body.lettreData) ? JSON.stringify(body.lettreData) : null}::jsonb, lettre_data)
    WHERE id = ${id} AND user_id = ${session.user.id}
    RETURNING id
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
