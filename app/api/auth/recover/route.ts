import { ensureSchema, sql } from '@/lib/db';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { newRecoveryCode, hashRecoveryCode, hashPassword, MIN_PASSWORD_LENGTH } from '@/lib/recovery';

export const runtime = 'nodejs';

// Resets the password with the one-time recovery code, then rotates the code
// so the old one can't be reused. Returns the new recovery code once.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { email?: string; code?: string; password?: string } | null;
  const email = (body?.email || '').trim().toLowerCase();
  const code = body?.code || '';
  const password = body?.password || '';
  if (!rateLimit(`recover-ip:${clientIp(req)}`, 20, 15 * 60_000) || !rateLimit(`recover-email:${email}`, 5, 15 * 60_000)) {
    return Response.json({ error: 'Trop de tentatives. Réessaie dans quelques minutes.' }, { status: 429 });
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return Response.json({ error: `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.` }, { status: 400 });
  }
  await ensureSchema();
  const rows = await sql`SELECT id, recovery_hash FROM users WHERE email = ${email}`;
  const user = rows[0];
  if (!user?.recovery_hash || (await hashRecoveryCode(code)) !== user.recovery_hash) {
    return Response.json({ error: 'Code de secours incorrect.' }, { status: 400 });
  }
  const recoveryCode = newRecoveryCode();
  await sql`
    UPDATE users SET password_hash = ${await hashPassword(password)}, recovery_hash = ${await hashRecoveryCode(recoveryCode)}
    WHERE id = ${user.id}
  `;
  return Response.json({ ok: true, recoveryCode });
}
