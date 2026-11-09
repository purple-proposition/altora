// Email one-time codes for sign-up / sign-in. Only a salted hash of the code
// is stored, so a database leak can't be turned into working codes.
import { sql } from './db';

const CODE_TTL_MS = 10 * 60_000;
const MAX_ATTEMPTS = 5;

async function hashCode(email: string, code: string): Promise<string> {
  const secret = process.env.AUTH_SECRET || '';
  const data = new TextEncoder().encode(`${secret}:${email}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

// Cryptographically random 6-digit code.
function randomCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, '0');
}

// Creates a fresh code for the email, replacing any previous one.
export async function createEmailCode(email: string): Promise<string> {
  const code = randomCode();
  const hash = await hashCode(email, code);
  const expiresAt = new Date(Date.now() + CODE_TTL_MS).toISOString();
  await sql`
    INSERT INTO email_codes (email, code_hash, attempts, expires_at)
    VALUES (${email}, ${hash}, 0, ${expiresAt})
    ON CONFLICT (email) DO UPDATE
      SET code_hash = EXCLUDED.code_hash, attempts = 0, expires_at = EXCLUDED.expires_at
  `;
  return code;
}

// Returns true once if the code matches and is still valid, then burns it.
export async function consumeEmailCode(email: string, code: string): Promise<boolean> {
  const rows = await sql`SELECT code_hash, attempts, expires_at FROM email_codes WHERE email = ${email}`;
  const row = rows[0];
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) {
    await sql`DELETE FROM email_codes WHERE email = ${email}`;
    return false;
  }
  const ok = (await hashCode(email, code)) === row.code_hash;
  if (!ok) {
    await sql`UPDATE email_codes SET attempts = attempts + 1 WHERE email = ${email}`;
    return false;
  }
  await sql`DELETE FROM email_codes WHERE email = ${email}`;
  return true;
}
