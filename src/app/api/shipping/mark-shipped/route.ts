import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

interface MarkShippedRequest {
  order_ids: string[];
  carrier?: string;
  tracking_numbers?: Record<string, string>;
}

export async function POST(request: NextRequest) {
  try {
    const body: MarkShippedRequest = await request.json();
    const { order_ids, carrier, tracking_numbers } = body;

    if (!order_ids || order_ids.length === 0) {
      return NextResponse.json({ error: 'order_ids is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date().toISOString();

    // Update orders to shipped status
    const updateData: Record<string, unknown> = {
      status: 'shipped',
      ship_date: now,
    };

    if (carrier) {
      updateData.carrier = carrier;
    }

    const { error: orderError } = await supabase
      .from('orders')
      .update(updateData)
      .in('id', order_ids)
      .eq('user_id', user.id);

    if (orderError) {
      console.error('Error updating orders:', orderError);
      return NextResponse.json({ error: 'Failed to update orders' }, { status: 500 });
    }

    // Update individual tracking numbers if provided
    if (tracking_numbers) {
      for (const [orderId, trackingNumber] of Object.entries(tracking_numbers)) {
        if (trackingNumber) {
          await supabase
            .from('orders')
            .update({ tracking_number: trackingNumber })
            .eq('id', orderId)
            .eq('user_id', user.id);
        }
      }
    }

    // Update supplier orders to shipped status
    const { error: soError } = await getTable(supabase, 'supplier_orders')
      .update({
        status: 'shipped',
        shipped_at: now,
      })
      .in('order_id', order_ids)
      .eq('user_id', user.id);

    if (soError) {
      console.error('Error updating supplier orders:', soError);
      // Don't fail the whole request
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('activity_log').insert({
      user_id: user.id,
      activity_type: 'order_created', // Using existing enum
      title: 'Orders shipped',
      description: `${order_ids.length} order(s) marked as shipped via ${carrier || 'unknown carrier'}`,
      metadata: { order_ids, carrier },
    });

    return NextResponse.json({
      success: true,
      message: `${order_ids.length} orders marked as shipped`,
      shipped_count: order_ids.length,
    });
  } catch (error) {
    console.error('Mark shipped error:', error);
    return NextResponse.json({ error: 'Failed to mark as shipped' }, { status: 500 });
  }
}
