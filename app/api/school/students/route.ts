import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ensureUserSchool, isUserSchoolAdmin, listSchoolStudents } from '@/lib/school';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const isAdmin = await isUserSchoolAdmin(session.user.id);
  if (!isAdmin) return NextResponse.json({ error: "Réservé à l'admin de l'école" }, { status: 403 });

  const school = await ensureUserSchool(session.user.id);
  const students = await listSchoolStudents(school.id);
  return NextResponse.json({ students });
}
