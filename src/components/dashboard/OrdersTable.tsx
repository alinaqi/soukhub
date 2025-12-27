'use client';

import { useState } from 'react';
import type { Order } from '@/types/supabase';
import Link from 'next/link';

interface OrdersTableProps {
  orders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  ready_to_ship: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  out_for_delivery: 'bg-teal-100 text-teal-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
  refunded: 'bg-pink-100 text-pink-800',
};

const MARKETPLACE_ICONS: Record<string, string> = {
  amazon: '📦',
  cartlow: '🛒',
  revibe: '📱',
  noon: '🌙',
  other: '🏪',
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [filter, setFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');

  const filteredOrders = orders.filter((order) => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (marketplaceFilter !== 'all' && order.marketplace !== marketplaceFilter) return false;
    return true;
  });

  const uniqueMarketplaces = [...new Set(orders.map((o) => o.marketplace))];

  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-12 text-center">
        <span className="text-5xl mb-4 block">📭</span>
        <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
        <p className="text-muted-foreground mb-6">
          Import your orders from Amazon, Cartlow, or Revibe to get started
        </p>
        <Link
          href="/import"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          📥 Import Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Filters */}
      <div className="p-4 border-b border-border flex flex-wrap gap-4">
        <div>
          <label className="text-sm text-muted-foreground mr-2">Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mr-2">Marketplace:</label>
          <select
            value={marketplaceFilter}
            onChange={(e) => setMarketplaceFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
          >
            <option value="all">All</option>
            {uniqueMarketplaces.map((mp) => (
              <option key={mp} value={mp}>
                {mp.charAt(0).toUpperCase() + mp.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground ml-auto">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Order
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{MARKETPLACE_ICONS[order.marketplace] || '🏪'}</span>
                    <div>
                      <div className="font-medium text-sm">
                        {order.marketplace_order_id}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {order.marketplace}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">{order.customer_name || 'N/A'}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.shipping_city || order.shipping_country}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {new Date(order.order_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-medium text-sm">
                    {order.currency} {order.total?.toFixed(2)}
                  </div>
                  {order.payment_method && (
                    <div className="text-xs text-muted-foreground capitalize">
                      {order.payment_method}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
