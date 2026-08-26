import { createClient } from '@supabase/supabase-js';
import { runActorSync } from './apify';

/**
 * Provider directory ingestion (ADR 0017): Google Maps places via Apify's
 * compass/crawler-google-places → providers table. Defensive mapping like
 * the catalog pipeline: scraped shapes drift, broken rows are dropped.
 */

export interface ProviderItem {
  google_place_id: string;
  name: string;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  area: string | null;
  emirate: string | null;
  lat: number | null;
  lng: number | null;
  google_rating: number | null;
  google_review_count: number | null;
  category: string | null;
  hours: Record<string, unknown>;
  image_url: string | null;
}

const EMIRATES = [
  'Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain',
];

export function inferEmirate(address: string | null, city: string | null): string | null {
  const haystack = `${city ?? ''} ${address ?? ''}`.toLowerCase();
  for (const emirate of EMIRATES) {
    if (haystack.includes(emirate.toLowerCase())) return emirate;
  }
  if (/\babu ?dhabi\b/.test(haystack)) return 'Abu Dhabi';
  if (/\brak\b/.test(haystack)) return 'Ras Al Khaimah';
  return null;
}

/** UAE numbers → wa.me-ready international digits, or null if not a mobile. */
export function toWhatsApp(phone: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('05')) digits = '971' + digits.slice(1);
  if (digits.length === 9 && digits.startsWith('5')) digits = '971' + digits;
  // Only mobile numbers (9715x) do WhatsApp; landlines (9714x etc.) don't
  return /^9715\d{8}$/.test(digits) ? digits : null;
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function asNumber(v: unknown): number | null {
  const n = Number(v);
  return isFinite(n) ? n : null;
}

type Raw = Record<string, unknown>;

/** compass/crawler-google-places item shape. */
export function mapPlaceItem(raw: Raw): ProviderItem | null {
  const placeId = asString(raw.placeId);
  const name = asString(raw.title);
  if (!placeId || !name) return null;
  // permanently closed shops are noise
  if (raw.permanentlyClosed === true || raw.temporarilyClosed === true) return null;

  const location = (raw.location ?? {}) as Raw;
  const phone = asString(raw.phone) ?? asString(raw.phoneUnformatted);
  const address = asString(raw.address);
  const city = asString(raw.city);
  const rating = asNumber(raw.totalScore);

  return {
    google_place_id: placeId,
    name: name.slice(0, 120),
    phone,
    whatsapp: toWhatsApp(phone),
    website: asString(raw.website),
    address,
    area: asString(raw.neighborhood) ?? city,
    emirate: inferEmirate(address, city),
    lat: asNumber(location.lat),
    lng: asNumber(location.lng),
    google_rating: rating != null && rating > 0 && rating <= 5 ? rating : null,
    google_review_count: asNumber(raw.reviewsCount),
    category: asString(raw.categoryName),
    hours: Array.isArray(raw.openingHours) ? { openingHours: raw.openingHours } : {},
    image_url: asString(raw.imageUrl),
  };
}

export function mapPlaces(rawItems: Raw[]): ProviderItem[] {
  const seen = new Set<string>();
  const out: ProviderItem[] = [];
  for (const raw of rawItems) {
    const item = mapPlaceItem(raw);
    if (!item || seen.has(item.google_place_id)) continue;
    seen.add(item.google_place_id);
    out.push(item);
  }
  return out;
}

export async function upsertProviders(items: ProviderItem[]): Promise<number> {
  if (items.length === 0) return 0;
  const svc = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const rows = items.map((i) => ({ ...i, is_active: true, scraped_at: new Date().toISOString() }));
  for (let start = 0; start < rows.length; start += 50) {
    const { error } = await svc
      .from('providers')
      .upsert(rows.slice(start, start + 50), { onConflict: 'google_place_id' });
    if (error) throw error;
  }
  return rows.length;
}

export interface ProviderIngestResult {
  emirate: string;
  scraped: number;
  mapped: number;
  upserted: number;
}

export async function ingestProviders(emirate: string, max = 60): Promise<ProviderIngestResult> {
  const raw = await runActorSync(
    'compass/crawler-google-places',
    {
      searchStringsArray: ['mobile phone shop', 'mobile phone trading'],
      locationQuery: `${emirate}, United Arab Emirates`,
      maxCrawledPlacesPerSearch: Math.ceil(max / 2),
      language: 'en',
      skipClosedPlaces: true,
      scrapeContacts: false,
      maxImages: 1,
    },
    { timeoutSecs: 600 }
  );
  const mapped = mapPlaces(raw);
  const upserted = await upsertProviders(mapped);
  return { emirate, scraped: raw.length, mapped: mapped.length, upserted };
}
