import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processOrderCustomers, linkOrderToCustomer } from '@/lib/customer-matching';

// POST /api/customers/sync-from-orders - Create customers from existing orders
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get orders without customer_id
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, customer_email, customer_phone, customer_name, shipping_city, shipping_address, total')
      .eq('user_id', user.id)
      .is('customer_id', null)
      .limit(500);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No orders to process',
        stats: { processed: 0, new_customers: 0, matched: 0 },
      });
    }

    // Filter and transform orders for processing
    const validOrders = orders
      .filter((order) => order.customer_name) // Must have customer name
      .map((order) => ({
        id: order.id,
        customer_email: order.customer_email,
        customer_phone: order.customer_phone,
        customer_name: order.customer_name as string,
        shipping_city: order.shipping_city || undefined,
        shipping_address: typeof order.shipping_address === 'string' ? order.shipping_address : undefined,
        total: order.total || undefined,
      }));

    if (validOrders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No valid orders to process',
        stats: { processed: 0, new_customers: 0, matched: 0 },
      });
    }

    // Process orders and create/match customers
    const results = await processOrderCustomers(supabase, user.id, validOrders);

    // Link orders to customers
    let newCustomers = 0;
    let matched = 0;

    for (const [orderId, result] of results) {
      await linkOrderToCustomer(supabase, orderId, result.customer_id);

      if (result.is_new) {
        newCustomers++;
      } else {
        matched++;
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        processed: validOrders.length,
        new_customers: newCustomers,
        matched: matched,
      },
    });
  } catch (error) {
    console.error('Sync customers error:', error);
    return NextResponse.json({ error: 'Failed to sync customers' }, { status: 500 });
  }
}
