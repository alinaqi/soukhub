import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDeal, endDeal, listOrgDeals } from '@/lib/marketplace/deals-service';

async function sessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** GET /api/deals — the caller's org deals (console). */
export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    return NextResponse.json({ deals: await listOrgDeals(userId) });
  } catch (error) {
    console.error('deals list failed:', error);
    return NextResponse.json({ error: 'Failed to load deals' }, { status: 500 });
  }
}

/** POST /api/deals — start a deal on one of the caller's products. */
export async function POST(request: NextRequest) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json();
    const result = await createDeal(userId, {
      product_id: String(body.product_id ?? ''),
      deal_price: Number(body.deal_price),
      ends_at: String(body.ends_at ?? ''),
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true, deal_id: result.deal_id }, { status: 201 });
  } catch (error) {
    console.error('deal create failed:', error);
    return NextResponse.json({ error: 'deal_failed' }, { status: 500 });
  }
}

/** DELETE /api/deals?product_id=… — end the live deal on a product. */
export async function DELETE(request: NextRequest) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const productId = request.nextUrl.searchParams.get('product_id');
  if (!productId) return NextResponse.json({ error: 'product_id required' }, { status: 400 });
  try {
    const result = await endDeal(userId, productId);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('deal end failed:', error);
    return NextResponse.json({ error: 'deal_failed' }, { status: 500 });
  }
}
