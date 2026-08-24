'use client';

import { useEffect, useState } from 'react';

interface PipelineData {
  pipeline: {
    new: number;
    awaiting_supplier: number;
    confirmed: number;
    ready_to_ship: number;
    shipped_today: number;
    delivered_today: number;
  };
  inventory: {
    total_products: number;
    total_units: number;
    available_units: number;
    reserved_units: number;
    low_stock_count: number;
    out_of_stock_count: number;
  };
  suppliers: {
    supplier_id: string;
    supplier_name: string;
    pending_count: number;
    confirmed_count: number;
    unavailable_count: number;
  }[];
  today: {
    orders: number;
    revenue: number;
    shipped: number;
    average_order_value: number;
  };
  alerts: {
    type: string;
    message: string;
    count: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export function OperationsPipeline() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard/operations');
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6 animate-pulse">
        <div className="h-6 bg-muted rounded w-48 mb-4"></div>
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-1 h-24 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <p className="text-red-500 text-sm">Failed to load operations data</p>
      </div>
    );
  }

  const pipelineStages = [
    { key: 'new', label: 'New', count: data.pipeline.new, color: 'bg-blue-500' },
    { key: 'supplier', label: 'Supplier', count: data.pipeline.awaiting_supplier, color: 'bg-amber-500' },
    { key: 'confirmed', label: 'Confirmed', count: data.pipeline.confirmed, color: 'bg-green-500' },
    { key: 'ready', label: 'Ready', count: data.pipeline.ready_to_ship, color: 'bg-purple-500' },
    { key: 'shipped', label: 'Shipped', count: data.pipeline.shipped_today, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Pipeline */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Order Pipeline</h3>
          <span className="text-xs text-muted-foreground">Live updates every 30s</span>
        </div>

        <div className="flex items-center gap-2">
          {pipelineStages.map((stage, index) => (
            <div key={stage.key} className="flex items-center flex-1">
              <div className="flex-1 text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                <div className={`w-3 h-3 rounded-full ${stage.color} mx-auto mb-2`}></div>
                <div className="text-2xl font-bold">{stage.count}</div>
                <div className="text-xs text-muted-foreground">{stage.label}</div>
              </div>
              {index < pipelineStages.length - 1 && (
                <div className="text-muted-foreground mx-1">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <span>⚠️</span> Needs Attention
          </h4>
          <div className="space-y-2">
            {data.alerts.map((alert, i) => (
              <div
                key={i}
                className={`px-4 py-2 rounded-lg text-sm flex items-center justify-between ${
                  alert.priority === 'high'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : alert.priority === 'medium'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <span>{alert.message}</span>
                <span className="font-medium">{alert.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Inventory Summary */}
        <div className="rounded-xl border bg-card p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <span>📦</span> Inventory
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Products</span>
              <span className="font-medium">{data.inventory.total_products}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Units</span>
              <span className="font-medium">{data.inventory.total_units}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Available</span>
              <span className="font-medium text-green-600">{data.inventory.available_units}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Reserved</span>
              <span className="font-medium text-amber-600">{data.inventory.reserved_units}</span>
            </div>
            {data.inventory.low_stock_count > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-amber-600">⚠️ Low Stock</span>
                <span className="font-medium text-amber-600">{data.inventory.low_stock_count}</span>
              </div>
            )}
            {data.inventory.out_of_stock_count > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-red-600">🔴 Out of Stock</span>
                <span className="font-medium text-red-600">{data.inventory.out_of_stock_count}</span>
              </div>
            )}
          </div>
        </div>

        {/* Suppliers */}
        <div className="rounded-xl border bg-card p-6">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <span>🤝</span> Suppliers
          </h4>
          {data.suppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No suppliers configured</p>
          ) : (
            <div className="space-y-3">
              {data.suppliers.map((supplier) => (
                <div key={supplier.supplier_id} className="flex items-center justify-between text-sm">
                  <span className="truncate">{supplier.supplier_name}</span>
                  <div className="flex items-center gap-2">
                    {supplier.pending_count > 0 && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                        ⏳ {supplier.pending_count}
                      </span>
                    )}
                    {supplier.unavailable_count > 0 && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        ❌ {supplier.unavailable_count}
                      </span>
                    )}
                    {supplier.confirmed_count > 0 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        ✅ {supplier.confirmed_count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Today's Stats */}
      <div className="rounded-xl border bg-card p-6">
        <h4 className="font-medium mb-4">Today&apos;s Performance</h4>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{data.today.orders}</div>
            <div className="text-xs text-muted-foreground">Orders</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">AED {data.today.revenue.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{data.today.shipped}</div>
            <div className="text-xs text-muted-foreground">Shipped</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">AED {Math.round(data.today.average_order_value)}</div>
            <div className="text-xs text-muted-foreground">Avg Order</div>
          </div>
        </div>
      </div>
    </div>
  );
}
