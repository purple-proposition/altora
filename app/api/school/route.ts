import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ensureUserSchool, isUserSchoolAdmin, updateSchool } from '@/lib/school';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const [school, isAdmin] = await Promise.all([
    ensureUserSchool(session.user.id),
    isUserSchoolAdmin(session.user.id),
  ]);
  return NextResponse.json({ school, isAdmin });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const isAdmin = await isUserSchoolAdmin(session.user.id);
  if (!isAdmin) return NextResponse.json({ error: "Réservé à l'admin de l'école" }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });

  const school = await ensureUserSchool(session.user.id);
  const updated = await updateSchool(school.id, {
    name: String(body.name ?? school.name).slice(0, 200),
    rhythm: String(body.rhythm ?? '').slice(0, 100),
    availability: String(body.availability ?? '').slice(0, 200),
  });
  return NextResponse.json({ school: updated });
}
