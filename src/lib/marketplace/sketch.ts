/**
 * Protaige Sketch integration — on-brand promo creatives over the REST API.
 * SoukHub uses one account key (SKETCH_API_KEY) and its own brand
 * (SKETCH_BRAND_ID); banners are generated server-side by scripts, never on a
 * request path. See docs: https://sketch.protaige.com/docs#rest-api
 */

const SKETCH_URL = () =>
  (process.env.SKETCH_API_URL || 'https://sketch.protaige.com').replace(/\/$/, '');

function apiKey(): string {
  const key = process.env.SKETCH_API_KEY;
  if (!key) throw new Error('SKETCH_API_KEY is not set');
  return key;
}

export interface SketchBrand {
  id: string;
  name: string;
  logo?: string | null;
  domain?: string | null;
}

/** Grab (or refresh) a brand from a site URL — Sketch pulls colours, logo, tone. */
export async function grabBrand(url: string): Promise<SketchBrand> {
  const res = await fetch(`${SKETCH_URL()}/api/v1/brands`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    throw new Error(`Sketch brand grab failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  return (await res.json()) as SketchBrand;
}

export interface SketchCreative {
  image_url: string;
  html: string;
}

/**
 * Generate an on-brand creative. Returns the (24h-signed) source image URL and
 * the HTML artifact — callers must persist the image, not hotlink the URL.
 */
export async function generateCreative(
  prompt: string,
  brandId = process.env.SKETCH_BRAND_ID
): Promise<SketchCreative> {
  if (!brandId) throw new Error('SKETCH_BRAND_ID is not set');
  const res = await fetch(`${SKETCH_URL()}/api/v1/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey()}` },
    body: JSON.stringify({ type: 'creative', brandId, prompt }),
  });
  if (!res.ok) {
    throw new Error(`Sketch generate failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  const out = (await res.json()) as {
    artifact?: { url?: string; html?: string };
    error?: string;
  };
  if (out.error) throw new Error(out.error);
  const image_url = out.artifact?.url;
  if (!image_url) throw new Error('Sketch returned no image');
  return { image_url, html: out.artifact?.html ?? '' };
}

/**
 * Prompt for a wide web promo banner for a retail-calendar event. English text
 * only — Sketch's Arabic rendering is unreliable, and the site chrome around
 * the image is already localized.
 */
export function bannerPrompt(input: {
  eventName: string;
  category: string | null;
  discountPct: number | null;
}): string {
  const what = input.category ? input.category : 'phones, laptops and electronics';
  const off = input.discountPct ? `up to ${input.discountPct}% off` : 'seasonal deals';
  return (
    `Wide horizontal web promo banner for SoukHub, a UAE marketplace for graded phones and electronics. ` +
    `Campaign: ${input.eventName} — ${off} on ${what}. ` +
    `Clean modern marketplace style, SoukHub teal and sienna accents, real device photography, plenty of whitespace. ` +
    `English text ONLY (no Arabic). Big headline "${input.eventName}", a short subtext line with the offer, and a "Shop now" button. ` +
    `No paragraphs, no fake prices, no logos other than SoukHub.`
  );
}
