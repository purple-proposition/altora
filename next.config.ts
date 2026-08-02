import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', '@napi-rs/canvas', 'pdfjs-dist'],
  experimental: {
    // Every (tracker) route is dynamic (each calls auth()), and Next's
    // client-side Router Cache treats dynamic routes as stale immediately
    // by default — so switching back to a page you were just on a moment
    // ago still re-triggers a full server round trip (auth + DB) instead
    // of reusing what the client already fetched. This is exactly what
    // made rapid menu-switching feel unresponsive: every click, even to a
    // page visited seconds earlier, paid full server latency again. 30s
    // lets quick back-and-forth navigation resolve instantly from the
    // client cache; anything genuinely stale is still just a click away
    // (loading.tsx skeleton) rather than the visitor waiting on nothing.
    staleTimes: { dynamic: 30, static: 180 },
  },
  images: {
    // PDF/CV thumbnails are uploaded to Vercel Blob, which serves each store
    // off its own random subdomain — needed for next/image to be allowed to
    // optimize (resize + serve WebP/AVIF) them instead of passing them
    // through untouched.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
};

export default nextConfig;
