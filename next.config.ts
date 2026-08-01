import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfkit', '@napi-rs/canvas', 'pdfjs-dist'],
  images: {
    // PDF/CV thumbnails are uploaded to Vercel Blob, which serves each store
    // off its own random subdomain — needed for next/image to be allowed to
    // optimize (resize + serve WebP/AVIF) them instead of passing them
    // through untouched.
    remotePatterns: [{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' }],
  },
};

export default nextConfig;
