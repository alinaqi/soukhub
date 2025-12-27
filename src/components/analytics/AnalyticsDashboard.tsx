'use client';

import { useState, useMemo } from 'react';
import type { Order } from '@/types/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsDashboardProps {
  orders: Order[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const MARKETPLACE_COLORS: Record<string, string> = {
  amazon: '#ff9900',
  cartlow: '#10b981',
  revibe: '#3b82f6',
  noon: '#f59e0b',
  other: '#6b7280',
};

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export function AnalyticsDashboard({ orders }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  // Filter orders by time range
  const filteredOrders = useMemo(() => {
    if (timeRange === 'all') return orders;

    const now = new Date();
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return orders.filter((o) => new Date(o.order_date) >= cutoff);
  }, [orders, timeRange]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const delivered = filteredOrders.filter((o) => o.status === 'delivered');
    const returned = filteredOrders.filter((o) => ['returned', 'refunded'].includes(o.status));
    const cancelled = filteredOrders.filter((o) => o.status === 'cancelled');
    const pending = filteredOrders.filter((o) =>
      ['pending', 'confirmed', 'processing', 'ready_to_ship'].includes(o.status)
    );
    const shipped = filteredOrders.filter((o) =>
      ['shipped', 'out_for_delivery'].includes(o.status)
    );

    const totalRevenue = delivered.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = delivered.length > 0 ? totalRevenue / delivered.length : 0;
    const returnRate = filteredOrders.length > 0 ? (returned.length / filteredOrders.length) * 100 : 0;
    const cancelRate = filteredOrders.length > 0 ? (cancelled.length / filteredOrders.length) * 100 : 0;
    const fulfillmentRate = filteredOrders.length > 0
      ? ((delivered.length + shipped.length) / filteredOrders.length) * 100
      : 0;

    return {
      totalOrders: filteredOrders.length,
      totalRevenue,
      avgOrderValue,
      pendingOrders: pending.length,
      shippedOrders: shipped.length,
      deliveredOrders: delivered.length,
      returnedOrders: returned.length,
      cancelledOrders: cancelled.length,
      returnRate,
      cancelRate,
      fulfillmentRate,
    };
  }, [filteredOrders]);

  // Revenue over time
  const revenueOverTime = useMemo(() => {
    const groupBy = timeRange === '7d' ? 'day' : timeRange === '30d' ? 'day' : 'week';
    const delivered = filteredOrders.filter((o) => o.status === 'delivered');

    const grouped: Record<string, { date: string; revenue: number; orders: number }> = {};

    delivered.forEach((order) => {
      const date = new Date(order.order_date);
      let key: string;

      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else {
        // Get week start
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { date: key, revenue: 0, orders: 0 };
      }
      grouped[key].revenue += order.total || 0;
      grouped[key].orders += 1;
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders, timeRange]);

  // Orders by marketplace
  const ordersByMarketplace = useMemo(() => {
    const counts: Record<string, { name: string; orders: number; revenue: number }> = {};

    filteredOrders.forEach((order) => {
      const mp = order.marketplace;
      if (!counts[mp]) {
        counts[mp] = { name: mp.charAt(0).toUpperCase() + mp.slice(1), orders: 0, revenue: 0 };
      }
      counts[mp].orders += 1;
      if (order.status === 'delivered') {
        counts[mp].revenue += order.total || 0;
      }
    });

    return Object.values(counts).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // Orders by status
  const ordersByStatus = useMemo(() => {
    const statusLabels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      ready_to_ship: 'Ready to Ship',
      shipped: 'Shipped',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned',
      refunded: 'Refunded',
    };

    const counts: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        status,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  // Geographic distribution
  const ordersByCity = useMemo(() => {
    const counts: Record<string, { city: string; orders: number; revenue: number }> = {};

    filteredOrders.forEach((order) => {
      const city = order.shipping_city || 'Unknown';
      if (!counts[city]) {
        counts[city] = { city, orders: 0, revenue: 0 };
      }
      counts[city].orders += 1;
      if (order.status === 'delivered') {
        counts[city].revenue += order.total || 0;
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 10);
  }, [filteredOrders]);

  // Payment methods
  const ordersByPayment = useMemo(() => {
    const counts: Record<string, number> = {};

    filteredOrders.forEach((order) => {
      const method = order.payment_method || 'unknown';
      counts[method] = (counts[method] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([method, count]) => ({
        name: method.toUpperCase().replace('_', ' '),
        value: count,
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredOrders]);

  // Daily order trends
  const dailyTrends = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = new Array(7).fill(0);

    filteredOrders.forEach((order) => {
      const day = new Date(order.order_date).getDay();
      counts[day] += 1;
    });

    return days.map((name, i) => ({ name, orders: counts[i] }));
  }, [filteredOrders]);

  // Monthly comparison
  const monthlyComparison = useMemo(() => {
    const months: Record<string, { month: string; orders: number; revenue: number }> = {};

    orders.forEach((order) => {
      const date = new Date(order.order_date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short', year: '2-digit' });

      if (!months[key]) {
        months[key] = { month: monthName, orders: 0, revenue: 0 };
      }
      months[key].orders += 1;
      if (order.status === 'delivered') {
        months[key].revenue += order.total || 0;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([, data]) => data);
  }, [orders]);

  // Fulfillment performance
  const fulfillmentData = useMemo(() => {
    const byMarketplace: Record<string, { name: string; delivered: number; pending: number; returned: number }> = {};

    filteredOrders.forEach((order) => {
      const mp = order.marketplace;
      if (!byMarketplace[mp]) {
        byMarketplace[mp] = { name: mp.charAt(0).toUpperCase() + mp.slice(1), delivered: 0, pending: 0, returned: 0 };
      }

      if (order.status === 'delivered') {
        byMarketplace[mp].delivered += 1;
      } else if (['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery'].includes(order.status)) {
        byMarketplace[mp].pending += 1;
      } else if (['returned', 'refunded', 'cancelled'].includes(order.status)) {
        byMarketplace[mp].returned += 1;
      }
    });

    return Object.values(byMarketplace);
  }, [filteredOrders]);

  const formatCurrency = (value: number) => `AED ${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {(['7d', '30d', '90d', '1y', 'all'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(metrics.totalRevenue)}
          subtitle="From delivered orders"
          icon="💰"
        />
        <MetricCard
          title="Total Orders"
          value={metrics.totalOrders.toString()}
          subtitle={`${metrics.pendingOrders} pending`}
          icon="📦"
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(metrics.avgOrderValue)}
          subtitle="Per delivered order"
          icon="📊"
        />
        <MetricCard
          title="Fulfillment Rate"
          value={`${metrics.fulfillmentRate.toFixed(1)}%`}
          subtitle="Orders shipped/delivered"
          icon="✅"
          trend={metrics.fulfillmentRate > 80 ? 'up' : 'down'}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          title="Pending"
          value={metrics.pendingOrders.toString()}
          icon="⏳"
          variant="small"
        />
        <MetricCard
          title="Shipped"
          value={metrics.shippedOrders.toString()}
          icon="🚚"
          variant="small"
        />
        <MetricCard
          title="Delivered"
          value={metrics.deliveredOrders.toString()}
          icon="✅"
          variant="small"
        />
        <MetricCard
          title="Return Rate"
          value={`${metrics.returnRate.toFixed(1)}%`}
          icon="↩️"
          variant="small"
          trend={metrics.returnRate < 5 ? 'up' : 'down'}
        />
        <MetricCard
          title="Cancel Rate"
          value={`${metrics.cancelRate.toFixed(1)}%`}
          icon="❌"
          variant="small"
          trend={metrics.cancelRate < 3 ? 'up' : 'down'}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Over Time */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Revenue Over Time</h3>
          <div className="h-72">
            {revenueOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                    labelFormatter={(label) => new Date(label as string).toLocaleDateString()}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No revenue data for this period" />
            )}
          </div>
        </div>

        {/* Monthly Comparison */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Monthly Performance</h3>
          <div className="h-72">
            {monthlyComparison.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value, name) => [name === 'revenue' ? formatCurrency(value as number) : value, name === 'revenue' ? 'Revenue' : 'Orders']} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#10b981" name="Orders" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No monthly data available" />
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Marketplace Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Revenue by Marketplace</h3>
          <div className="h-64">
            {ordersByMarketplace.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByMarketplace}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="revenue"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ordersByMarketplace.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={MARKETPLACE_COLORS[entry.name.toLowerCase()] || COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No marketplace data" />
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Orders by Status</h3>
          <div className="h-64">
            {ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No status data" />
            )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Payment Methods</h3>
          <div className="h-64">
            {ordersByPayment.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ordersByPayment}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {ordersByPayment.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No payment data" />
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Fulfillment by Marketplace */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Fulfillment by Marketplace</h3>
          <div className="h-64">
            {fulfillmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fulfillmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="delivered" fill="#10b981" name="Delivered" stackId="a" />
                  <Bar dataKey="pending" fill="#f59e0b" name="In Progress" stackId="a" />
                  <Bar dataKey="returned" fill="#ef4444" name="Returned/Cancelled" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="No fulfillment data" />
            )}
          </div>
        </div>

        {/* Daily Trends */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Orders by Day of Week</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Cities */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Top Shipping Destinations</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
          {ordersByCity.slice(0, 10).map((city, index) => (
            <div
              key={city.city}
              className="p-4 rounded-lg bg-muted/50 border border-border"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                <span className="font-medium truncate">{city.city}</span>
              </div>
              <div className="text-2xl font-bold">{city.orders}</div>
              <div className="text-sm text-muted-foreground">
                {formatCurrency(city.revenue)} revenue
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marketplace Breakdown Table */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Marketplace Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Marketplace</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Orders</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Revenue</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg Order</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Share</th>
              </tr>
            </thead>
            <tbody>
              {ordersByMarketplace.map((mp) => (
                <tr key={mp.name} className="border-b border-border last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: MARKETPLACE_COLORS[mp.name.toLowerCase()] || '#6b7280' }}
                      />
                      <span className="font-medium">{mp.name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">{mp.orders.toLocaleString()}</td>
                  <td className="text-right py-3 px-4">{formatCurrency(mp.revenue)}</td>
                  <td className="text-right py-3 px-4">
                    {mp.orders > 0 ? formatCurrency(mp.revenue / mp.orders) : '-'}
                  </td>
                  <td className="text-right py-3 px-4">
                    {metrics.totalOrders > 0 ? `${((mp.orders / metrics.totalOrders) * 100).toFixed(1)}%` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  trend?: 'up' | 'down';
  variant?: 'default' | 'small';
}

function MetricCard({ title, value, subtitle, icon, trend, variant = 'default' }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-card ${
        variant === 'small' ? 'p-4' : 'p-6'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className={`font-bold ${variant === 'small' ? 'text-xl mt-1' : 'text-2xl mt-2'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className={variant === 'small' ? 'text-lg' : 'text-2xl'}>{icon}</span>
          {trend && (
            <span className={trend === 'up' ? 'text-green-500' : 'text-red-500'}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Empty Chart Placeholder
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <span className="text-4xl mb-2 block">📊</span>
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
}
