import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ensureUserSchool, toggleSelfSchoolAdmin } from '@/lib/school';

// Dev/demo shortcut (bound to a keyboard chord client-side) — lets any
// logged-in user flip their own admin flag to preview the admin UI. Not a
// production "grant admin" endpoint: it only ever touches the caller's own row.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await ensureUserSchool(session.user.id);
  const isAdmin = await toggleSelfSchoolAdmin(session.user.id);
  return NextResponse.json({ isAdmin });
}
