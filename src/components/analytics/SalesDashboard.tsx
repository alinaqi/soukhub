'use client';

import { useState, useEffect } from 'react';

interface SalesSummary {
  period: string;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  orders_trend: number;
  revenue_trend: number;
  top_brands: Array<{ brand: string; revenue: number; orders: number }>;
  top_products: Array<{ name: string; revenue: number; orders: number }>;
}

interface ProductTrend {
  product_name: string;
  brand: string;
  sales_7d: number;
  sales_30d: number;
  velocity: number;
  velocity_change: number;
  trend: 'hot' | 'rising' | 'stable' | 'declining' | 'dead';
}

interface DailySales {
  date: string;
  orders: number;
  revenue: number;
}

type Period = '7d' | '30d' | '90d';

export function SalesDashboard() {
  const [period, setPeriod] = useState<Period>('7d');
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [dailySales, setDailySales] = useState<DailySales[]>([]);
  const [trends, setTrends] = useState<{ hot: ProductTrend[]; slow: ProductTrend[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/analytics/sales?period=${period}&daily=true&trends=true`
      );
      const data = await response.json();

      if (response.ok) {
        setSummary(data.summary);
        setDailySales(data.daily_sales || []);
        setTrends(data.product_trends);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTrend = (value: number) => {
    const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '';
    const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
    return (
      <span className={color}>
        {arrow} {Math.abs(value)}%
      </span>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
          <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sales Analytics</h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Total Orders</div>
            <div className="text-2xl font-bold">{summary.total_orders}</div>
            <div className="text-sm">{formatTrend(summary.orders_trend)} vs prev</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Revenue</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue)}</div>
            <div className="text-sm">{formatTrend(summary.revenue_trend)} vs prev</div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="text-sm text-gray-500">Avg Order Value</div>
            <div className="text-2xl font-bold">{formatCurrency(summary.avg_order_value)}</div>
          </div>
        </div>
      )}

      {/* Mini Chart */}
      {dailySales.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <h3 className="font-medium mb-4">Daily Revenue</h3>
          <div className="h-32 flex items-end gap-1">
            {dailySales.slice(-14).map((day, i) => {
              const maxRevenue = Math.max(...dailySales.map((d) => d.revenue));
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
              return (
                <div
                  key={day.date}
                  className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${day.date}: ${formatCurrency(day.revenue)} (${day.orders} orders)`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{dailySales[Math.max(0, dailySales.length - 14)]?.date}</span>
            <span>{dailySales[dailySales.length - 1]?.date}</span>
          </div>
        </div>
      )}

      {/* Top Products & Brands */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Products */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-3">Top Products</h3>
            <div className="space-y-2">
              {summary.top_products.slice(0, 5).map((product, i) => (
                <div key={product.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{i + 1}.</span>
                    <span className="truncate max-w-[200px]">{product.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(product.revenue)}</span>
                </div>
              ))}
              {summary.top_products.length === 0 && (
                <div className="text-gray-500 text-sm">No data yet</div>
              )}
            </div>
          </div>

          {/* Top Brands */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-3">Top Brands</h3>
            <div className="space-y-2">
              {summary.top_brands.slice(0, 5).map((brand, i) => (
                <div key={brand.brand} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{i + 1}.</span>
                    <span>{brand.brand}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(brand.revenue)}</span>
                    <span className="text-gray-500 ml-2">({brand.orders})</span>
                  </div>
                </div>
              ))}
              {summary.top_brands.length === 0 && (
                <div className="text-gray-500 text-sm">No data yet</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Trends */}
      {trends && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hot Products */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <span>🔥</span> Hot Products
            </h3>
            <div className="space-y-2">
              {trends.hot.slice(0, 5).map((product) => (
                <div key={product.product_name} className="flex items-center justify-between text-sm">
                  <div className="truncate max-w-[200px]">{product.product_name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">↑{product.velocity_change}%</span>
                    <span className="text-gray-500">{product.sales_7d} sold</span>
                  </div>
                </div>
              ))}
              {trends.hot.length === 0 && (
                <div className="text-gray-500 text-sm">No trending products</div>
              )}
            </div>
          </div>

          {/* Slow Movers */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <span>⚠️</span> Slow Movers
            </h3>
            <div className="space-y-2">
              {trends.slow.slice(0, 5).map((product) => (
                <div key={product.product_name} className="flex items-center justify-between text-sm">
                  <div className="truncate max-w-[200px]">{product.product_name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">↓{Math.abs(product.velocity_change)}%</span>
                    <span className="text-gray-500">{product.sales_7d} sold</span>
                  </div>
                </div>
              ))}
              {trends.slow.length === 0 && (
                <div className="text-gray-500 text-sm">No slow movers</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
