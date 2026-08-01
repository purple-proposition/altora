import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserProfile, saveUserProfile, emptyProfile, UserProfile } from '@/lib/profile';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const profile = await getUserProfile(session.user.id)
    ?? emptyProfile(session.user.name ?? '', session.user.email ?? '');
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Profil invalide' }, { status: 400 });
  }

  const profile: UserProfile = {
    name: String(body.name ?? '').slice(0, 200),
    email: String(body.email ?? '').slice(0, 200),
    phone: String(body.phone ?? '').slice(0, 50),
    linkedin: String(body.linkedin ?? '').slice(0, 200),
    portfolio: String(body.portfolio ?? '').slice(0, 200),
    city: String(body.city ?? '').slice(0, 100),
    civility: (['M', 'Mme'].includes(body.civility) ? body.civility : '') as '' | 'M' | 'Mme',
    availability: String(body.availability ?? '').slice(0, 200),
    profil: String(body.profil ?? '').slice(0, 1000),
    experiences: Array.isArray(body.experiences) ? body.experiences.slice(0, 20).map((e: Record<string, unknown>) => ({
      company: String(e?.company ?? '').slice(0, 200),
      title: String(e?.title ?? '').slice(0, 200),
      dates: String(e?.dates ?? '').slice(0, 100),
      bullets: Array.isArray(e?.bullets) ? e.bullets.slice(0, 20).map((b: unknown) => String(b).slice(0, 500)) : [],
    })) : [],
    formation: Array.isArray(body.formation) ? body.formation.slice(0, 20).map((f: Record<string, unknown>) => ({
      school: String(f?.school ?? '').slice(0, 200),
      degree: String(f?.degree ?? '').slice(0, 200),
      dates: String(f?.dates ?? '').slice(0, 100),
      bullets: Array.isArray(f?.bullets) ? f.bullets.slice(0, 20).map((b: unknown) => String(b).slice(0, 500)) : [],
    })) : [],
    competences: String(body.competences ?? '').slice(0, 2000),
    outils: String(body.outils ?? '').slice(0, 2000),
    langues: String(body.langues ?? '').slice(0, 500),
    customInstructions: String(body.customInstructions ?? '').slice(0, 8000),
  };

  await saveUserProfile(session.user.id, profile);
  return NextResponse.json({ profile });
}
