import { NextRequest, NextResponse } from 'next/server';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
};

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

function decodeEntities(str: string) {
  return str.replace(/&(#39|amp|lt|gt|quot|apos|nbsp);/g, (m, e) => ENTITIES[e] ?? m)
            .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(Number(code)));
}

function clean(str?: string | null) {
  return str ? decodeEntities(str).replace(/\s+/g, ' ').trim() : '';
}

type ParsedOffer = { title: string | null; company: string | null };

function fromJsonLd(html: string): ParsedOffer | null {
  const blocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, raw] of blocks) {
    let data;
    try {
      data = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    const candidates = Array.isArray(data) ? data : (Array.isArray(data['@graph']) ? data['@graph'] : [data]);
    for (const node of candidates) {
      if (!node || node['@type'] !== 'JobPosting') continue;
      const title = clean(node.title);
      const company = clean(node.hiringOrganization?.name);
      if (title || company) return { title: title || null, company: company || null };
    }
  }
  return null;
}

function metaContent(html: string, property: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i');
  const match = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
  return match ? clean(match[1]) : null;
}

function fromOpenGraph(html: string): ParsedOffer | null {
  const title = metaContent(html, 'og:title');
  const siteName = metaContent(html, 'og:site_name');
  if (!title) return null;
  return { title, company: siteName && !/indeed|linkedin|glassdoor|welcometothejungle/i.test(siteName) ? siteName : null };
}

function fromTitleTag(html: string): ParsedOffer | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match) return null;
  const raw = clean(match[1]);
  const parts = raw.split(/\s+[-|–]\s+/).filter(Boolean);
  return { title: parts[0] || raw, company: parts.length > 1 ? parts[1] : null };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url query param' }, { status: 400 });
  }

  try {
    new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { headers: BROWSER_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json({ title: null, company: null });
    }

    const html = await response.text();
    const result = fromJsonLd(html) || fromOpenGraph(html) || fromTitleTag(html) || { title: null, company: null };
    return NextResponse.json(result);
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ title: null, company: null });
  }
}
