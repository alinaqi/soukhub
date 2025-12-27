import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { OperationsDashboard } from '@/components/operations/OperationsDashboard';
import { getTable } from '@/lib/supabase/tables';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Operations',
};

// Get today's start/end in UTC
function getTodayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  return { start, end };
}

export default async function OperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { start: todayStart, end: todayEnd } = getTodayRange();

  // Fetch all active orders for pipeline
  const { data: ordersData } = await supabase
    .from('orders')
    .select(`
      id,
      marketplace_order_id,
      marketplace,
      status,
      order_date,
      customer_name,
      shipping_city,
      total,
      currency,
      supplier_order_id,
      routed_at,
      order_items (product_name, quantity)
    `)
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped'])
    .order('order_date', { ascending: false })
    .limit(200);

  // Fetch supplier orders with supplier info
  const { data: supplierOrdersData } = await getTable(supabase, 'supplier_orders')
    .select(`
      id,
      order_id,
      supplier_id,
      status,
      sent_at,
      created_at,
      supplier:suppliers (id, name, whatsapp_number, delivery_times)
    `)
    .eq('user_id', user.id)
    .in('status', ['pending_send', 'sent', 'confirmed', 'delivered_to_seller'])
    .order('created_at', { ascending: false });

  // Fetch suppliers
  const { data: suppliersData } = await getTable(supabase, 'suppliers')
    .select('id, name, whatsapp_number, delivery_times, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true);

  // Count orders by status
  const ordersByStatus = {
    new: 0,
    awaiting_supplier: 0,
    confirmed: 0,
    ready_to_pack: 0,
    packed: 0,
    shipped_today: 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (ordersData || []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supplierOrders = (supplierOrdersData || []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const suppliers = (suppliersData || []) as any[];

  // Create supplier order map for quick lookup
  const supplierOrderMap = new Map<string, typeof supplierOrders[0]>();
  for (const so of supplierOrders) {
    supplierOrderMap.set(so.order_id, so);
  }

  // Categorize orders
  const newOrders: typeof orders = [];
  const awaitingSupplierOrders: typeof orders = [];
  const confirmedOrders: typeof orders = [];
  const readyToPackOrders: typeof orders = [];
  const shippedTodayOrders: typeof orders = [];

  for (const order of orders) {
    const supplierOrder = supplierOrderMap.get(order.id);

    if (order.status === 'shipped') {
      // Check if shipped today
      const shippedAt = order.ship_date || order.updated_at;
      if (shippedAt && shippedAt >= todayStart && shippedAt < todayEnd) {
        shippedTodayOrders.push(order);
        ordersByStatus.shipped_today++;
      }
      continue;
    }

    if (!supplierOrder) {
      // New order, not yet routed to supplier
      newOrders.push(order);
      ordersByStatus.new++;
    } else if (supplierOrder.status === 'pending_send' || supplierOrder.status === 'sent') {
      // Awaiting supplier confirmation
      awaitingSupplierOrders.push({ ...order, supplierOrder });
      ordersByStatus.awaiting_supplier++;
    } else if (supplierOrder.status === 'confirmed') {
      // Supplier confirmed, ready to be delivered
      confirmedOrders.push({ ...order, supplierOrder });
      ordersByStatus.confirmed++;
    } else if (supplierOrder.status === 'delivered_to_seller') {
      // Delivered by supplier, ready to pack
      readyToPackOrders.push({ ...order, supplierOrder });
      ordersByStatus.ready_to_pack++;
    }
  }

  // Group supplier orders by supplier
  const ordersBySupplier: Record<string, { supplier: typeof suppliers[0]; orders: typeof supplierOrders }> = {};
  for (const so of supplierOrders) {
    if (!so.supplier) continue;
    const supplierId = so.supplier.id;
    if (!ordersBySupplier[supplierId]) {
      ordersBySupplier[supplierId] = { supplier: so.supplier, orders: [] };
    }
    ordersBySupplier[supplierId].orders.push(so);
  }

  // Find orders that need attention
  const needsAttention: { type: string; count: number; description: string; href: string }[] = [];

  // Unrouted orders
  if (ordersByStatus.new > 0) {
    needsAttention.push({
      type: 'warning',
      count: ordersByStatus.new,
      description: 'orders need supplier assignment',
      href: '#new-orders',
    });
  }

  // Slow supplier responses (> 2 hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const slowResponses = supplierOrders.filter(
    (so) => so.status === 'sent' && so.sent_at && so.sent_at < twoHoursAgo
  );
  if (slowResponses.length > 0) {
    needsAttention.push({
      type: 'alert',
      count: slowResponses.length,
      description: 'orders waiting >2 hours for supplier',
      href: '#awaiting-supplier',
    });
  }

  // Get deliveries expected today based on supplier delivery times
  const now = new Date();
  const currentHour = now.getHours();
  const upcomingDeliveries: { supplier: typeof suppliers[0]; time: string; expectedItems: number }[] = [];

  for (const [, data] of Object.entries(ordersBySupplier)) {
    const { supplier, orders: supplierOrdersList } = data;
    const pendingCount = supplierOrdersList.filter((o) =>
      ['sent', 'confirmed'].includes(o.status || '')
    ).length;

    if (pendingCount > 0 && supplier.delivery_times) {
      for (const time of supplier.delivery_times) {
        // Parse time like "10:00 AM"
        const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let hour = parseInt(match[1]);
          if (match[3]?.toUpperCase() === 'PM' && hour < 12) hour += 12;
          if (match[3]?.toUpperCase() === 'AM' && hour === 12) hour = 0;

          if (hour > currentHour) {
            upcomingDeliveries.push({
              supplier,
              time,
              expectedItems: pendingCount,
            });
          }
        }
      }
    }
  }

  // Sort deliveries by time
  upcomingDeliveries.sort((a, b) => {
    const parseTime = (t: string) => {
      const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (!match) return 0;
      let hour = parseInt(match[1]);
      if (match[3]?.toUpperCase() === 'PM' && hour < 12) hour += 12;
      return hour * 60 + parseInt(match[2]);
    };
    return parseTime(a.time) - parseTime(b.time);
  });

  // Today's metrics
  const todayOrders = orders.filter((o) => o.order_date >= todayStart && o.order_date < todayEnd);
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <OperationsDashboard
      ordersByStatus={ordersByStatus}
      newOrders={newOrders}
      awaitingSupplierOrders={awaitingSupplierOrders}
      confirmedOrders={confirmedOrders}
      readyToPackOrders={readyToPackOrders}
      shippedTodayOrders={shippedTodayOrders}
      ordersBySupplier={Object.values(ordersBySupplier)}
      needsAttention={needsAttention}
      upcomingDeliveries={upcomingDeliveries}
      metrics={{
        ordersToday: todayOrders.length,
        revenueToday: todayRevenue,
        shippedToday: ordersByStatus.shipped_today,
      }}
    />
  );
}
