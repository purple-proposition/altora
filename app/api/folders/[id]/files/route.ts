import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/auth';
import { sql, ensureSchema } from '@/lib/db';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_REQUEST = 10;

const SIGNATURES: { ext: string; contentType: string; magic: number[] }[] = [
  { ext: '.pdf', contentType: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  { ext: '.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', magic: [0x50, 0x4b, 0x03, 0x04] }, // PK..
  { ext: '.doc', contentType: 'application/msword', magic: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }, // OLE compound file
];

function detectFileType(bytes: Uint8Array) {
  return SIGNATURES.find(sig => sig.magic.every((byte, i) => bytes[i] === byte)) || null;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await params;
  const folderId = Number(id);
  if (!Number.isInteger(folderId)) return NextResponse.json({ error: 'Dossier invalide' }, { status: 400 });

  await ensureSchema();
  const folderRows = await sql`SELECT id FROM folders WHERE id = ${folderId} AND user_id = ${session.user.id}`;
  if (!folderRows[0]) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });
  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json({ error: `${MAX_FILES_PER_REQUEST} fichiers maximum à la fois.` }, { status: 400 });
  }

  const saved: { url: string; filename: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: `"${file.name}" dépasse 10 Mo.` }, { status: 400 });
    }
    const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const detected = detectFileType(header);
    if (!detected) {
      return NextResponse.json({ error: `"${file.name}" : format non supporté (PDF, DOC, DOCX uniquement).` }, { status: 400 });
    }
    const claimedExt = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    const ext = detected.ext === '.docx' && claimedExt === '.doc' ? '.doc' : detected.ext;
    const safeName = (file.name || 'document').replace(/[<>&"'\x00-\x1f]/g, '_').slice(0, 150);

    const fileId = crypto.randomUUID();
    const blob = await put(`folder-files/${session.user.id}-${folderId}-${fileId}${ext}`, file, {
      access: 'public',
      addRandomSuffix: false,
      contentType: detected.contentType,
    });

    await sql`
      INSERT INTO folder_files (id, folder_id, user_id, url, filename)
      VALUES (${fileId}, ${folderId}, ${session.user.id}, ${blob.url}, ${safeName})
    `;
    saved.push({ url: blob.url, filename: safeName });
  }

  return NextResponse.json({ files: saved });
}
