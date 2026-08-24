/**
 * Sales Analytics
 *
 * Analyzes sales data to identify:
 * - Hot products (high velocity, increasing trend)
 * - Slow movers (declining sales)
 * - Revenue trends
 * - Seasonal patterns
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ProductTrend {
  product_id?: string;
  product_name: string;
  brand: string;
  sales_7d: number;
  sales_30d: number;
  revenue_7d: number;
  revenue_30d: number;
  velocity: number; // units per day (7d avg)
  velocity_change: number; // % change vs previous 7d
  trend: 'hot' | 'rising' | 'stable' | 'declining' | 'dead';
}

export interface SalesSummary {
  period: '7d' | '30d' | '90d';
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  orders_trend: number; // % change vs previous period
  revenue_trend: number; // % change vs previous period
  top_brands: Array<{ brand: string; revenue: number; orders: number }>;
  top_products: Array<{ name: string; revenue: number; orders: number }>;
}

export interface DailySales {
  date: string;
  orders: number;
  revenue: number;
}

/**
 * Get sales summary for a period
 */
export async function getSalesSummary(
  supabase: SupabaseClient,
  userId: string,
  period: '7d' | '30d' | '90d' = '7d'
): Promise<SalesSummary> {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevPeriodStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  // Get current period orders
  const { data: currentOrders } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      created_at,
      order_items (product_name, quantity, unit_price)
    `)
    .eq('user_id', userId)
    .gte('created_at', periodStart.toISOString())
    .not('status', 'eq', 'cancelled');

  // Get previous period orders
  const { data: prevOrders } = await supabase
    .from('orders')
    .select('id, total')
    .eq('user_id', userId)
    .gte('created_at', prevPeriodStart.toISOString())
    .lt('created_at', periodStart.toISOString())
    .not('status', 'eq', 'cancelled');

  const currentTotalOrders = currentOrders?.length || 0;
  const currentTotalRevenue = currentOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const prevTotalOrders = prevOrders?.length || 0;
  const prevTotalRevenue = prevOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

  // Calculate trends
  const ordersTrend = prevTotalOrders > 0
    ? ((currentTotalOrders - prevTotalOrders) / prevTotalOrders) * 100
    : 0;
  const revenueTrend = prevTotalRevenue > 0
    ? ((currentTotalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
    : 0;

  // Aggregate by brand and product
  const brandStats = new Map<string, { revenue: number; orders: number }>();
  const productStats = new Map<string, { revenue: number; orders: number }>();

  for (const order of currentOrders || []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (order as any).order_items || []) {
      const productName = item.product_name || 'Unknown';
      const brand = productName.split(' ')[0]; // First word as brand
      const itemRevenue = (item.unit_price || 0) * (item.quantity || 1);

      // Brand stats
      const brandStat = brandStats.get(brand) || { revenue: 0, orders: 0 };
      brandStat.revenue += itemRevenue;
      brandStat.orders += 1;
      brandStats.set(brand, brandStat);

      // Product stats
      const productStat = productStats.get(productName) || { revenue: 0, orders: 0 };
      productStat.revenue += itemRevenue;
      productStat.orders += 1;
      productStats.set(productName, productStat);
    }
  }

  // Sort and take top
  const topBrands = Array.from(brandStats.entries())
    .map(([brand, stats]) => ({ brand, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const topProducts = Array.from(productStats.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    period,
    total_orders: currentTotalOrders,
    total_revenue: currentTotalRevenue,
    avg_order_value: currentTotalOrders > 0 ? currentTotalRevenue / currentTotalOrders : 0,
    orders_trend: Math.round(ordersTrend * 10) / 10,
    revenue_trend: Math.round(revenueTrend * 10) / 10,
    top_brands: topBrands,
    top_products: topProducts,
  };
}

/**
 * Get product trends (hot products, slow movers)
 */
export async function getProductTrends(
  supabase: SupabaseClient,
  userId: string
): Promise<{ hot: ProductTrend[]; slow: ProductTrend[] }> {
  const now = new Date();
  const days7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const days14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get orders with items
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      created_at,
      order_items (product_name, quantity, unit_price)
    `)
    .eq('user_id', userId)
    .gte('created_at', days30.toISOString())
    .not('status', 'eq', 'cancelled');

  if (!orders || orders.length === 0) {
    return { hot: [], slow: [] };
  }

  // Aggregate product stats
  const productStats = new Map<string, {
    sales_7d: number;
    sales_prev_7d: number;
    sales_30d: number;
    revenue_7d: number;
    revenue_30d: number;
  }>();

  for (const order of orders) {
    const orderDate = new Date(order.created_at);
    const is7d = orderDate >= days7;
    const isPrev7d = orderDate >= days14 && orderDate < days7;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (order as any).order_items || []) {
      const productName = item.product_name || 'Unknown';
      const quantity = item.quantity || 1;
      const revenue = (item.unit_price || 0) * quantity;

      const stat = productStats.get(productName) || {
        sales_7d: 0,
        sales_prev_7d: 0,
        sales_30d: 0,
        revenue_7d: 0,
        revenue_30d: 0,
      };

      if (is7d) {
        stat.sales_7d += quantity;
        stat.revenue_7d += revenue;
      } else if (isPrev7d) {
        stat.sales_prev_7d += quantity;
      }
      stat.sales_30d += quantity;
      stat.revenue_30d += revenue;

      productStats.set(productName, stat);
    }
  }

  // Calculate trends
  const trends: ProductTrend[] = [];

  for (const [name, stats] of productStats.entries()) {
    const brand = name.split(' ')[0];
    const velocity = stats.sales_7d / 7;
    const prevVelocity = stats.sales_prev_7d / 7;
    const velocityChange = prevVelocity > 0
      ? ((velocity - prevVelocity) / prevVelocity) * 100
      : velocity > 0 ? 100 : 0;

    let trend: ProductTrend['trend'];
    if (stats.sales_30d === 0) {
      trend = 'dead';
    } else if (velocity >= 1 && velocityChange > 20) {
      trend = 'hot';
    } else if (velocityChange > 10) {
      trend = 'rising';
    } else if (velocityChange < -20) {
      trend = 'declining';
    } else {
      trend = 'stable';
    }

    trends.push({
      product_name: name,
      brand,
      sales_7d: stats.sales_7d,
      sales_30d: stats.sales_30d,
      revenue_7d: stats.revenue_7d,
      revenue_30d: stats.revenue_30d,
      velocity: Math.round(velocity * 10) / 10,
      velocity_change: Math.round(velocityChange),
      trend,
    });
  }

  // Sort and categorize
  const hot = trends
    .filter((t) => t.trend === 'hot' || t.trend === 'rising')
    .sort((a, b) => b.velocity - a.velocity)
    .slice(0, 10);

  const slow = trends
    .filter((t) => t.trend === 'declining' || t.trend === 'dead')
    .sort((a, b) => a.velocity_change - b.velocity_change)
    .slice(0, 10);

  return { hot, slow };
}

/**
 * Get daily sales for chart
 */
export async function getDailySales(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<DailySales[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: orders } = await supabase
    .from('orders')
    .select('total, created_at')
    .eq('user_id', userId)
    .gte('created_at', startDate.toISOString())
    .not('status', 'eq', 'cancelled');

  // Group by date
  const dailyMap = new Map<string, { orders: number; revenue: number }>();

  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMap.set(dateStr, { orders: 0, revenue: 0 });
  }

  // Aggregate
  for (const order of orders || []) {
    const dateStr = order.created_at.split('T')[0];
    const stat = dailyMap.get(dateStr) || { orders: 0, revenue: 0 };
    stat.orders += 1;
    stat.revenue += order.total || 0;
    dailyMap.set(dateStr, stat);
  }

  // Convert to array and sort
  return Array.from(dailyMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
