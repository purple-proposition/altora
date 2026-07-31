import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const SIGNATURES: { ext: string; contentType: string; magic: number[] }[] = [
  { ext: '.pdf', contentType: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { ext: '.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', magic: [0x50, 0x4b, 0x03, 0x04] }, // PK..
  { ext: '.doc', contentType: 'application/msword', magic: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE compound file
];

function detectFileType(bytes: Uint8Array) {
  return SIGNATURES.find(sig => sig.magic.every((byte, i) => bytes[i] === byte)) || null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Fichier trop volumineux (10 Mo max).' }, { status: 400 });
  }

  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const detected = detectFileType(header);
  if (!detected) {
    return NextResponse.json({ error: 'Format non supporté (PDF, DOC, DOCX uniquement).' }, { status: 400 });
  }

  // A .docx is also a valid zip; disambiguate the shared PK.. signature from
  // the filename extension, since we already know the container format.
  const claimedExt = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  const ext = detected.ext === '.docx' && claimedExt === '.doc' ? '.doc' : detected.ext;

  const safeName = (file.name || 'cv').replace(/[<>&"'\x00-\x1f]/g, '_').slice(0, 150);

  const blob = await put(`cv/${session.user.id}-${Date.now()}${ext}`, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: detected.contentType,
  });

  await ensureSchema();
  await sql`UPDATE users SET cv_url = ${blob.url}, cv_filename = ${safeName} WHERE id = ${session.user.id}`;

  return NextResponse.json({ url: blob.url, filename: safeName });
}
