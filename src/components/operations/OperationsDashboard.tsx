'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  marketplace_order_id: string;
  marketplace: string;
  status: string;
  order_date: string;
  customer_name: string | null;
  shipping_city: string | null;
  total: number | null;
  currency: string | null;
  order_items: { product_name: string; quantity: number }[];
  supplierOrder?: {
    id: string;
    supplier_id: string;
    status: string;
    sent_at: string | null;
    supplier: {
      id: string;
      name: string;
      whatsapp_number: string;
    };
  };
}

interface Supplier {
  id: string;
  name: string;
  whatsapp_number: string;
  delivery_times: string[] | null;
}

interface SupplierGroup {
  supplier: Supplier;
  orders: { id: string; order_id: string; status: string; sent_at: string | null }[];
}

interface Alert {
  type: string;
  count: number;
  description: string;
  href: string;
}

interface Delivery {
  supplier: Supplier;
  time: string;
  expectedItems: number;
}

interface OperationsDashboardProps {
  ordersByStatus: {
    new: number;
    awaiting_supplier: number;
    confirmed: number;
    ready_to_pack: number;
    packed: number;
    shipped_today: number;
  };
  newOrders: Order[];
  awaitingSupplierOrders: Order[];
  confirmedOrders: Order[];
  readyToPackOrders: Order[];
  shippedTodayOrders: Order[];
  ordersBySupplier: SupplierGroup[];
  needsAttention: Alert[];
  upcomingDeliveries: Delivery[];
  metrics: {
    ordersToday: number;
    revenueToday: number;
    shippedToday: number;
  };
}

const MARKETPLACE_ICONS: Record<string, string> = {
  amazon: '📦',
  cartlow: '🛒',
  revibe: '📱',
  noon: '🌙',
  other: '🏪',
};

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export function OperationsDashboard({
  ordersByStatus,
  newOrders,
  awaitingSupplierOrders,
  confirmedOrders,
  readyToPackOrders,
  shippedTodayOrders,
  ordersBySupplier,
  needsAttention,
  upcomingDeliveries,
  metrics,
}: OperationsDashboardProps) {
  const [isRouting, setIsRouting] = useState(false);
  const [routingResult, setRoutingResult] = useState<{ routed: number; failed: number } | null>(null);

  const today = new Date();
  const greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 18 ? 'Good Afternoon' : 'Good Evening';

  const handleRouteAllOrders = async () => {
    if (newOrders.length === 0) return;

    setIsRouting(true);
    setRoutingResult(null);

    try {
      const response = await fetch('/api/orders/route-to-supplier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_ids: newOrders.map((o) => o.id) }),
      });

      if (response.ok) {
        const data = await response.json();
        setRoutingResult(data.summary);
        // Refresh page after routing
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error) {
      console.error('Failed to route orders:', error);
    } finally {
      setIsRouting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {greeting}! <span className="text-3xl">{today.getHours() < 12 ? '☀️' : today.getHours() < 18 ? '🌤️' : '🌙'}</span>
          </h1>
          <p className="text-muted-foreground">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="font-medium text-foreground">Today&apos;s Stats</div>
          <div>{metrics.ordersToday} orders • AED {metrics.revenueToday.toLocaleString()}</div>
        </div>
      </div>

      {/* Alerts */}
      {needsAttention.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
            ⚠️ Needs Your Attention
          </h3>
          <ul className="space-y-1">
            {needsAttention.map((alert, i) => (
              <li key={i} className="text-sm text-amber-700">
                <a href={alert.href} className="hover:underline">
                  • {alert.count} {alert.description}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Order Pipeline */}
      <div className="bg-card rounded-lg border border-border p-4">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          📦 Order Pipeline
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <PipelineStage
            label="New"
            count={ordersByStatus.new}
            color="bg-gray-100 text-gray-700"
            icon="🆕"
            href="#new-orders"
          />
          <PipelineStage
            label="Supplier"
            count={ordersByStatus.awaiting_supplier}
            color="bg-yellow-100 text-yellow-700"
            icon="⏳"
            href="#awaiting-supplier"
            sublabel={ordersByStatus.awaiting_supplier > 0 ? 'awaiting' : undefined}
          />
          <PipelineStage
            label="Confirmed"
            count={ordersByStatus.confirmed}
            color="bg-blue-100 text-blue-700"
            icon="✅"
            href="#confirmed"
          />
          <PipelineStage
            label="Ready to Pack"
            count={ordersByStatus.ready_to_pack}
            color="bg-purple-100 text-purple-700"
            icon="📦"
            href="#ready-to-pack"
          />
          <PipelineStage
            label="Packed"
            count={ordersByStatus.packed}
            color="bg-indigo-100 text-indigo-700"
            icon="🎁"
            href="#packed"
          />
          <PipelineStage
            label="Shipped Today"
            count={ordersByStatus.shipped_today}
            color="bg-green-100 text-green-700"
            icon="🚚"
            href="#shipped"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* New Orders (Need Routing) */}
          {newOrders.length > 0 && (
            <OrderSection
              id="new-orders"
              title="New Orders"
              subtitle="Need supplier assignment"
              icon="🆕"
              count={newOrders.length}
              action={
                <button
                  onClick={handleRouteAllOrders}
                  disabled={isRouting}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                >
                  {isRouting ? (
                    <>
                      <span className="animate-spin">⏳</span> Routing...
                    </>
                  ) : (
                    <>
                      🔀 Route All to Suppliers
                    </>
                  )}
                </button>
              }
            >
              {routingResult && (
                <div className="mb-3 p-2 bg-green-100 text-green-700 rounded-lg text-sm">
                  ✅ Routed {routingResult.routed} orders
                  {routingResult.failed > 0 && ` (${routingResult.failed} failed)`}
                </div>
              )}
              <OrderList orders={newOrders} showSupplier={false} />
            </OrderSection>
          )}

          {/* Awaiting Supplier */}
          {awaitingSupplierOrders.length > 0 && (
            <OrderSection
              id="awaiting-supplier"
              title="Awaiting Supplier"
              subtitle="Waiting for confirmation"
              icon="⏳"
              count={awaitingSupplierOrders.length}
            >
              <OrderList orders={awaitingSupplierOrders} showSupplier />
            </OrderSection>
          )}

          {/* Ready to Pack */}
          {readyToPackOrders.length > 0 && (
            <OrderSection
              id="ready-to-pack"
              title="Ready to Pack"
              subtitle="Supplier delivered, ready to pack"
              icon="📦"
              count={readyToPackOrders.length}
              action={
                <Link
                  href="/packing"
                  className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                >
                  Start Packing →
                </Link>
              }
            >
              <OrderList orders={readyToPackOrders} showSupplier />
            </OrderSection>
          )}

          {/* Confirmed Orders */}
          {confirmedOrders.length > 0 && (
            <OrderSection
              id="confirmed"
              title="Confirmed"
              subtitle="Supplier confirmed, awaiting delivery"
              icon="✅"
              count={confirmedOrders.length}
            >
              <OrderList orders={confirmedOrders} showSupplier />
            </OrderSection>
          )}

          {/* All Caught Up */}
          {newOrders.length === 0 && awaitingSupplierOrders.length === 0 && readyToPackOrders.length === 0 && confirmedOrders.length === 0 && (
            <div className="bg-card rounded-lg border border-border p-8 text-center">
              <span className="text-5xl mb-4 block">🎉</span>
              <h3 className="font-semibold text-lg">All caught up!</h3>
              <p className="text-muted-foreground">No orders need immediate attention.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supplier Status */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              📨 Supplier Status
            </h3>
            {ordersBySupplier.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending supplier orders</p>
            ) : (
              <div className="space-y-3">
                {ordersBySupplier.map(({ supplier, orders }) => {
                  const pending = orders.filter((o) => ['pending_send', 'sent'].includes(o.status));
                  const oldestSent = orders
                    .filter((o) => o.status === 'sent' && o.sent_at)
                    .sort((a, b) => new Date(a.sent_at!).getTime() - new Date(b.sent_at!).getTime())[0];

                  return (
                    <div key={supplier.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{supplier.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {pending.length} pending
                        </span>
                      </div>
                      {oldestSent && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ⏳ Sent {formatTimeAgo(oldestSent.sent_at)}
                        </div>
                      )}
                      <a
                        href={`https://wa.me/${supplier.whatsapp_number.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-xs text-green-600 hover:underline inline-flex items-center gap-1"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Upcoming Deliveries */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🚚 Deliveries Today
            </h3>
            {upcomingDeliveries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scheduled deliveries</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeliveries.map((delivery, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium">{delivery.time}</div>
                      <div className="text-xs text-muted-foreground">{delivery.supplier.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      ~{delivery.expectedItems} items
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                href="/orders"
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span>📋</span>
                <span className="text-sm">All Orders</span>
              </Link>
              <Link
                href="/suppliers"
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span>👥</span>
                <span className="text-sm">Manage Suppliers</span>
              </Link>
              <Link
                href="/import"
                className="flex items-center gap-2 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <span>📥</span>
                <span className="text-sm">Import Orders</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineStage({
  label,
  count,
  color,
  icon,
  href,
  sublabel,
}: {
  label: string;
  count: number;
  color: string;
  icon: string;
  href: string;
  sublabel?: string;
}) {
  return (
    <a
      href={href}
      className={`${color} rounded-lg p-3 text-center hover:opacity-90 transition-opacity`}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-xs font-medium">{label}</div>
      {sublabel && <div className="text-xs opacity-75">{sublabel}</div>}
    </a>
  );
}

function OrderSection({
  id,
  title,
  subtitle,
  icon,
  count,
  action,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  count: number;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <span>{icon}</span>
            {title}
            <span className="ml-1 px-2 py-0.5 text-xs bg-muted rounded-full">{count}</span>
          </h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function OrderList({ orders, showSupplier }: { orders: Order[]; showSupplier: boolean }) {
  return (
    <div className="space-y-2">
      {orders.slice(0, 10).map((order) => (
        <div
          key={order.id}
          className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
        >
          <span className="text-xl">
            {MARKETPLACE_ICONS[order.marketplace] || '🏪'}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">
                {order.marketplace_order_id}
              </span>
              {order.order_items?.[0] && (
                <span className="text-xs text-muted-foreground truncate">
                  • {order.order_items[0].product_name}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.customer_name || 'Customer'} • {order.shipping_city || 'Unknown'}
              {showSupplier && order.supplierOrder?.supplier && (
                <span className="ml-2 text-blue-600">
                  → {order.supplierOrder.supplier.name}
                  {order.supplierOrder.sent_at && (
                    <span className="text-muted-foreground"> ({formatTimeAgo(order.supplierOrder.sent_at)})</span>
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">
              {order.currency} {order.total?.toFixed(0)}
            </div>
          </div>
        </div>
      ))}
      {orders.length > 10 && (
        <div className="text-center text-sm text-muted-foreground py-2">
          +{orders.length - 10} more orders
        </div>
      )}
    </div>
  );
}
