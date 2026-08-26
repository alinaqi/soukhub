import { NextRequest, NextResponse } from 'next/server';
import { runAssistant, type ChatTurn } from '@/lib/assistant/run';

export const maxDuration = 60;

/** POST /api/assistant — public shopping assistant (guests welcome). */
export async function POST(request: NextRequest) {
  try {
    const { messages } = (await request.json()) as { messages?: ChatTurn[] };
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return NextResponse.json({ error: 'messages (1-30) required' }, { status: 400 });
    }
    for (const m of messages) {
      if (!['user', 'assistant'].includes(m?.role) || typeof m?.content !== 'string') {
        return NextResponse.json({ error: 'invalid message shape' }, { status: 400 });
      }
    }
    const reply = await runAssistant(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error('assistant failed:', error);
    return NextResponse.json({ error: 'assistant_failed' }, { status: 502 });
  }
}
