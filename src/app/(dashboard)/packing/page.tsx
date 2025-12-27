import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PackingStation } from '@/components/packing/PackingStation';
import { getTable } from '@/lib/supabase/tables';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Packing Station',
};

export default async function PackingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get today's date range
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Fetch orders ready to pack
  // These are orders where supplier_order status is 'delivered_to_seller'
  const { data: supplierOrdersData } = await getTable(supabase, 'supplier_orders')
    .select(`
      id,
      order_id,
      status,
      supplier:suppliers (id, name)
    `)
    .eq('user_id', user.id)
    .eq('status', 'delivered_to_seller')
    .order('created_at', { ascending: true });

  // Get order IDs that need packing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderIds = (supplierOrdersData || []).map((so: any) => so.order_id);

  // Fetch the actual orders with items
  let ordersData: Record<string, unknown>[] = [];
  if (orderIds.length > 0) {
    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        marketplace_order_id,
        marketplace,
        customer_name,
        shipping_city,
        shipping_address,
        total,
        currency,
        order_items (id, product_name, quantity)
      `)
      .in('id', orderIds);
    ordersData = data || [];
  }

  // Create supplier order map
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supplierOrderMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supplierOrdersData || []).forEach((so: any) => {
    supplierOrderMap.set(so.order_id, {
      id: so.id,
      status: so.status,
      supplier_name: so.supplier?.name || 'Unknown',
    });
  });

  // Merge orders with supplier info
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = ordersData.map((order: any) => ({
    id: order.id,
    marketplace_order_id: order.marketplace_order_id,
    marketplace: order.marketplace,
    customer_name: order.customer_name,
    shipping_city: order.shipping_city,
    shipping_address: order.shipping_address,
    total: order.total || 0,
    currency: order.currency || 'AED',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (order.order_items || []).map((item: any) => ({
      id: item.id,
      product_name: item.product_name,
      quantity: item.quantity,
    })),
    supplierOrder: supplierOrderMap.get(order.id),
  }));

  // Get count of orders packed today
  const { count: packedTodayCount } = await getTable(supabase, 'supplier_orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'packed')
    .gte('packed_at', todayStart);

  const totalCount = orders.length + (packedTodayCount || 0);

  return (
    <div className="p-6">
      <PackingStation orders={orders} totalCount={totalCount} />
    </div>
  );
}
