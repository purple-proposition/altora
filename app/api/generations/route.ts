import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';
import { rateLimit } from '@/lib/rateLimit';

// Only what the sidebar history submenu needs to render a label — the full
// analysis/email/PDFs are only fetched when an entry is actually opened.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await ensureSchema();
  const rows = await sql`
    SELECT id, company, poste, created_at
    FROM generations
    WHERE user_id = ${session.user.id}
    ORDER BY created_at DESC
    LIMIT 20
  `;
  return NextResponse.json({
    generations: rows.map(r => ({ id: r.id, company: r.company, poste: r.poste, createdAt: r.created_at })),
  });
}

type GenerationBody = {
  cardId?: string | null;
  company?: string;
  poste?: string;
  contractType?: string;
  jobDescription?: string;
  cv?: string; // base64
  lettre?: string; // base64
  analysis?: unknown;
  email?: unknown;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // A generation is a byproduct of an already-expensive Claude call, not a
  // free action on its own — cap it a bit above /api/generate's own limit
  // rather than duplicating a strict budget here.
  if (!rateLimit(`save-generation:${session.user.id}`, 30, 60 * 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes, réessaie plus tard.' }, { status: 429 });
  }

  let body: GenerationBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }
  if (!body.cv || !body.lettre) {
    return NextResponse.json({ error: 'cv et lettre (base64) requis' }, { status: 400 });
  }

  const id = crypto.randomUUID();
  const [cvBlob, lettreBlob] = await Promise.all([
    put(`generations/${session.user.id}-${id}-cv.pdf`, Buffer.from(body.cv, 'base64'), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/pdf',
    }),
    put(`generations/${session.user.id}-${id}-lettre.pdf`, Buffer.from(body.lettre, 'base64'), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/pdf',
    }),
  ]);

  await ensureSchema();
  await sql`
    INSERT INTO generations (id, user_id, card_id, company, poste, contract_type, job_description, cv_url, lettre_url, analysis, email)
    VALUES (
      ${id}, ${session.user.id}, ${body.cardId || null},
      ${body.company || ''}, ${body.poste || ''}, ${body.contractType || 'alternance'}, ${body.jobDescription || ''},
      ${cvBlob.url}, ${lettreBlob.url},
      ${JSON.stringify(body.analysis || {})}::jsonb, ${body.email ? JSON.stringify(body.email) : null}::jsonb
    )
  `;

  return NextResponse.json({ id });
}
