import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { sql, ensureSchema } from './lib/db';
import { rateLimit } from './lib/rateLimit';
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
  ],
});
