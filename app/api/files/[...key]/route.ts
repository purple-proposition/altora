import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { storeGet, ownsKey } from '@/lib/storage';

export const runtime = 'nodejs';

// Sert un fichier privé à son propriétaire uniquement.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const key = (await params).key.join('/');
  if (!ownsKey(session.user.id, key)) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  const object = await storeGet(key);
  if (!object) return NextResponse.json({ error: 'Introuvable' }, { status: 404 });

  return new NextResponse(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Content-Length': String(object.size),
      'Cache-Control': 'private, max-age=300',
    },
  });
}
