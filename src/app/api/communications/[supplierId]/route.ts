import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

/**
 * GET /api/communications/[supplierId]
 * Get all messages for a specific supplier
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier details
    const { data: supplier } = await getTable(supabase, 'suppliers')
      .select('id, name, whatsapp_number, email')
      .eq('id', supplierId)
      .eq('user_id', user.id)
      .single();

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Get all messages for this supplier
    const { data: messages } = await getTable(supabase, 'whatsapp_messages')
      .select('id, direction, message_content, status, sent_at, created_at, parsed_intent, parsed_data')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: true });

    // Get pending orders for this supplier
    const { data: pendingOrders } = await getTable(supabase, 'supplier_orders')
      .select(`
        id,
        status,
        created_at,
        order:orders (
          id,
          marketplace_order_id,
          customer_name,
          order_items (product_name, quantity)
        )
      `)
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .in('status', ['pending_send', 'sent', 'confirmed'])
      .order('created_at', { ascending: false })
      .limit(10);

    // Format messages
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedMessages = messages?.map((msg: any) => ({
      id: msg.id,
      direction: msg.direction,
      content: msg.message_content,
      status: msg.status,
      sent_at: msg.sent_at || msg.created_at,
      parsed_intent: msg.parsed_intent,
      confidence: msg.parsed_data?.confidence,
    })) || [];

    // Format pending orders
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedOrders = pendingOrders?.map((so: any) => ({
      id: so.id,
      status: so.status,
      marketplace_order_id: so.order?.marketplace_order_id,
      customer_name: so.order?.customer_name,
      items: so.order?.order_items || [],
    })) || [];

    return NextResponse.json({
      supplier: {
        id: supplier.id,
        name: supplier.name,
        whatsapp_number: supplier.whatsapp_number,
        email: supplier.email,
      },
      messages: formattedMessages,
      pending_orders: formattedOrders,
    });
  } catch (error) {
    console.error('Fetch supplier messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
