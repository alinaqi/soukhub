import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createBuyerOrder, lookupOrder } from '@/lib/checkout/service';

/** POST /api/checkout — Buy online (COD v1). Public: guests welcome. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const auth = await createServerSupabase();
    const {
      data: { user },
    } = await auth.auth.getUser();

    const result = await createBuyerOrder({
      product_id: String(body.product_id ?? ''),
      quantity: body.quantity,
      buyer: {
        name: String(body.name ?? ''),
        phone: String(body.phone ?? ''),
        emirate: String(body.emirate ?? ''),
        address: String(body.address ?? ''),
      },
      note: typeof body.note === 'string' ? body.note : undefined,
      user_id: user?.id ?? null,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('checkout failed:', error);
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 });
  }
}

/** GET /api/checkout?ref=SH-XXXXXX&phone=... — order status (ref+phone). */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref') ?? '';
  const phone = request.nextUrl.searchParams.get('phone') ?? '';
  const order = await lookupOrder(ref, phone);
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ order });
}
