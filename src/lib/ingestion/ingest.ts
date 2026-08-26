import { createClient } from '@supabase/supabase-js';
import { mapItems, type CatalogItem } from './mappers';
import { runActorSync } from './apify';
import { SOURCES } from './sources';

/** Upsert mapped catalog items (service role — server/scripts only). */
export async function upsertCatalogItems(items: CatalogItem[]): Promise<number> {
  if (items.length === 0) return 0;
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const rows = items.map((i) => ({
    source: i.source,
    source_id: i.source_id,
    url: i.url,
    title: i.title,
    brand: i.brand,
    model: i.model,
    category: i.category,
    condition: i.condition,
    price: i.price,
    currency: i.currency,
    images: i.images,
    attributes: i.attributes,
    is_active: true,
    scraped_at: new Date().toISOString(),
  }));
  const { error, count } = await svc
    .from('catalog_products')
    .upsert(rows, { onConflict: 'source,source_id', count: 'exact' });
  if (error) throw error;
  return count ?? rows.length;
}

export interface IngestResult {
  source: CatalogItem['source'];
  scraped: number;
  mapped: number;
  upserted: number;
}

/** Run one source end-to-end: Apify actor → mappers → upsert. */
export async function ingestSource(source: CatalogItem['source']): Promise<IngestResult> {
  const config = SOURCES[source];
  const raw = await runActorSync(config.actorId, config.input);
  const mapped = mapItems(source, raw);
  const upserted = await upsertCatalogItems(mapped);
  return { source, scraped: raw.length, mapped: mapped.length, upserted };
}
