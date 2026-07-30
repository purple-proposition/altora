import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sql, ensureSchema } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { email, password, name, school, promotion } = await req.json();

  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password || password.length < 8) {
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
