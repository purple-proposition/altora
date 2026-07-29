const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ' };

function decodeEntities(str) {
  return str.replace(/&(#39|amp|lt|gt|quot|apos|nbsp);/g, (m, e) => ENTITIES[e] ?? m)
            .replace(/&#(\d+);/g, (m, code) => String.fromCharCode(Number(code)));
}

function clean(str) {
  return str ? decodeEntities(str).replace(/\s+/g, ' ').trim() : '';
}

function fromJsonLd(html) {
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

function metaContent(html, property) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*)["']`, 'i');
  const match = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${property}["']`, 'i'));
  return match ? clean(match[1]) : null;
}

function fromOpenGraph(html) {
  const title = metaContent(html, 'og:title');
  const siteName = metaContent(html, 'og:site_name');
  if (!title) return null;
  return { title, company: siteName && !/indeed|linkedin|glassdoor|welcometothejungle/i.test(siteName) ? siteName : null };
}

function fromTitleTag(html) {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!match) return null;
  const raw = clean(match[1]);
  const parts = raw.split(/\s+[-|–]\s+/).filter(Boolean);
  return { title: parts[0] || raw, company: parts.length > 1 ? parts[1] : null };
}

module.exports = async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing url query param' });
    return;
  }

  try {
    new URL(url);
  } catch {
    res.status(400).json({ error: 'Invalid url' });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, { headers: BROWSER_HEADERS, signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      res.status(200).json({ title: null, company: null });
      return;
    }

    const html = await response.text();
    const result = fromJsonLd(html) || fromOpenGraph(html) || fromTitleTag(html) || { title: null, company: null };
    res.status(200).json(result);
  } catch {
    clearTimeout(timeout);
    res.status(200).json({ title: null, company: null });
  }
};
