import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, ensureSchema } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { getInvite } from '@/lib/invites';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function capString(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`signup:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Trop de tentatives, réessaie dans quelques minutes.' }, { status: 429 });
  }

  let body: { email?: unknown; password?: unknown; name?: unknown; school?: unknown; promotion?: unknown; invite?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }
  const { password } = body;

  // Closed beta: the client-side page only ever shows the form once it
  // already recognizes the invite (see app/signup/page.tsx), but that's
  // just UI — someone could still POST here directly, so the actual gate
  // has to live here too, not just in what's displayed.
  if (typeof body.invite !== 'string' || !getInvite(body.invite)) {
    return NextResponse.json({ error: "Cette invitation n'est pas valide." }, { status: 403 });
  }

  const cleanEmail = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase().slice(0, 255);
  const name = capString(body.name, 200);
  const school = capString(body.school, 200);
  const promotion = capString(body.promotion, 100);

  if (!cleanEmail || !EMAIL_RE.test(cleanEmail) || typeof password !== 'string' || password.length < 8 || password.length > 200) {
    return NextResponse.json(
      { error: 'Email invalide ou mot de passe trop court (8 caractères minimum).' },
      { status: 400 }
    );
  }

  await ensureSchema();

  const existing = await sql`SELECT id FROM users WHERE email = ${cleanEmail}`;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Un compte existe déjà avec cet email.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await sql`
    INSERT INTO users (email, password_hash, name, school, promotion)
    VALUES (${cleanEmail}, ${passwordHash}, ${name || null}, ${school || null}, ${promotion || null})
  `;

  return NextResponse.json({ ok: true });
}
