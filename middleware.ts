import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import authConfig from '@/auth.config';

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ['/login', '/signup', '/pricing', '/robots.txt'];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  // "/" is the one exception: signed out, it's the public marketing landing
  // page (see app/(tracker)/page.tsx and layout.tsx, both branch on session);
  // signed in, it's the dashboard, same as always. Every other route still
  // requires a session.
  const isPublic = pathname === '/' || PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/api/auth');

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
  // still paying the JWT-decode cost of auth() on every request). Font
  // extensions were missing entirely: signed-out visitors got Gloock-
  // Regular.ttf silently redirected to /login instead of served, so the
  // browser fell back to Georgia at whatever weight each element asked
  // for — Georgia has a real bold, Gloock only ships Regular, hence the
  // headings and the logo looking like two unrelated typefaces.
  matcher: ['/((?!_next/static|_next/image|.*\\.(?:ico|jpg|jpeg|png|svg|js|css|map|json|ttf|otf|woff|woff2)$).*)'],
};
