import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isOperator } from '@/lib/operator';

/** Operator-only: update the status of a catalog request or trade-in. */

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

const TABLES = {
  catalog: 'catalog_requests',
  tradein: 'trade_in_requests',
  provider: 'provider_requests',
} as const;

const STATUSES = ['new', 'evaluated', 'contacted', 'completed', 'closed'] as const;

export async function PATCH(request: NextRequest) {
  const gate = await isOperator();
  if (!gate.ok) return NextResponse.json({ error: 'Operator access only' }, { status: 403 });
  try {
    const { kind, id, status } = await request.json();
    if (!(kind in TABLES) || typeof id !== 'string') {
      return NextResponse.json({ error: 'kind (catalog|tradein|provider) and id required' }, { status: 400 });
    }
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: `status must be one of ${STATUSES.join(', ')}` }, { status: 400 });
    }
    const { error } = await svc()
      .from(TABLES[kind as keyof typeof TABLES])
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('request update failed:', error);
    return NextResponse.json({ error: 'update_failed' }, { status: 500 });
  }
}
