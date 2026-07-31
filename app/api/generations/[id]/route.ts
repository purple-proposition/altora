import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  await ensureSchema();
  const rows = await sql`
    SELECT id, card_id, company, poste, contract_type, job_description, cv_url, lettre_url, analysis, email, created_at
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
    createdAt: row.created_at,
  });
}
