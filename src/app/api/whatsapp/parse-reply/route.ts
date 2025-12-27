import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import {
  parseSupplierReply,
  shouldAutoUpdate,
  OrderContext,
  SupplierContext,
} from '@/lib/ai/parse-supplier-reply';

interface ParseReplyRequest {
  supplier_id: string;
  message: string;
  supplier_order_ids?: string[]; // Optional: specific orders this reply is about
}

// POST /api/whatsapp/parse-reply - Parse a supplier's WhatsApp reply
export async function POST(request: NextRequest) {
  try {
    const body: ParseReplyRequest = await request.json();
    const { supplier_id, message, supplier_order_ids } = body;

    if (!supplier_id || !message) {
      return NextResponse.json(
        { error: 'supplier_id and message are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get supplier info
    const { data: supplier, error: supplierError } = await getTable(supabase, 'suppliers')
      .select('id, name, whatsapp_number')
      .eq('id', supplier_id)
      .eq('user_id', user.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Get pending supplier orders for this supplier
    let query = getTable(supabase, 'supplier_orders')
      .select(`
        id,
        order_id,
        status,
        orders:order_id (
          id,
          marketplace_order_id,
          order_items (product_name, quantity)
        )
      `)
      .eq('supplier_id', supplier_id)
      .eq('user_id', user.id)
      .in('status', ['sent', 'pending']);

    // If specific order IDs provided, filter to those
    if (supplier_order_ids && supplier_order_ids.length > 0) {
      query = query.in('id', supplier_order_ids);
    }

    const { data: supplierOrders, error: ordersError } = await query;

    if (ordersError) {
      console.error('Error fetching supplier orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!supplierOrders || supplierOrders.length === 0) {
      return NextResponse.json({
        success: true,
        parsed: {
          understood: false,
          overall_intent: 'unclear',
          orders: [],
          confidence: 0,
          reasoning: 'No pending orders found for this supplier',
          requires_manual_review: true,
          raw_reply: message,
        },
        auto_updated: false,
      });
    }

    // Build order context for AI parsing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderContexts: OrderContext[] = supplierOrders.map((so: any) => {
      const order = so.orders;
      const items = order?.order_items || [];
      const productNames = items.map((i: { product_name: string }) => i.product_name).join(', ');

      return {
        order_id: so.order_id,
        supplier_order_id: so.id,
        marketplace_order_id: order?.marketplace_order_id || 'Unknown',
        product_name: productNames || 'Unknown product',
        quantity: items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0),
      };
    });

    const supplierContext: SupplierContext = {
      name: supplier.name,
      phone: supplier.whatsapp_number,
    };

    // Parse the reply using AI
    const parsed = await parseSupplierReply(message, orderContexts, supplierContext);

    // Log the incoming message
    await getTable(supabase, 'whatsapp_messages').insert({
      user_id: user.id,
      supplier_id: supplier_id,
      phone_number: supplier.whatsapp_number,
      message_content: message,
      direction: 'incoming',
      status: 'received',
      received_at: new Date().toISOString(),
      parsed_data: parsed,
    });

    // Auto-update orders if confidence is high enough
    let autoUpdated = false;
    if (shouldAutoUpdate(parsed)) {
      for (const orderStatus of parsed.orders) {
        if (orderStatus.status === 'confirmed') {
          await getTable(supabase, 'supplier_orders')
            .update({
              status: 'confirmed',
              confirmed_at: new Date().toISOString(),
              expected_delivery: orderStatus.expected_delivery || null,
              notes: orderStatus.notes || null,
            })
            .eq('id', orderStatus.supplier_order_id);
        } else if (orderStatus.status === 'unavailable') {
          await getTable(supabase, 'supplier_orders')
            .update({
              status: 'unavailable',
              notes: orderStatus.notes || 'Supplier confirmed unavailable',
            })
            .eq('id', orderStatus.supplier_order_id);
        } else if (orderStatus.status === 'alternative_offered') {
          await getTable(supabase, 'supplier_orders')
            .update({
              status: 'alternative_offered',
              alternative_product: orderStatus.alternative_product || null,
              notes: orderStatus.notes || null,
            })
            .eq('id', orderStatus.supplier_order_id);
        }
      }
      autoUpdated = true;
    }

    return NextResponse.json({
      success: true,
      parsed,
      auto_updated: autoUpdated,
      orders_affected: parsed.orders.length,
    });
  } catch (error) {
    console.error('Parse reply error:', error);
    return NextResponse.json({ error: 'Failed to parse reply' }, { status: 500 });
  }
}
