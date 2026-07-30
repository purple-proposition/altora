import type { NextAuthConfig } from 'next-auth';

// Edge-compatible config (no bcrypt/DB access) — used by middleware for
// session verification only. The Credentials provider itself lives in
// auth.ts, which runs in the Node runtime (API routes, server components).
export default {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as { school?: string | null; promotion?: string | null };
        token.school = u.school ?? null;
        token.promotion = u.promotion ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const u = session.user as { school?: string | null; promotion?: string | null };
        u.school = token.school as string | null;
        u.promotion = token.promotion as string | null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
