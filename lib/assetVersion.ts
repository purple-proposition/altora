import fs from 'node:fs';
import path from 'node:path';

// Cache-busts /public static assets (tracker.js, lucide.js) referenced via
// next/script — those aren't hashed by the Next.js build like imported CSS/JS,
// so a stale browser/CDN cache can keep serving an old version after a deploy.
export function assetVersion(publicFile: string): number {
  try {
    return Math.round(fs.statSync(path.join(process.cwd(), 'public', publicFile)).mtimeMs);
  } catch {
    return 0;
  }
}
