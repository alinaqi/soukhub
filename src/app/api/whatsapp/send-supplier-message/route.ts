import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import {
  generateSupplierOrderMessage,
  generateBatchOrderMessage,
  generateWhatsAppLink,
  logWhatsAppMessage,
} from '@/lib/whatsapp';

interface SendMessageRequest {
  supplier_order_ids: string[];
  custom_message?: string;
}

// POST /api/whatsapp/send-supplier-message
// Generates WhatsApp message for supplier orders
export async function POST(request: NextRequest) {
  try {
    const body: SendMessageRequest = await request.json();
    const { supplier_order_ids, custom_message } = body;

    if (!supplier_order_ids || supplier_order_ids.length === 0) {
      return NextResponse.json({ error: 'supplier_order_ids required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch supplier orders with order details
    const { data: supplierOrders, error: soError } = await getTable(supabase, 'supplier_orders')
      .select(`
        id,
        order_id,
        supplier_id,
        supplier:suppliers (id, name, whatsapp_number)
      `)
      .in('id', supplier_order_ids)
      .eq('user_id', user.id);

    if (soError || !supplierOrders || supplierOrders.length === 0) {
      return NextResponse.json({ error: 'Supplier orders not found' }, { status: 404 });
    }

    // Get order details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderIds = supplierOrders.map((so: any) => so.order_id);
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        marketplace_order_id,
        marketplace,
        customer_name,
        shipping_city,
        order_items (product_name, quantity)
      `)
      .in('id', orderIds);

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: 'Orders not found' }, { status: 404 });
    }

    // Group by supplier
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderMap = new Map(orders.map((o: any) => [o.id, o]));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supplierGroups = new Map<string, { supplier: any; orders: any[] }>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const so of supplierOrders as any[]) {
      if (!so.supplier) continue;

      const supplierId = so.supplier.id;
      if (!supplierGroups.has(supplierId)) {
        supplierGroups.set(supplierId, { supplier: so.supplier, orders: [] });
      }

      const order = orderMap.get(so.order_id);
      if (order) {
        supplierGroups.get(supplierId)!.orders.push({
          ...order,
          supplier_order_id: so.id,
          items: order.order_items?.map((i: { product_name: string; quantity: number }) => ({
            product_name: i.product_name,
            quantity: i.quantity,
          })) || [],
        });
      }
    }

    // Generate messages for each supplier
    const results = [];

    for (const [supplierId, { supplier, orders: supplierOrdersList }] of supplierGroups) {
      let message: string;

      if (custom_message) {
        message = custom_message;
      } else if (supplierOrdersList.length === 1) {
        // Single order message
        message = generateSupplierOrderMessage(supplier, supplierOrdersList[0]);
      } else {
        // Batch order message
        message = generateBatchOrderMessage(supplier, supplierOrdersList);
      }

      const whatsappLink = generateWhatsAppLink(supplier.whatsapp_number, message);

      // Log the message
      for (const order of supplierOrdersList) {
        await logWhatsAppMessage(supabase, user.id, {
          supplier_order_id: order.supplier_order_id,
          supplier_id: supplierId,
          phone_number: supplier.whatsapp_number,
          message_content: message,
          direction: 'outgoing',
          status: 'pending',
        });
      }

      // Update supplier order status to 'sent'
      const supplierOrderIdsToUpdate = supplierOrdersList.map((o: { supplier_order_id: string }) => o.supplier_order_id);
      await getTable(supabase, 'supplier_orders')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_via: 'whatsapp',
        })
        .in('id', supplierOrderIdsToUpdate);

      results.push({
        supplier_id: supplierId,
        supplier_name: supplier.name,
        order_count: supplierOrdersList.length,
        whatsapp_link: whatsappLink,
        message_preview: message.substring(0, 100) + '...',
      });
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Send supplier message error:', error);
    return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
  }
}
