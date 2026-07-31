import dns from 'node:dns/promises';
import { isIP } from 'node:net';

// Blocks requests to loopback/private/link-local/metadata addresses so a
// user-supplied URL (job offer link, job posting text fetch) can't be used
// to probe internal services or cloud metadata endpoints from the server.

function ipv4InRange(ip: string, base: string, maskBits: number) {
  const toInt = (s: string) => s.split('.').reduce((acc, part) => (acc << 8) + Number(part), 0) >>> 0;
  const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0;
  return (toInt(ip) & mask) === (toInt(base) & mask);
}

const BLOCKED_V4_RANGES: [string, number][] = [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10], // carrier-grade NAT
  ['127.0.0.0', 8],
  ['169.254.0.0', 16], // link-local, includes 169.254.169.254 cloud metadata
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['224.0.0.0', 4], // multicast
];

function isBlockedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    return BLOCKED_V4_RANGES.some(([base, bits]) => ipv4InRange(ip, base, bits));
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true; // fe80::/10
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // fc00::/7
    if (lower.startsWith('::ffff:')) return isBlockedIp(lower.slice(7)); // IPv4-mapped
    return false;
  }
  return true; // not a recognizable IP — treat as unsafe
}

export class UnsafeUrlError extends Error {}

// Throws UnsafeUrlError if the URL isn't a safe, public http(s) target.
// Resolves the hostname (rather than trusting it at face value) so a public
// domain that resolves to an internal IP is still blocked.
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError('URL invalide');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeUrlError('Seuls http/https sont autorisés');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.internal')) {
    throw new UnsafeUrlError('Hôte non autorisé');
  }

  if (isIP(hostname) && isBlockedIp(hostname)) {
    throw new UnsafeUrlError('Adresse IP non autorisée');
  }

  if (!isIP(hostname)) {
    let records;
    try {
      records = await dns.lookup(hostname, { all: true });
    } catch {
      throw new UnsafeUrlError("Impossible de résoudre l'hôte");
    }
    if (records.some(r => isBlockedIp(r.address))) {
      throw new UnsafeUrlError('Adresse IP non autorisée');
    }
  }

  return parsed;
}
