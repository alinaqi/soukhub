import { SupabaseClient } from '@supabase/supabase-js';

export interface ActionableInsight {
  id: string;
  category: 'workflow' | 'inventory' | 'sales' | 'customers' | 'suppliers' | 'market';
  type: 'critical' | 'warning' | 'opportunity' | 'success';
  title: string;
  description: string;
  metric?: string;
  action?: string;
  impact?: string;
  priority: number; // 1-5, 5 being highest
}

export interface WorkflowBottleneck {
  stage: string;
  avgHours: number;
  orderCount: number;
  slowestOrders: Array<{ orderId: string; hours: number }>;
  recommendation: string;
}

export interface ProductPerformance {
  name: string;
  sku?: string;
  unitsSold: number;
  revenue: number;
  profit?: number;
  profitMargin?: number;
  velocity: number; // units per day
  trend: 'hot' | 'rising' | 'stable' | 'declining' | 'dead';
  recommendation?: string;
}

// Analyze workflow bottlenecks by tracking time between status changes
export async function analyzeWorkflowBottlenecks(
  supabase: SupabaseClient,
  userId: string
): Promise<WorkflowBottleneck[]> {
  // Get orders with their status history from activity log
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, created_at, order_date')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (!orders || orders.length === 0) {
    return [];
  }

  // Get activity logs for order status changes
  const { data: activities } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .eq('activity_type', 'order_status_changed')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Define workflow stages
  const stages = [
    { from: 'pending', to: 'confirmed', name: 'Order Confirmation' },
    { from: 'confirmed', to: 'processing', name: 'Processing Start' },
    { from: 'processing', to: 'ready_to_ship', name: 'Packing' },
    { from: 'ready_to_ship', to: 'shipped', name: 'Shipping Handoff' },
    { from: 'shipped', to: 'delivered', name: 'Delivery' },
  ];

  // Calculate average time for each stage based on current status distribution
  const stageMetrics: WorkflowBottleneck[] = [];

  // Analyze pending orders (time since creation)
  const pendingOrders = orders.filter(o => o.status === 'pending');
  if (pendingOrders.length > 0) {
    const pendingHours = pendingOrders.map(o => {
      const hours = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
      return { orderId: o.id, hours };
    });
    const avgPendingHours = pendingHours.reduce((sum, o) => sum + o.hours, 0) / pendingHours.length;

    stageMetrics.push({
      stage: 'Pending → Confirmed',
      avgHours: Math.round(avgPendingHours * 10) / 10,
      orderCount: pendingOrders.length,
      slowestOrders: pendingHours.sort((a, b) => b.hours - a.hours).slice(0, 3),
      recommendation: avgPendingHours > 24
        ? 'Orders are sitting in pending for too long. Consider automating order confirmation.'
        : avgPendingHours > 4
        ? 'Review pending orders more frequently to speed up processing.'
        : 'Order confirmation is on track.',
    });
  }

  // Analyze processing orders
  const processingOrders = orders.filter(o => o.status === 'processing' || o.status === 'confirmed');
  if (processingOrders.length > 0) {
    const processingHours = processingOrders.map(o => {
      const hours = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
      return { orderId: o.id, hours };
    });
    const avgProcessingHours = processingHours.reduce((sum, o) => sum + o.hours, 0) / processingHours.length;

    stageMetrics.push({
      stage: 'Processing & Packing',
      avgHours: Math.round(avgProcessingHours * 10) / 10,
      orderCount: processingOrders.length,
      slowestOrders: processingHours.sort((a, b) => b.hours - a.hours).slice(0, 3),
      recommendation: avgProcessingHours > 48
        ? 'Processing is a major bottleneck. Consider batch processing or hiring help.'
        : avgProcessingHours > 24
        ? 'Streamline your packing workflow to reduce processing time.'
        : 'Processing time is acceptable.',
    });
  }

  // Analyze ready to ship orders
  const readyOrders = orders.filter(o => o.status === 'ready_to_ship');
  if (readyOrders.length > 0) {
    const readyHours = readyOrders.map(o => {
      const hours = (Date.now() - new Date(o.created_at).getTime()) / (1000 * 60 * 60);
      return { orderId: o.id, hours };
    });
    const avgReadyHours = readyHours.reduce((sum, o) => sum + o.hours, 0) / readyHours.length;

    stageMetrics.push({
      stage: 'Awaiting Pickup',
      avgHours: Math.round(avgReadyHours * 10) / 10,
      orderCount: readyOrders.length,
      slowestOrders: readyHours.sort((a, b) => b.hours - a.hours).slice(0, 3),
      recommendation: avgReadyHours > 24
        ? 'Packages are ready but not being picked up. Schedule more frequent courier pickups.'
        : 'Pickup timing is good.',
    });
  }

  return stageMetrics.sort((a, b) => b.avgHours - a.avgHours);
}

// Analyze product performance with profitability
export async function analyzeProductPerformance(
  supabase: SupabaseClient,
  userId: string,
  days: number = 30
): Promise<{
  topPerformers: ProductPerformance[];
  underperformers: ProductPerformance[];
  opportunities: ProductPerformance[];
}> {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Get order items with product info
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      order_date,
      total,
      order_items (
        product_name,
        quantity,
        unit_price
      )
    `)
    .eq('user_id', userId)
    .gte('order_date', startDate);

  if (!orders) {
    return { topPerformers: [], underperformers: [], opportunities: [] };
  }

  // Get product costs if available
  const { data: products } = await supabase
    .from('products')
    .select('name, base_price, cost_price')
    .eq('user_id', userId);

  const productCosts = new Map<string, number>();
  products?.forEach(p => {
    if (p.cost_price) {
      productCosts.set(p.name.toLowerCase(), p.cost_price);
    }
  });

  // Aggregate product data
  const productMap = new Map<string, {
    name: string;
    units: number;
    revenue: number;
    cost: number;
    orders: number;
    recentUnits: number; // last 7 days
  }>();

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const order of orders) {
    const orderDate = new Date(order.order_date);
    const items = (order as any).order_items || [];

    for (const item of items) {
      const key = item.product_name?.toLowerCase().trim() || 'unknown';
      const existing = productMap.get(key) || {
        name: item.product_name || 'Unknown',
        units: 0,
        revenue: 0,
        cost: 0,
        orders: 0,
        recentUnits: 0,
      };

      const qty = item.quantity || 1;
      const price = item.unit_price || 0;
      const cost = productCosts.get(key) || 0;

      existing.units += qty;
      existing.revenue += price * qty;
      existing.cost += cost * qty;
      existing.orders += 1;

      if (orderDate >= sevenDaysAgo) {
        existing.recentUnits += qty;
      }

      productMap.set(key, existing);
    }
  }

  // Calculate metrics and classify products
  const allProducts: ProductPerformance[] = [];

  for (const [_, data] of productMap) {
    const profit = data.revenue - data.cost;
    const profitMargin = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
    const velocity = data.recentUnits / 7; // units per day in last 7 days
    const avgVelocity = data.units / days;

    let trend: ProductPerformance['trend'] = 'stable';
    if (velocity > avgVelocity * 1.5 && velocity >= 1) trend = 'hot';
    else if (velocity > avgVelocity * 1.2) trend = 'rising';
    else if (velocity < avgVelocity * 0.5 && data.units > 5) trend = 'declining';
    else if (velocity === 0 && data.recentUnits === 0) trend = 'dead';

    allProducts.push({
      name: data.name,
      unitsSold: data.units,
      revenue: Math.round(data.revenue * 100) / 100,
      profit: data.cost > 0 ? Math.round(profit * 100) / 100 : undefined,
      profitMargin: data.cost > 0 ? Math.round(profitMargin * 10) / 10 : undefined,
      velocity: Math.round(velocity * 100) / 100,
      trend,
      recommendation: generateProductRecommendation(data.name, trend, velocity, profitMargin),
    });
  }

  // Sort and categorize
  const topPerformers = allProducts
    .filter(p => p.trend === 'hot' || p.trend === 'rising')
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const underperformers = allProducts
    .filter(p => p.trend === 'declining' || p.trend === 'dead')
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 10);

  // Opportunities: good sales but low profit margin, or declining products that could be revived
  const opportunities = allProducts
    .filter(p =>
      (p.profitMargin !== undefined && p.profitMargin < 20 && p.unitsSold > 5) ||
      (p.trend === 'declining' && p.unitsSold > 10)
    )
    .slice(0, 10);

  return { topPerformers, underperformers, opportunities };
}

function generateProductRecommendation(
  name: string,
  trend: string,
  velocity: number,
  profitMargin?: number
): string {
  if (trend === 'hot') {
    if (profitMargin !== undefined && profitMargin < 15) {
      return 'High demand but low margin. Consider negotiating better supplier prices.';
    }
    return 'Keep stock levels high. Consider bundling or featuring this product.';
  }
  if (trend === 'rising') {
    return 'Growing demand. Ensure adequate inventory and consider promotion.';
  }
  if (trend === 'declining') {
    return 'Declining sales. Consider discount promotion or bundling with popular items.';
  }
  if (trend === 'dead') {
    return 'No recent sales. Evaluate if product should be discontinued or needs marketing push.';
  }
  return '';
}

// Generate comprehensive actionable insights
export async function generateActionableInsights(
  supabase: SupabaseClient,
  userId: string
): Promise<ActionableInsight[]> {
  const insights: ActionableInsight[] = [];

  // Get basic stats
  const { data: orders } = await supabase
    .from('orders')
    .select('id, status, total, marketplace, created_at, order_date')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  if (!orders || orders.length === 0) {
    insights.push({
      id: 'no-orders',
      category: 'sales',
      type: 'warning',
      title: 'No Recent Orders',
      description: 'You have no orders in the last 30 days.',
      action: 'Check your marketplace listings and consider running promotions.',
      priority: 5,
    });
    return insights;
  }

  // Workflow bottleneck insights
  const bottlenecks = await analyzeWorkflowBottlenecks(supabase, userId);
  for (const bottleneck of bottlenecks) {
    if (bottleneck.avgHours > 24) {
      insights.push({
        id: `bottleneck-${bottleneck.stage.toLowerCase().replace(/\s+/g, '-')}`,
        category: 'workflow',
        type: bottleneck.avgHours > 48 ? 'critical' : 'warning',
        title: `${bottleneck.stage} Bottleneck`,
        description: `Orders spend an average of ${bottleneck.avgHours} hours in this stage.`,
        metric: `${bottleneck.orderCount} orders affected`,
        action: bottleneck.recommendation,
        impact: bottleneck.avgHours > 48
          ? 'High risk of customer complaints and cancellations'
          : 'May impact customer satisfaction',
        priority: bottleneck.avgHours > 48 ? 5 : 4,
      });
    }
  }

  // Inventory insights
  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      quantity,
      reserved,
      reorder_point,
      variant:product_variants (
        sku,
        product:products (name)
      )
    `)
    .eq('user_id', userId);

  if (inventory) {
    const lowStock = inventory.filter(i => i.quantity <= (i.reorder_point || 5));
    const outOfStock = inventory.filter(i => i.quantity === 0);

    if (outOfStock.length > 0) {
      insights.push({
        id: 'out-of-stock',
        category: 'inventory',
        type: 'critical',
        title: 'Out of Stock Products',
        description: `${outOfStock.length} products are out of stock and may be losing sales.`,
        action: 'Reorder stock immediately or deactivate listings to avoid negative reviews.',
        impact: 'Lost sales and potential negative customer experience',
        priority: 5,
      });
    }

    if (lowStock.length > 5) {
      insights.push({
        id: 'low-stock-many',
        category: 'inventory',
        type: 'warning',
        title: 'Multiple Low Stock Items',
        description: `${lowStock.length} products are running low on inventory.`,
        action: 'Review reorder points and place bulk orders to suppliers.',
        priority: 4,
      });
    }
  }

  // Return rate analysis
  const returnedOrders = orders.filter(o => o.status === 'returned');
  const returnRate = (returnedOrders.length / orders.length) * 100;

  if (returnRate > 10) {
    insights.push({
      id: 'high-return-rate',
      category: 'sales',
      type: 'critical',
      title: 'High Return Rate',
      description: `Your return rate is ${returnRate.toFixed(1)}% - significantly above average.`,
      metric: `${returnedOrders.length} returns in 30 days`,
      action: 'Analyze return reasons. Common issues: product quality, description accuracy, packaging.',
      impact: 'Returns cost 2-3x the shipping cost and hurt marketplace rankings.',
      priority: 5,
    });
  } else if (returnRate > 5) {
    insights.push({
      id: 'elevated-return-rate',
      category: 'sales',
      type: 'warning',
      title: 'Elevated Return Rate',
      description: `Return rate of ${returnRate.toFixed(1)}% is above the 5% target.`,
      action: 'Review product listings for accuracy and consider improving packaging.',
      priority: 3,
    });
  }

  // Marketplace concentration risk
  const marketplaceCounts = new Map<string, number>();
  orders.forEach(o => {
    const mp = o.marketplace || 'unknown';
    marketplaceCounts.set(mp, (marketplaceCounts.get(mp) || 0) + 1);
  });

  const sortedMarketplaces = Array.from(marketplaceCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  if (sortedMarketplaces.length === 1 && orders.length > 20) {
    insights.push({
      id: 'single-marketplace',
      category: 'sales',
      type: 'opportunity',
      title: 'Marketplace Diversification Opportunity',
      description: `All your sales come from ${sortedMarketplaces[0][0]}. Diversifying reduces risk.`,
      action: 'Consider listing on Noon, Amazon.ae, or Cartlow to expand reach.',
      impact: 'Reduces dependency risk and increases customer reach.',
      priority: 3,
    });
  } else if (sortedMarketplaces.length > 1) {
    const topMarketplace = sortedMarketplaces[0];
    const concentration = (topMarketplace[1] / orders.length) * 100;
    if (concentration > 80) {
      insights.push({
        id: 'marketplace-concentration',
        category: 'sales',
        type: 'warning',
        title: 'High Marketplace Concentration',
        description: `${concentration.toFixed(0)}% of sales from ${topMarketplace[0]}. Consider diversifying.`,
        action: 'Increase inventory and marketing on other platforms.',
        priority: 2,
      });
    }
  }

  // Revenue trends
  const thisWeek = orders.filter(o =>
    new Date(o.order_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const lastWeek = orders.filter(o => {
    const date = new Date(o.order_date);
    return date >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) &&
           date < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  });

  const thisWeekRevenue = thisWeek.reduce((sum, o) => sum + (o.total || 0), 0);
  const lastWeekRevenue = lastWeek.reduce((sum, o) => sum + (o.total || 0), 0);

  if (lastWeekRevenue > 0) {
    const change = ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100;

    if (change < -20) {
      insights.push({
        id: 'revenue-decline',
        category: 'sales',
        type: 'critical',
        title: 'Significant Revenue Decline',
        description: `Revenue dropped ${Math.abs(change).toFixed(0)}% compared to last week.`,
        metric: `AED ${thisWeekRevenue.toLocaleString()} vs AED ${lastWeekRevenue.toLocaleString()}`,
        action: 'Check listing visibility, stock levels, and competitor pricing.',
        priority: 5,
      });
    } else if (change > 30) {
      insights.push({
        id: 'revenue-growth',
        category: 'sales',
        type: 'success',
        title: 'Strong Revenue Growth',
        description: `Revenue increased ${change.toFixed(0)}% compared to last week!`,
        metric: `AED ${thisWeekRevenue.toLocaleString()} this week`,
        action: 'Ensure inventory can sustain this growth. Consider scaling marketing.',
        priority: 2,
      });
    }
  }

  // Supplier performance (if data available)
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, avg_response_minutes, avg_fulfillment_hours')
    .eq('user_id', userId);

  if (suppliers && suppliers.length > 0) {
    const slowSuppliers = suppliers.filter(s =>
      (s.avg_response_minutes && s.avg_response_minutes > 120) ||
      (s.avg_fulfillment_hours && s.avg_fulfillment_hours > 48)
    );

    if (slowSuppliers.length > 0) {
      insights.push({
        id: 'slow-suppliers',
        category: 'suppliers',
        type: 'warning',
        title: 'Slow Supplier Response',
        description: `${slowSuppliers.length} supplier(s) have slow response or fulfillment times.`,
        action: 'Contact suppliers to improve SLAs or consider alternatives.',
        impact: 'Slow suppliers delay your fulfillment and hurt customer satisfaction.',
        priority: 3,
      });
    }
  }

  // Customer insights
  const { data: customers } = await supabase
    .from('customers')
    .select('id, total_orders, total_spent, is_vip')
    .eq('user_id', userId);

  if (customers && customers.length > 0) {
    const repeatCustomers = customers.filter(c => c.total_orders > 1);
    const repeatRate = (repeatCustomers.length / customers.length) * 100;

    if (repeatRate < 10 && customers.length > 20) {
      insights.push({
        id: 'low-repeat-rate',
        category: 'customers',
        type: 'opportunity',
        title: 'Low Repeat Customer Rate',
        description: `Only ${repeatRate.toFixed(1)}% of customers have ordered more than once.`,
        action: 'Implement loyalty program or post-purchase email campaigns.',
        impact: 'Repeat customers cost 5x less to acquire and spend 67% more.',
        priority: 3,
      });
    }

    const vipCustomers = customers.filter(c => c.is_vip);
    if (vipCustomers.length > 0) {
      const vipRevenue = vipCustomers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
      insights.push({
        id: 'vip-value',
        category: 'customers',
        type: 'success',
        title: 'VIP Customer Value',
        description: `Your ${vipCustomers.length} VIP customers have spent AED ${vipRevenue.toLocaleString()}.`,
        action: 'Consider exclusive offers or early access for VIPs to maintain loyalty.',
        priority: 2,
      });
    }
  }

  // Sort by priority
  return insights.sort((a, b) => b.priority - a.priority);
}

// Fetch UAE market trends (placeholder - would need external API)
export interface MarketTrend {
  category: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  source: string;
}

export async function getUAEMarketTrends(): Promise<MarketTrend[]> {
  // In production, this would fetch from external APIs or web scraping
  // For now, return general UAE e-commerce trends
  return [
    {
      category: 'Electronics',
      trend: 'up',
      description: 'Mobile accessories and smart home devices seeing 25% YoY growth in UAE',
      source: 'Industry Report',
    },
    {
      category: 'Fashion',
      trend: 'stable',
      description: 'Modest fashion and athleisure continue strong in GCC market',
      source: 'Market Analysis',
    },
    {
      category: 'Health & Beauty',
      trend: 'up',
      description: 'Skincare and wellness products trending, especially Korean beauty',
      source: 'Consumer Trends',
    },
    {
      category: 'Home & Living',
      trend: 'up',
      description: 'Home organization and kitchen gadgets popular post-pandemic',
      source: 'E-commerce Data',
    },
  ];
}
