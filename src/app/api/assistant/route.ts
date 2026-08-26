import { NextRequest, NextResponse } from 'next/server';
import { runAssistant, type ChatTurn } from '@/lib/assistant/run';

export const maxDuration = 60;

/** POST /api/assistant — public shopping assistant (guests welcome). */
export async function POST(request: NextRequest) {
  try {
    const { messages, page } = (await request.json()) as { messages?: ChatTurn[]; page?: string };
    const pagePath =
      typeof page === 'string' && /^\/[\w\-/?=&%.]{0,120}$/.test(page) && !page.startsWith('//')
        ? page
        : null;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return NextResponse.json({ error: 'messages (1-30) required' }, { status: 400 });
    }
    for (const m of messages) {
      if (!['user', 'assistant'].includes(m?.role) || typeof m?.content !== 'string') {
        return NextResponse.json({ error: 'invalid message shape' }, { status: 400 });
      }
    }
    const { reply, products } = await runAssistant(messages, undefined, pagePath);
    return NextResponse.json({ reply, products });
  } catch (error) {
    console.error('assistant failed:', error);
    return NextResponse.json({ error: 'assistant_failed' }, { status: 502 });
  }
}
