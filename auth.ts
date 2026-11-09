import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql, ensureSchema } from './lib/db';
import { rateLimit } from './lib/rateLimit';
import { getInvite } from './lib/invites';
import authConfig from './auth.config';

// A bcrypt hash of a random, unguessable value — used to pay the same
// hashing cost on the "no such user" path as on the "wrong password" path,
// so response timing can't be used to enumerate registered emails.
const DUMMY_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8i9AtRJ8p4hKQEqZgUAKtpN5j2z6dK';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string || '').trim().toLowerCase();
        const password = credentials?.password as string || '';
        if (!email || !password) return null;

        // Throttle per email so credential-stuffing against one account can't
        // run unbounded (indistinguishable from a wrong password to the caller).
        if (!rateLimit(`login:${email}`, 10, 15 * 60_000)) return null;

        await ensureSchema();
        const rows = await sql`SELECT id, email, password_hash, name, school, promotion FROM users WHERE email = ${email}`;
        const user = rows[0];

        const valid = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
        if (!user || !valid) return null;

        return { id: String(user.id), email: user.email, name: user.name, school: user.school, promotion: user.promotion };
      },
    }),
    // Closed beta: no signup form, no password — a valid per-person token
    // (see lib/invites.ts) is the only credential. The account is
    // provisioned the first time its token is used, and reused after that.
    Credentials({
      id: 'invite',
      name: 'invite',
      credentials: { token: { label: 'Token', type: 'text' } },
      async authorize(credentials) {
        const token = (credentials?.token as string || '').trim();
        const invite = getInvite(token);
        if (!invite) return null;

        // Same purpose as the login throttle above: a bare token is a
        // single short string, worth rate-limiting per-token so it can't
        // be brute-forced any faster than a password could be.
        if (!rateLimit(`invite:${token}`, 10, 15 * 60_000)) return null;

        await ensureSchema();
        const rows = await sql`SELECT id, email, name, school, promotion FROM users WHERE email = ${invite.email}`;
        let user = rows[0];

        if (!user) {
          const inserted = await sql`
            INSERT INTO users (email, password_hash, name)
            VALUES (${invite.email}, ${DUMMY_HASH}, ${invite.name})
            RETURNING id, email, name, school, promotion
          `;
          user = inserted[0];
        }

        return { id: String(user.id), email: user.email, name: user.name, school: user.school, promotion: user.promotion };
      },
    }),
  ],
});
