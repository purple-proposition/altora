import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ['/login', '/signup', '/robots.txt'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/api/auth');

  if (!req.auth && !isPublic) {
    const loginUrl = new URL('/login', req.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (req.auth && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', req.nextUrl.origin));
  }
});

export const config = {
  // Exclude every static file under /public (previously only avatar.jpg and
  // tracker.js were listed by name — lucide.js and the school logo were
  // still paying the JWT-decode cost of auth() on every request).
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:ico|jpg|jpeg|png|svg|js|css|map|json)$).*)'],
};
