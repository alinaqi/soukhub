/**
 * Talabat-style delivery location: a per-device "Deliver to: <area>" choice.
 * Stored in localStorage (guest-first, like food-delivery apps pre-login);
 * reverse geocoding via OSM Nominatim, mapped defensively here.
 */

export interface DeliveryLocation {
  label: string;
  lat: number | null;
  lng: number | null;
}

const STORAGE_KEY = 'soukhub-delivery-location';

/** Nominatim reverse-geocode JSON → short "Area, City" label. */
export function labelFromNominatim(json: unknown): string | null {
  if (!json || typeof json !== 'object') return null;
  const { address, display_name: displayName } = json as {
    address?: Record<string, unknown>;
    display_name?: unknown;
  };
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const v = address?.[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
  };
  const area = pick('neighbourhood', 'suburb', 'quarter', 'village', 'town');
  const city = pick('city', 'municipality', 'state', 'county');
  if (area && city) return `${area}, ${city}`;
  if (city) return city;
  if (area) return area;
  if (typeof displayName === 'string' && displayName.trim()) {
    return displayName.split(',').slice(0, 2).map((p) => p.trim()).filter(Boolean).join(', ');
  }
  return null;
}

function isValidLocation(v: unknown): v is DeliveryLocation {
  if (!v || typeof v !== 'object') return false;
  const { label, lat, lng } = v as Record<string, unknown>;
  const coordOk = (c: unknown) => c === null || (typeof c === 'number' && isFinite(c));
  return typeof label === 'string' && label.trim().length > 0 && coordOk(lat) && coordOk(lng);
}

export function loadStoredLocation(): DeliveryLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeLocation(location: DeliveryLocation): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // storage blocked (private mode etc.) — the bar just won't persist
  }
}

/** Browser-only reverse geocode (user-initiated, low volume). */
export async function reverseGeocode(
  lat: number,
  lng: number,
  locale: string
): Promise<string | null> {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16` +
    `&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}` +
    `&accept-language=${encodeURIComponent(locale)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  return labelFromNominatim(await res.json());
}
