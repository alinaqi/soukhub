/**
 * Web review intelligence via Gemini + Google Search grounding (per user's
 * model tiering: Gemini owns search-grounded research). Returns a star
 * rating, a short summary, and brief attributed quotes. Quotes are kept
 * short (snippet-length, attributed) by prompt design.
 */

export interface ReviewQuote {
  text: string;
  source: string;
}

export interface ProductReviewData {
  rating: number | null; // 0..5
  review_count: number | null;
  summary: string | null;
  quotes: ReviewQuote[];
}

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

type FetchLike = typeof fetch;

/** Normalize a product into a stable cache key (colors/storage collapse together). */
export function productReviewKey(brand: string | null, title: string): string {
  const base = `${brand ?? ''} ${title}`
    .toLowerCase()
    .replace(/\((renewed|refurbished)\)/g, '')
    .replace(/\b(\d+\s?(gb|tb))\b/g, '')
    .replace(/\b\d{5,}\b/g, '') // SKU/timestamp suffixes don't split a family
    .replace(/\b(black|white|blue|red|green|yellow|purple|pink|silver|gold|gray|grey|graphite|midnight|starlight|titanium|bronze|lavender|violet)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    // collapse repeated tokens ("apple apple iphone" → "apple iphone")
    .filter((tok, i, arr) => i === 0 || tok !== arr[i - 1])
    .join('-')
    .slice(0, 80);
  return base || 'unknown';
}

export function parseReviewJson(text: string): ProductReviewData | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const raw = JSON.parse(match[0]) as Record<string, unknown>;
    const rating = Number(raw.rating);
    const SPAM = /view (refurbished )?deals|click here|buy now|https?:\/\/|shop at|discount code/i;
    const quotes = Array.isArray(raw.quotes)
      ? (raw.quotes as Array<Record<string, unknown>>)
          .filter((q) => typeof q.text === 'string' && q.text.trim().length > 15 && !SPAM.test(q.text as string))
          .slice(0, 4)
          .map((q) => ({
            text: String(q.text).slice(0, 200),
            source: typeof q.source === 'string' ? q.source.slice(0, 60) : 'Web review',
          }))
      : [];
    return {
      rating: isFinite(rating) && rating > 0 && rating <= 5 ? Math.round(rating * 10) / 10 : null,
      review_count:
        typeof raw.review_count === 'number' && isFinite(raw.review_count) && raw.review_count > 0
          ? Math.round(raw.review_count)
          : null,
      summary: typeof raw.summary === 'string' ? raw.summary.slice(0, 400) : null,
      quotes,
    };
  } catch {
    return null;
  }
}

export async function fetchWebReviews(
  productName: string,
  fetchImpl: FetchLike = fetch
): Promise<ProductReviewData | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;

  const prompt = `Search the web for professional and user reviews of the product: "${productName}".
Respond ONLY with a JSON object (no markdown fences), exactly this shape:
{
  "rating": <average review score out of 5, one decimal, from real review data>,
  "review_count": <approximate number of user reviews you found evidence of, or null>,
  "summary": "<2 sentence neutral summary of review consensus>",
  "quotes": [
    {"text": "<short verbatim snippet from a real review, max 20 words>", "source": "<publication or site name>"}
  ]
}
Include 2-4 quotes from distinct sources. If you cannot find genuine review data for this product, respond with {"rating": null, "review_count": null, "summary": null, "quotes": []}. Never invent quotes.`;

  const res = await fetchImpl(`${GEMINI_URL}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2500, thinkingConfig: { thinkingBudget: 0 } },
    }),
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('\n');
  return parseReviewJson(text);
}
