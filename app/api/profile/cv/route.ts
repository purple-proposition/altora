import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

  const allowed = ['.pdf', '.doc', '.docx'];
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Format non supporté (PDF, DOC, DOCX uniquement).' }, { status: 400 });
  }

  const blob = await put(`cv/${session.user.id}-${Date.now()}${ext}`, file, {
    access: 'public',
    addRandomSuffix: false,
  });

  await ensureSchema();
  await sql`UPDATE users SET cv_url = ${blob.url}, cv_filename = ${file.name} WHERE id = ${session.user.id}`;

  return NextResponse.json({ url: blob.url, filename: file.name });
}
