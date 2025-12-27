import Link from 'next/link';
import type { Order } from '@/types/supabase';

interface RecentOrdersProps {
  orders: Order[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
};

const MARKETPLACE_ICONS: Record<string, string> = {
  amazon: '📦',
  cartlow: '🛒',
  revibe: '📱',
  noon: '🌙',
  other: '🏪',
};

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">📭</span>
          <p className="text-muted-foreground mb-4">No orders yet</p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            📥 Import your first orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between p-6 border-b border-border">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        <Link
          href="/orders"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="divide-y divide-border">
        {orders.map((order) => (
          <div key={order.id} className="p-4 flex items-center gap-4">
            <span className="text-2xl">
              {MARKETPLACE_ICONS[order.marketplace] || '🏪'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {order.marketplace_order_id}
              </div>
              <div className="text-sm text-muted-foreground">
                {order.customer_name || 'Unknown customer'} •{' '}
                {new Date(order.order_date).toLocaleDateString()}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                {order.currency} {order.total?.toFixed(2)}
              </div>
              <span
                className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${
                  STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
