import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

// GET /api/dashboard/operations - Get operations overview data
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Fetch all data in parallel for performance
    const [
      orderPipelineResult,
      supplierOrdersResult,
      inventorySummaryResult,
      todayStatsResult,
    ] = await Promise.all([
      // Order pipeline counts
      supabase
        .from('orders')
        .select('status', { count: 'exact' })
        .eq('user_id', user.id)
        .in('status', ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered']),

      // Supplier orders status
      getTable(supabase, 'supplier_orders')
        .select(`
          id,
          status,
          sent_at,
          supplier_id,
          order_id
        `)
        .eq('user_id', user.id)
        .in('status', ['pending_send', 'sent', 'confirmed', 'unavailable']),

      // Inventory summary
      supabase
        .from('products')
        .select(`
          id,
          product_variants (
            id,
            inventory (quantity, reserved, reorder_point)
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true),

      // Today's stats
      supabase
        .from('orders')
        .select('total, status')
        .eq('user_id', user.id)
        .gte('order_date', todayISO),
    ]);

    // Get supplier names separately
    const supplierIds = [...new Set(supplierOrdersResult.data?.map((so: { supplier_id: string }) => so.supplier_id) || [])];
    const supplierNames: Record<string, string> = {};

    if (supplierIds.length > 0) {
      const { data: suppliers } = await getTable(supabase, 'suppliers')
        .select('id, name')
        .in('id', supplierIds);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      suppliers?.forEach((s: any) => {
        supplierNames[s.id] = s.name;
      });
    }

    // Process order pipeline
    const ordersByStatus: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderPipelineResult.data?.forEach((order: any) => {
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;
    });

    const pipeline = {
      new: ordersByStatus['pending'] || 0,
      awaiting_supplier: 0,
      confirmed: ordersByStatus['confirmed'] || 0,
      ready_to_ship: ordersByStatus['ready_to_ship'] || 0,
      shipped_today: 0,
      delivered_today: 0,
    };

    // Process supplier orders
    const supplierStatusCounts: Record<string, Record<string, number | string>> = {};
    const slowResponses: { id: string; order_id: string; sent_at: string; supplier_name: string }[] = [];
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supplierOrdersResult.data?.forEach((so: any) => {
      const supplierName = supplierNames[so.supplier_id] || 'Unknown';

      if (!supplierStatusCounts[so.supplier_id]) {
        supplierStatusCounts[so.supplier_id] = { name: supplierName };
      }

      supplierStatusCounts[so.supplier_id][so.status] =
        ((supplierStatusCounts[so.supplier_id][so.status] as number) || 0) + 1;

      if (so.status === 'sent' || so.status === 'pending_send') {
        pipeline.awaiting_supplier++;
      }

      // Check for slow responses
      if (so.status === 'sent' && so.sent_at) {
        const sentDate = new Date(so.sent_at);
        if (sentDate < twoHoursAgo) {
          slowResponses.push({
            id: so.id,
            order_id: so.order_id,
            sent_at: so.sent_at,
            supplier_name: supplierName,
          });
        }
      }
    });

    // Process inventory
    let totalProducts = 0;
    let totalUnits = 0;
    let availableUnits = 0;
    let reservedUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    inventorySummaryResult.data?.forEach((product: any) => {
      totalProducts++;
      product.product_variants?.forEach((variant: { inventory: { quantity: number; reserved: number; reorder_point: number }[] }) => {
        variant.inventory?.forEach((inv) => {
          totalUnits += inv.quantity;
          availableUnits += Math.max(0, inv.quantity - inv.reserved);
          reservedUnits += inv.reserved;
          if (inv.quantity === 0) outOfStockCount++;
          else if (inv.quantity <= inv.reorder_point) lowStockCount++;
        });
      });
    });

    // Process today's stats
    let todayRevenue = 0;
    let todayOrderCount = 0;
    let shippedToday = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    todayStatsResult.data?.forEach((order: any) => {
      todayOrderCount++;
      todayRevenue += order.total || 0;
      if (order.status === 'shipped') shippedToday++;
    });

    pipeline.shipped_today = shippedToday;

    // Process alerts
    const alerts: { type: string; message: string; count: number; priority: 'high' | 'medium' | 'low' }[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unavailableCount = supplierOrdersResult.data?.filter((so: any) => so.status === 'unavailable').length || 0;
    if (unavailableCount > 0) {
      alerts.push({
        type: 'unavailable',
        message: `${unavailableCount} orders unavailable - need decision`,
        count: unavailableCount,
        priority: 'high',
      });
    }

    if (slowResponses.length > 0) {
      alerts.push({
        type: 'slow_response',
        message: `${slowResponses.length} orders waiting >2 hours for supplier`,
        count: slowResponses.length,
        priority: 'medium',
      });
    }

    if (lowStockCount > 0) {
      alerts.push({
        type: 'low_stock',
        message: `${lowStockCount} products running low on stock`,
        count: lowStockCount,
        priority: 'low',
      });
    }

    // Format supplier summary
    const supplierSummary = Object.entries(supplierStatusCounts).map(([supplierId, data]) => ({
      supplier_id: supplierId,
      supplier_name: data.name as string,
      pending_count: ((data.pending_send as number) || 0) + ((data.sent as number) || 0),
      confirmed_count: (data.confirmed as number) || 0,
      unavailable_count: (data.unavailable as number) || 0,
    }));

    return NextResponse.json({
      pipeline,
      inventory: {
        total_products: totalProducts,
        total_units: totalUnits,
        available_units: availableUnits,
        reserved_units: reservedUnits,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
      },
      suppliers: supplierSummary,
      today: {
        orders: todayOrderCount,
        revenue: todayRevenue,
        shipped: shippedToday,
        average_order_value: todayOrderCount > 0 ? todayRevenue / todayOrderCount : 0,
      },
      alerts,
      slow_responses: slowResponses.slice(0, 5), // Top 5 slowest
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Dashboard operations error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
