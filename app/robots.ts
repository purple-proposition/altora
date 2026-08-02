import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // The whole app sits behind auth (middleware.ts) except /login and
      // /signup — nothing else here is indexable content anyway, so this
      // just makes that explicit instead of leaving crawlers to guess from
      // a 404.
      disallow: '/',
      allow: ['/login', '/signup'],
    },
  };
}
