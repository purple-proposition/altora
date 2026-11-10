import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { rateLimit } from '@/lib/rateLimit';
import { getUserProfile, emptyProfile, type UserProfile } from '@/lib/profile';
import { buildCVPdf, buildLetterPdf, measureCvFill, type CVProfile } from '@/lib/pdf';

export const runtime = 'nodejs';

const MAX_TEXT = 4000;
const MAX_LIST = 12;

const str = (v: unknown, max = MAX_TEXT) => (typeof v === 'string' ? v.slice(0, max) : '');
const list = <T>(v: unknown, fn: (x: unknown) => T) => (Array.isArray(v) ? v.slice(0, MAX_LIST).map(fn) : []);

// Export des PDF à partir des données éditées par la personne. Aucun appel au
// modèle ici : seule la mise en page tourne, donc l'export ne coûte aucun token.
// Les champs sont bornés en taille pour que le corps reste raisonnable.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const body = await req.json().catch(() => null) as { kind?: string; cv?: unknown; lettre?: unknown; check?: boolean } | null;
  if (!body) return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });

  // La vérification du remplissage tourne à chaque modification : quota à part.
  const limited = body.check
    ? !rateLimit(`cvcheck:${session.user.id}`, 1200, 60 * 60_000)
    : !rateLimit(`export:${session.user.id}`, 60, 60 * 60_000);
  if (limited) {
    return NextResponse.json({ error: 'Trop de demandes, réessaie plus tard.' }, { status: 429 });
  }

  // Identité et règles de civilité viennent toujours du profil enregistré,
  // jamais du corps de la requête.
  const stored = await getUserProfile(session.user.id);
  const profile: UserProfile = stored ?? emptyProfile(session.user.name ?? '', session.user.email ?? '');

  try {
    if (body.kind === 'cv') {
      const c = (body.cv ?? {}) as Record<string, unknown>;
      const cv: CVProfile = {
        ...profile,
        title: str(c.title, 300),
        profil: str(c.profil),
        competences: str(c.competences, 2000),
        outils: str(c.outils, 2000),
        langues: str(c.langues, 500),
        experiences: list(c.experiences, (e) => {
          const x = (e ?? {}) as Record<string, unknown>;
          return {
            company: str(x.company, 200),
            title: str(x.title, 300),
            dates: str(x.dates, 100),
            bullets: list(x.bullets, (b) => str(b, 400)),
          };
        }),
        formation: list(c.formation, (f) => {
          const x = (f ?? {}) as Record<string, unknown>;
          return {
            school: str(x.school, 200),
            degree: str(x.degree, 300),
            dates: str(x.dates, 100),
            bullets: [],
          };
        }),
      };
      // Mode vérification : renvoie le taux de remplissage de la page A4
      // (1 = page pleine, au-delà le CV déborde), sans produire de fichier.
      if (body.check) return NextResponse.json(await measureCvFill(cv));
      // Pas d'export d'un CV qui déborde : on renvoie le défaut à corriger.
      const { fill } = await measureCvFill(cv);
      if (fill > 1) {
        return NextResponse.json({ error: 'Le CV dépasse une page A4. Raccourcis-le avant de l\'exporter.', fill }, { status: 422 });
      }
      const pdf = await buildCVPdf(cv);
      return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' } });
    }

    if (body.kind === 'lettre') {
      const l = (body.lettre ?? {}) as Record<string, unknown>;
      const pdf = await buildLetterPdf(profile, {
        company: str(l.company, 200),
        poste: str(l.poste, 300),
        paragraphs: list(l.paragraphs, (p) => str(p, 3000)),
      });
      return new NextResponse(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({ error: 'Type inconnu (cv ou lettre)' }, { status: 400 });
  } catch (err) {
    console.error('export failed:', err);
    return NextResponse.json({ error: "L'export a échoué. Réessaie." }, { status: 500 });
  }
}
