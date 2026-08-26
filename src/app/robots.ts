import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://soukhub.vercel.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/settings', '/checkout/', '/offline'],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
