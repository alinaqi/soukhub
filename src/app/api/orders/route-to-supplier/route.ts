import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { routeOrder, routeOrders, getUnroutedOrders } from '@/lib/order-routing';

// POST: Route specific orders to suppliers
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { order_ids, order_id } = body;

    // Single order
    if (order_id && !order_ids) {
      const result = await routeOrder(supabase, user.id, order_id);
      return NextResponse.json({ result });
    }

    // Multiple orders
    if (order_ids && Array.isArray(order_ids)) {
      const results = await routeOrders(supabase, user.id, order_ids);
      const routed = results.filter(r => r.routed).length;
      const failed = results.filter(r => !r.routed).length;

      return NextResponse.json({
        results,
        summary: { routed, failed, total: results.length },
      });
    }

    return NextResponse.json({ error: 'order_id or order_ids required' }, { status: 400 });
  } catch (error) {
    console.error('Error routing orders:', error);
    return NextResponse.json({ error: 'Failed to route orders' }, { status: 500 });
  }
}

// GET: Get unrouted orders
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const unroutedOrders = await getUnroutedOrders(supabase, user.id);

    return NextResponse.json({
      orders: unroutedOrders,
      count: unroutedOrders.length,
    });
  } catch (error) {
    console.error('Error getting unrouted orders:', error);
    return NextResponse.json({ error: 'Failed to get unrouted orders' }, { status: 500 });
  }
}
