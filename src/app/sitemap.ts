import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://soukhub.vercel.app';

function anon() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

function entry(path: string, priority: number, freq: MetadataRoute.Sitemap[number]['changeFrequency']) {
  return {
    url: `${BASE}${path}`,
    changeFrequency: freq,
    priority,
    alternates: { languages: { en: `${BASE}${path}`, ar: `${BASE}/ar${path}` } },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [
    entry('/', 1, 'hourly'),
    entry('/search', 0.9, 'hourly'),
    entry('/trade-in', 0.8, 'weekly'),
    entry('/sell', 0.8, 'weekly'),
    ...['phones', 'laptops', 'tablets', 'audio', 'wearables', 'gaming'].map((c) =>
      entry(`/search?category=${c}`, 0.8, 'daily')
    ),
  ];
  try {
    const db = anon();
    const [{ data: products }, { data: stores }, { data: catalog }] = await Promise.all([
      db.from('products').select('slug, short_id, updated_at').eq('is_published', true).limit(2000),
      db.from('organizations').select('slug').eq('is_published', true).limit(500),
      db
        .from('catalog_products')
        .select('slug, short_id, scraped_at')
        .eq('is_active', true)
        .limit(3000),
    ]);
    for (const p of products ?? []) {
      if (p.slug && p.short_id) out.push(entry(`/p/${p.slug}-${p.short_id}`, 0.7, 'daily'));
    }
    for (const s of stores ?? []) {
      if (s.slug) out.push(entry(`/s/${s.slug}`, 0.6, 'daily'));
    }
    for (const c of catalog ?? []) {
      if (c.slug && c.short_id) out.push(entry(`/m/${c.slug}-${c.short_id}`, 0.5, 'weekly'));
    }
  } catch {
    // static entries still ship if the DB hiccups
  }
  return out;
}
