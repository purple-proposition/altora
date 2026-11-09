// Account creation without e-mail: a password plus a one-time recovery code
// shown once at sign-up. Only a hash of the recovery code is stored.
import bcrypt from 'bcryptjs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

export const MIN_PASSWORD_LENGTH = 12;

export function newRecoveryCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const chars = Array.from(bytes, b => ALPHABET[b % ALPHABET.length]).join('');
  return chars.match(/.{4}/g)!.join('-');
}

async function digest(code: string): Promise<string> {
  const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const data = new TextEncoder().encode(`${process.env.AUTH_SECRET || ''}:${normalized}`);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

export function hashRecoveryCode(code: string) {
  return digest(code);
}

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}
