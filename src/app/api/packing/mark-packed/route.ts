import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

interface MarkPackedRequest {
  order_id: string;
  supplier_order_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: MarkPackedRequest = await request.json();
    const { order_id, supplier_order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Update supplier order status
    if (supplier_order_id) {
      const { error: soError } = await getTable(supabase, 'supplier_orders')
        .update({
          status: 'packed',
          packed_at: now,
        })
        .eq('id', supplier_order_id)
        .eq('user_id', user.id);

      if (soError) {
        console.error('Error updating supplier order:', soError);
        return NextResponse.json({ error: 'Failed to update supplier order' }, { status: 500 });
      }
    }

    // Update order status to ready_to_ship
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'ready_to_ship',
      })
      .eq('id', order_id)
      .eq('user_id', user.id);

    if (orderError) {
      console.error('Error updating order:', orderError);
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('activity_log').insert({
      user_id: user.id,
      activity_type: 'order_created', // Using existing enum
      title: 'Order packed',
      description: `Order marked as packed and ready to ship`,
      metadata: { order_id, supplier_order_id },
    });

    return NextResponse.json({
      success: true,
      message: 'Order marked as packed',
    });
  } catch (error) {
    console.error('Mark packed error:', error);
    return NextResponse.json({ error: 'Failed to mark as packed' }, { status: 500 });
  }
}
