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
vi.mock('@/lib/marketplace/events-service', () => ({
  getEventCalendar: vi.fn(async () => [
    { slug: 'back-to-school', name: 'Back to School', category: 'laptops',
      starts_at: '2000-01-01', ends_at: '2099-12-31', expected_discount_pct: 20 },
  ]),
}));

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

  it('feeds the model today\'s date and a live/upcoming status for events', async () => {
    let toolResult = '';
    let seenSystem = '';
    let call = 0;
    const fake = async (params: Anthropic.MessageCreateParamsNonStreaming) => {
      seenSystem = String(params.system);
      call++;
      if (call === 1) {
        return msg([{ type: 'tool_use', id: 'c1', name: 'get_event_calendar', input: {} } as Anthropic.ContentBlock], 'tool_use');
      }
      // 2nd call: the tool_result the loop fed back is in the last user message
      const last = params.messages[params.messages.length - 1];
      toolResult = JSON.stringify(last.content);
      return msg([{ type: 'text', text: 'ok' } as Anthropic.ContentBlock], 'end_turn');
    };
    await runAssistant([{ role: 'user', content: 'sale coming?' }], fake);
    expect(seenSystem).toMatch(/Today's date is \d{4}-\d{2}-\d{2}/);
    expect(toolResult).toMatch(/today/);
    expect(toolResult).toMatch(/live now/);
  });

  it('offers the get_event_calendar tool and runs it for timing questions', async () => {
    let sawTool = false;
    let call = 0;
    const fake = async (params: Anthropic.MessageCreateParamsNonStreaming) => {
      sawTool ||= (params.tools ?? []).some((t) => t.name === 'get_event_calendar');
      call++;
      if (call === 1) {
        return msg([{ type: 'tool_use', id: 'c1', name: 'get_event_calendar', input: { category: 'laptops' } } as Anthropic.ContentBlock], 'tool_use');
      }
      return msg([{ type: 'text', text: 'Back to School is live now — buy now.' } as Anthropic.ContentBlock], 'end_turn');
    };
    const res = await runAssistant([{ role: 'user', content: 'should I buy a laptop now or wait?' }], fake);
    expect(sawTool).toBe(true);
    expect(res.reply).toMatch(/Back to School/);
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
    expect(seenSystem).toMatch(/get_event_calendar|wait/i);
  });
});
