/**
 * UAE market web search via Gemini + Google Search grounding — the assistant's
 * fallback when a product isn't in our catalog/listings. Returns a short
 * market summary and real source links, clearly external (not SoukHub stock).
 */
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

type FetchLike = typeof fetch;

export interface MarketSource {
  title: string;
  url: string;
}

export interface MarketSearchResult {
  summary: string;
  sources: MarketSource[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
    };
  }>;
}

/** Grounded search of the UAE consumer-electronics market for `query`. */
export async function searchUaeMarket(
  query: string,
  location: string | null = null,
  fetchImpl: FetchLike = fetch
): Promise<MarketSearchResult | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || !query.trim()) return null;

  const where = location ? `in ${location}, UAE` : 'in the UAE';
  const prompt =
    `A shopper is looking for: "${query}". Search the web for what is actually available to buy ${where} right now. ` +
    `Focus on UAE retailers and marketplaces (e.g. Amazon.ae, noon, Sharaf DG, Carrefour, Jumbo, dubizzle, brand stores). ` +
    `Reply in at most 4 short sentences: name 1-3 concrete options with an approximate price in AED and where to get each. ` +
    `If genuinely nothing is available, say so plainly. Do not invent products, prices, or retailers — only what the search supports.`;

  let res: Response;
  try {
    res = await fetchImpl(`${GEMINI_URL}?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2500, thinkingConfig: { thinkingBudget: 0 } },
      }),
      signal: AbortSignal.timeout(25000),
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const data = (await res.json()) as GeminiResponse;
  const candidate = data.candidates?.[0];
  const summary = (candidate?.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join(' ')
    .trim();
  if (!summary) return null;

  const seen = new Set<string>();
  const sources: MarketSource[] = [];
  for (const chunk of candidate?.groundingMetadata?.groundingChunks ?? []) {
    const url = chunk.web?.uri;
    if (!url || seen.has(url)) continue;
    seen.add(url);
    sources.push({ title: chunk.web?.title || url, url });
    if (sources.length >= 4) break;
  }
  return { summary: summary.slice(0, 1200), sources };
}
