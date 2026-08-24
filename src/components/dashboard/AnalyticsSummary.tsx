import type { Order } from '@/types/supabase';

interface AnalyticsSummaryProps {
  orders: Order[];
}

interface MarketplaceData {
  name: string;
  orders: number;
  revenue: number;
  delivered: number;
  returned: number;
  color: string;
}

export function AnalyticsSummary({ orders }: AnalyticsSummaryProps) {
  // Calculate stats by marketplace
  const marketplaceColors: Record<string, string> = {
    amazon: '#FF9900',
    cartlow: '#00B67A',
    revibe: '#6366F1',
    noon: '#FEEE00',
    other: '#6B7280',
  };

  const marketplaceData = orders.reduce(
    (acc, order) => {
      const mp = order.marketplace || 'other';
      if (!acc[mp]) {
        acc[mp] = {
          name: mp.charAt(0).toUpperCase() + mp.slice(1),
          orders: 0,
          revenue: 0,
          delivered: 0,
          returned: 0,
          color: marketplaceColors[mp] || marketplaceColors.other,
        };
      }
      acc[mp].orders++;
      acc[mp].revenue += order.total || 0;
      if (order.status === 'delivered') acc[mp].delivered++;
      if (order.status && ['returned', 'refunded'].includes(order.status)) acc[mp].returned++;
      return acc;
    },
    {} as Record<string, MarketplaceData>
  );

  const sortedMarketplaces = Object.values(marketplaceData).sort(
    (a, b) => b.revenue - a.revenue
  );

  const totalRevenue = sortedMarketplaces.reduce((sum, mp) => sum + mp.revenue, 0);

  // Calculate status breakdown
  const statusCounts = orders.reduce(
    (acc, order) => {
      const status = order.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusLabels: Record<string, { label: string; color: string }> = {
    delivered: { label: 'Delivered', color: 'bg-green-500' },
    shipped: { label: 'Shipped', color: 'bg-blue-500' },
    processing: { label: 'Processing', color: 'bg-yellow-500' },
    pending: { label: 'Pending', color: 'bg-gray-400' },
    confirmed: { label: 'Confirmed', color: 'bg-cyan-500' },
    cancelled: { label: 'Cancelled', color: 'bg-red-400' },
    returned: { label: 'Returned', color: 'bg-orange-500' },
    refunded: { label: 'Refunded', color: 'bg-pink-500' },
  };

  const totalOrders = orders.length;

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <span>📊</span>
          Performance Overview
        </h2>
      </div>
      <div className="p-4 space-y-6">
        {/* Revenue by Marketplace */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Revenue by Marketplace
          </h3>
          <div className="space-y-3">
            {sortedMarketplaces.map((mp) => {
              const percentage = totalRevenue > 0 ? (mp.revenue / totalRevenue) * 100 : 0;
              return (
                <div key={mp.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: mp.color }}
                      />
                      <span className="font-medium">{mp.name}</span>
                    </div>
                    <span className="text-muted-foreground">
                      AED {mp.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: mp.color,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{mp.orders} orders</span>
                    <span>{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fulfillment Rate */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Order Status Breakdown
          </h3>
          <div className="flex h-4 rounded-full overflow-hidden bg-muted">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const info = statusLabels[status] || {
                  label: status,
                  color: 'bg-gray-400',
                };
                const width = (count / totalOrders) * 100;
                return (
                  <div
                    key={status}
                    className={`${info.color} first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${width}%` }}
                    title={`${info.label}: ${count}`}
                  />
                );
              })}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            {Object.entries(statusCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([status, count]) => {
                const info = statusLabels[status] || {
                  label: status,
                  color: 'bg-gray-400',
                };
                return (
                  <div key={status} className="flex items-center gap-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${info.color}`} />
                    <span className="text-muted-foreground">{info.label}</span>
                    <span className="font-medium ml-auto">{count}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <div className="text-2xl font-bold text-green-600">
              {((statusCounts.delivered || 0) / totalOrders * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Delivery Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {(((statusCounts.returned || 0) + (statusCounts.refunded || 0)) / totalOrders * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Return Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
