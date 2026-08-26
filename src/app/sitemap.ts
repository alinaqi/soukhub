import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { localeAlternates } from '@/i18n/routing';

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
    alternates: { languages: localeAlternates(path, BASE) },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [
    entry('/', 1, 'hourly'),
    entry('/search', 0.9, 'hourly'),
    entry('/trade-in', 0.8, 'weekly'),
    entry('/providers', 0.8, 'daily'),
    entry('/sell', 0.8, 'weekly'),
    ...['phones', 'laptops', 'tablets', 'audio', 'wearables', 'gaming'].map((c) =>
      entry(`/search?category=${c}`, 0.8, 'daily')
    ),
  ];
  try {
    const db = anon();
    const [{ data: products }, { data: stores }, { data: catalog }, { data: shops }] = await Promise.all([
      db.from('products').select('slug, short_id, updated_at').eq('is_published', true).limit(2000),
      db.from('organizations').select('slug').eq('is_published', true).limit(500),
      db
        .from('catalog_products')
        .select('slug, short_id, scraped_at')
        .eq('is_active', true)
        .limit(3000),
      db.from('providers').select('slug').eq('is_active', true).limit(2000),
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
    for (const shop of shops ?? []) {
      if (shop.slug) out.push(entry(`/providers/${shop.slug}`, 0.6, 'weekly'));
    }
  } catch {
    // static entries still ship if the DB hiccups
  }
  return out;
}
