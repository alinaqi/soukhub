import type { Order, MarketplaceConnection } from '@/types/supabase';

interface InsightsProps {
  orders: Order[];
  connections: MarketplaceConnection[];
  stats: {
    totalOrders: number;
    pendingOrders: number;
    totalRevenue: number;
    totalProducts: number;
  };
}

interface Insight {
  type: 'success' | 'warning' | 'info' | 'tip';
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

function generateInsights(
  orders: Order[],
  connections: MarketplaceConnection[],
  stats: InsightsProps['stats']
): Insight[] {
  const insights: Insight[] = [];

  // Calculate metrics by marketplace
  const byMarketplace = orders.reduce(
    (acc, order) => {
      const mp = order.marketplace;
      if (!acc[mp]) {
        acc[mp] = { count: 0, revenue: 0, pending: 0, returned: 0 };
      }
      acc[mp].count++;
      acc[mp].revenue += order.total || 0;
      if (['pending', 'confirmed', 'processing'].includes(order.status)) {
        acc[mp].pending++;
      }
      if (['returned', 'refunded'].includes(order.status)) {
        acc[mp].returned++;
      }
      return acc;
    },
    {} as Record<string, { count: number; revenue: number; pending: number; returned: number }>
  );

  // Find top marketplace
  const topMarketplace = Object.entries(byMarketplace).sort(
    (a, b) => b[1].revenue - a[1].revenue
  )[0];

  if (topMarketplace) {
    const [name, data] = topMarketplace;
    const percentage = ((data.revenue / stats.totalRevenue) * 100).toFixed(0);
    insights.push({
      type: 'success',
      icon: '🏆',
      title: `${name.charAt(0).toUpperCase() + name.slice(1)} is your top channel`,
      description: `${percentage}% of your revenue (AED ${data.revenue.toLocaleString()}) comes from ${name}. Consider expanding your presence there.`,
    });
  }

  // Pending orders alert
  if (stats.pendingOrders > 10) {
    insights.push({
      type: 'warning',
      icon: '⚠️',
      title: `${stats.pendingOrders} orders need attention`,
      description:
        'You have pending orders that may need processing. Review them to ensure timely fulfillment.',
      action: {
        label: 'View pending orders',
        href: '/orders?status=pending',
      },
    });
  }

  // Return rate analysis
  const totalReturns = Object.values(byMarketplace).reduce(
    (sum, mp) => sum + mp.returned,
    0
  );
  const returnRate = (totalReturns / stats.totalOrders) * 100;

  if (returnRate > 5) {
    insights.push({
      type: 'warning',
      icon: '📦',
      title: `Return rate is ${returnRate.toFixed(1)}%`,
      description:
        'Your return rate is above average. Review product descriptions and quality to reduce returns.',
    });
  } else if (returnRate < 2 && stats.totalOrders > 50) {
    insights.push({
      type: 'success',
      icon: '✨',
      title: 'Excellent return rate!',
      description: `Only ${returnRate.toFixed(1)}% returns - your customers are satisfied with their purchases.`,
    });
  }

  // Revenue milestone
  if (stats.totalRevenue > 100000) {
    insights.push({
      type: 'success',
      icon: '🎉',
      title: 'Revenue milestone reached!',
      description: `You've exceeded AED 100,000 in total revenue. Great job growing your business!`,
    });
  }

  // Marketplace diversification
  const activeMarketplaces = Object.keys(byMarketplace).length;
  if (activeMarketplaces === 1) {
    insights.push({
      type: 'tip',
      icon: '💡',
      title: 'Consider diversifying',
      description:
        'You\'re only selling on one marketplace. Expanding to other channels can increase your reach and reduce risk.',
      action: {
        label: 'Connect marketplace',
        href: '/settings/marketplaces',
      },
    });
  } else if (activeMarketplaces >= 3) {
    insights.push({
      type: 'info',
      icon: '🌐',
      title: `Selling on ${activeMarketplaces} marketplaces`,
      description:
        'Great multi-channel strategy! Keep monitoring performance across all platforms.',
    });
  }

  // Average order value
  const avgOrderValue = stats.totalRevenue / stats.totalOrders;
  if (avgOrderValue > 1000) {
    insights.push({
      type: 'info',
      icon: '📈',
      title: `High average order value`,
      description: `Your AOV is AED ${avgOrderValue.toFixed(0)} - you're attracting premium customers.`,
    });
  }

  // Products suggestion
  if (stats.totalProducts < 5 && stats.totalOrders > 100) {
    insights.push({
      type: 'tip',
      icon: '🏷️',
      title: 'Add more products to catalog',
      description:
        'Create products to better track inventory and margins across marketplaces.',
      action: {
        label: 'Add products',
        href: '/products',
      },
    });
  }

  return insights.slice(0, 4); // Limit to 4 insights
}

export function Insights({ orders, connections, stats }: InsightsProps) {
  const insights = generateInsights(orders, connections, stats);

  if (insights.length === 0) {
    return null;
  }

  const typeStyles = {
    success: 'border-l-green-500 bg-green-500/5',
    warning: 'border-l-yellow-500 bg-yellow-500/5',
    info: 'border-l-blue-500 bg-blue-500/5',
    tip: 'border-l-purple-500 bg-purple-500/5',
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <span>💡</span>
          AI Insights & Suggestions
        </h2>
      </div>
      <div className="divide-y divide-border">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`p-4 border-l-4 ${typeStyles[insight.type]}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl">{insight.icon}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{insight.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {insight.description}
                </p>
                {insight.action && (
                  <a
                    href={insight.action.href}
                    className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    {insight.action.label}
                    <span>→</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
