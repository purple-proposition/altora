import { ensureSchema, sql } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { newRecoveryCode, hashRecoveryCode, hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/recovery';

export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Creates an account with a password. No e-mail is sent: the identifier is
// not verified, so the recovery code is the only way back in if the password
// is lost. It is returned exactly once, here.
export async function POST(req: Request) {
  if (!rateLimit(`signup-ip:${clientIp(req)}`, 10, 60 * 60_000)) {
    return Response.json({ error: 'Trop de tentatives. Réessaie plus tard.' }, { status: 429 });
  }
  const body = await req.json().catch(() => null) as { email?: string; password?: string } | null;
  const email = (body?.email || '').trim().toLowerCase();
  const password = body?.password || '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return Response.json({ error: 'Adresse e-mail invalide.' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return Response.json({ error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` }, { status: 400 });
  }
  await ensureSchema();
  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length) {
    return Response.json({ error: 'Un espace existe déjà pour cette adresse. Connecte-toi ou utilise ton code de secours.' }, { status: 409 });
  }
  const recoveryCode = newRecoveryCode();
  await sql`
    INSERT INTO users (email, password_hash, recovery_hash)
    VALUES (${email}, ${await hashPassword(password)}, ${await hashRecoveryCode(recoveryCode)})
  `;
  return Response.json({ ok: true, recoveryCode });
}
