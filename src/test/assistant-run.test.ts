import { describe, it, expect, vi } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';

vi.mock('@/lib/marketplace/queries', () => ({
  searchListings: vi.fn(async () =>
    Array.from({ length: 6 }, (_, i) => ({
      name: `Phone ${i}`, base_price: 1000 + i, store_name: 'Store',
      slug: `phone-${i}`, short_id: `id${i}`, images: [],
    }))
  ),
  searchCatalog: vi.fn(async () => []),
}));
vi.mock('@/lib/checkout/service', () => ({ lookupOrder: vi.fn(async () => null) }));

import { runAssistant } from '@/lib/assistant/run';

function msg(content: Anthropic.ContentBlock[], stop: string): Anthropic.Message {
  return { content, stop_reason: stop } as unknown as Anthropic.Message;
}

describe('runAssistant (spec: answer simplicity)', () => {
  it('never surfaces more than 3 products (one pick + two alternatives)', async () => {
    let call = 0;
    const fake = async () => {
      call++;
      if (call === 1) {
        return msg(
          [{ type: 'tool_use', id: 't1', name: 'search_products', input: { query: 'phone' } } as Anthropic.ContentBlock],
          'tool_use'
        );
      }
      return msg([{ type: 'text', text: 'Get this one: Phone 0.' } as Anthropic.ContentBlock], 'end_turn');
    };
    const result = await runAssistant([{ role: 'user', content: 'best phone?' }], fake);
    expect(result.products.length).toBeLessThanOrEqual(3);
    expect(result.reply).toContain('Get this one');
  });

  it('system prompt carries the answer-page and honesty rules', async () => {
    let seenSystem = '';
    const fake = async (params: Anthropic.MessageCreateParamsNonStreaming) => {
      seenSystem = String(params.system);
      return msg([{ type: 'text', text: 'ok' } as Anthropic.ContentBlock], 'end_turn');
    };
    await runAssistant([{ role: 'user', content: 'hi' }], fake);
    expect(seenSystem).toMatch(/Get this one/i);
    expect(seenSystem).toMatch(/three|3/);
    expect(seenSystem).toMatch(/never invent/i);
    expect(seenSystem).toMatch(/same language/i);
    expect(seenSystem).toMatch(/no good match|say so/i);
  });
});
