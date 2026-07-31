import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { assertSafeUrl } from '@/lib/ssrfGuard';
import { readCapped } from '@/lib/cappedFetch';
import { rateLimit } from '@/lib/rateLimit';
import { cleanJobPostingHtml } from '@/lib/jobPosting';

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2MB — plenty for an HTML job posting page

// A blocked/challenge page (Cloudflare, bot-check…) is always short — a real
// job posting's cleaned text runs into the thousands of characters.
const MIN_TEXT_LENGTH_FOR_REAL_CONTENT = 200;

// Keeps the Haiku call cheap: the core job details (title, company, location,
// salary, contract) are almost always in the opening portion of the page —
// paying to send the footer/sidebar boilerplate too wouldn't improve accuracy.
const MAX_CHARS_SENT_TO_MODEL = 6000;

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
};

type ExtractedOffer = {
  title: string | null;
  company: string | null;
  location: string | null;
  salary: string | null;
  contractType: string | null;
};

const EMPTY_OFFER: ExtractedOffer = { title: null, company: null, location: null, salary: null, contractType: null };

async function extractWithAI(text: string): Promise<ExtractedOffer | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: 'Tu extrais des informations structurées depuis le texte brut d\'une offre d\'emploi. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, sans markdown. Si une information est absente, mets null. Le contractType doit être l\'une de ces valeurs exactes si applicable : "CDI", "CDD", "Alternance", "Stage", "Freelance" — sinon null.',
      messages: [{
        role: 'user',
        content: `Extrait le titre du poste, l'entreprise, le lieu, la rémunération et le type de contrat de cette offre :\n\n${text.slice(0, MAX_CHARS_SENT_TO_MODEL)}\n\nRéponds avec exactement ce format : {"title": "...", "company": "...", "location": "...", "salary": "...", "contractType": "..."}`,
      }],
    });

    const block = message.content[0];
    if (block?.type !== 'text') return null;
    const jsonMatch = block.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      title: typeof parsed.title === 'string' ? parsed.title : null,
      company: typeof parsed.company === 'string' ? parsed.company : null,
      location: typeof parsed.location === 'string' ? parsed.location : null,
      salary: typeof parsed.salary === 'string' ? parsed.salary : null,
      contractType: typeof parsed.contractType === 'string' ? parsed.contractType : null,
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  // Stricter than a pure heuristic lookup would need — each successful parse
  // now also costs one small Haiku call.
  if (!rateLimit(`parse-offer:${session.user.id}`, 15, 60 * 60_000)) {
    return NextResponse.json({ error: 'Trop de requêtes, réessaie plus tard.' }, { status: 429 });
  }

  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url query param' }, { status: 400 });
  }

  let safeUrl: URL;
  try {
    safeUrl = await assertSafeUrl(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(safeUrl, { headers: BROWSER_HEADERS, signal: controller.signal, redirect: 'manual' });
    clearTimeout(timeout);

    if (!response.ok || (response.status >= 300 && response.status < 400)) {
      // redirect: 'manual' surfaces 3xx as opaqueredirect/normal responses without
      // following them — a redirect to an internal URL is never auto-followed here.
      return NextResponse.json({ blocked: true, ...EMPTY_OFFER, description: null });
    }

    const html = await readCapped(response, MAX_RESPONSE_BYTES);
    const text = cleanJobPostingHtml(html);

    if (text.length < MIN_TEXT_LENGTH_FOR_REAL_CONTENT) {
      // A bot-challenge/consent page, not the real posting — e.g. Indeed's
      // Cloudflare check. No point paying for a Haiku call on noise.
      return NextResponse.json({ blocked: true, ...EMPTY_OFFER, description: null });
    }

    const extracted = await extractWithAI(text);
    return NextResponse.json({
      blocked: false,
      ...(extracted || EMPTY_OFFER),
      description: text,
    });
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ blocked: true, ...EMPTY_OFFER, description: null });
  }
}
