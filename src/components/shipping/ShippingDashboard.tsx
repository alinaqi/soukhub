'use client';

import { useState } from 'react';

interface ShippingOrder {
  id: string;
  marketplace_order_id: string;
  marketplace: string;
  customer_name: string;
  shipping_city: string;
  shipping_address?: string;
  total: number;
  currency: string;
  carrier?: string;
  tracking_number?: string;
  items_count: number;
}

interface GroupedOrders {
  key: string;
  label: string;
  orders: ShippingOrder[];
}

interface ShippingDashboardProps {
  orders: ShippingOrder[];
  groupBy: 'marketplace' | 'destination' | 'carrier';
}

export function ShippingDashboard({ orders: initialOrders, groupBy }: ShippingDashboardProps) {
  const [orders, setOrders] = useState<ShippingOrder[]>(initialOrders);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHandoffModal, setShowHandoffModal] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<string | null>(null);

  // Group orders
  const groupedOrders: GroupedOrders[] = [];
  const groups = new Map<string, ShippingOrder[]>();

  orders.forEach((order) => {
    let key: string;
    let label: string;

    switch (groupBy) {
      case 'marketplace':
        key = order.marketplace;
        label = order.marketplace.charAt(0).toUpperCase() + order.marketplace.slice(1);
        break;
      case 'destination':
        key = order.shipping_city;
        label = order.shipping_city;
        break;
      case 'carrier':
        key = order.carrier || 'unassigned';
        label = order.carrier || 'Unassigned Carrier';
        break;
      default:
        key = 'all';
        label = 'All Orders';
    }

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(order);
  });

  groups.forEach((orders, key) => {
    const label = groupBy === 'marketplace'
      ? key.charAt(0).toUpperCase() + key.slice(1)
      : key;
    groupedOrders.push({ key, label, orders });
  });

  // Sort groups by count (most orders first)
  groupedOrders.sort((a, b) => b.orders.length - a.orders.length);

  const handleSelectAll = (groupKey: string) => {
    const groupOrders = groups.get(groupKey) || [];
    const allSelected = groupOrders.every((o) => selectedOrders.has(o.id));

    const newSelected = new Set(selectedOrders);
    groupOrders.forEach((order) => {
      if (allSelected) {
        newSelected.delete(order.id);
      } else {
        newSelected.add(order.id);
      }
    });
    setSelectedOrders(newSelected);
  };

  const handleToggleOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const handleHandoff = (groupKey: string) => {
    // Select all orders in this group
    const groupOrders = groups.get(groupKey) || [];
    const newSelected = new Set<string>();
    groupOrders.forEach((order) => newSelected.add(order.id));
    setSelectedOrders(newSelected);
    setCurrentGroup(groupKey);
    setShowHandoffModal(true);
  };

  const handleConfirmHandoff = async (carrier: string) => {
    if (selectedOrders.size === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/shipping/mark-shipped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_ids: Array.from(selectedOrders),
          carrier,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark as shipped');
      }

      // Remove shipped orders from the list
      setOrders(orders.filter((o) => !selectedOrders.has(o.id)));
      setSelectedOrders(new Set());
      setShowHandoffModal(false);
    } catch (error) {
      console.error('Error marking as shipped:', error);
      alert('Failed to mark as shipped');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="text-6xl mb-4">🚚</span>
        <h2 className="text-xl font-semibold mb-2">No orders ready to ship</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Pack orders first, then they will appear here for shipping handoff.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Shipping Handoff</h1>
          <p className="text-muted-foreground">
            {orders.length} orders ready to ship
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Grouped by: <span className="font-medium capitalize">{groupBy}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{orders.length}</div>
          <div className="text-sm text-muted-foreground">Ready to Ship</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{groupedOrders.length}</div>
          <div className="text-sm text-muted-foreground">Groups</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{selectedOrders.size}</div>
          <div className="text-sm text-muted-foreground">Selected</div>
        </div>
      </div>

      {/* Grouped Orders */}
      <div className="space-y-6">
        {groupedOrders.map((group) => {
          const allSelected = group.orders.every((o) => selectedOrders.has(o.id));
          const someSelected = group.orders.some((o) => selectedOrders.has(o.id));

          return (
            <div key={group.key} className="bg-card border rounded-xl overflow-hidden">
              {/* Group Header */}
              <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allSelected;
                    }}
                    onChange={() => handleSelectAll(group.key)}
                    className="w-5 h-5 rounded"
                  />
                  <div>
                    <div className="font-medium">{group.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {group.orders.length} orders
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleHandoff(group.key)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Handoff All ({group.orders.length})
                </button>
              </div>

              {/* Order List */}
              <div className="divide-y">
                {group.orders.map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors ${
                      selectedOrders.has(order.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleToggleOrder(order.id)}
                      className="w-4 h-4 rounded"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium">
                          {order.marketplace_order_id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          order.marketplace === 'amazon' ? 'bg-orange-100 text-orange-700' :
                          order.marketplace === 'noon' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.marketplace}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        {order.customer_name} • {order.shipping_city}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium">
                        {order.currency} {order.total.toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Bar */}
      {selectedOrders.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border shadow-lg rounded-xl p-4 flex items-center gap-4">
          <span className="text-sm">
            <strong>{selectedOrders.size}</strong> orders selected
          </span>
          <button
            onClick={() => setShowHandoffModal(true)}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Confirm Handoff
          </button>
          <button
            onClick={() => setSelectedOrders(new Set())}
            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Handoff Modal */}
      {showHandoffModal && (
        <HandoffModal
          orderCount={selectedOrders.size}
          onConfirm={handleConfirmHandoff}
          onCancel={() => {
            setShowHandoffModal(false);
            setCurrentGroup(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// Handoff Confirmation Modal
function HandoffModal({
  orderCount,
  onConfirm,
  onCancel,
  isSubmitting,
}: {
  orderCount: number;
  onConfirm: (carrier: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}) {
  const [carrier, setCarrier] = useState('');

  const CARRIERS = [
    { value: 'aramex', label: 'Aramex' },
    { value: 'emirates_post', label: 'Emirates Post' },
    { value: 'fetchr', label: 'Fetchr' },
    { value: 'smsa', label: 'SMSA' },
    { value: 'dhl', label: 'DHL' },
    { value: 'marketplace', label: 'Marketplace Pickup' },
    { value: 'self_delivery', label: 'Self Delivery' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-2">Confirm Handoff</h2>
        <p className="text-muted-foreground mb-6">
          You are handing off {orderCount} order{orderCount !== 1 ? 's' : ''} for shipping.
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Carrier / Pickup Method</label>
          <select
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-background"
          >
            <option value="">Select carrier...</option>
            {CARRIERS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-muted/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">📋</span>
            <span>
              After confirmation, orders will be marked as &quot;Shipped&quot; and tracking can be added later.
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(carrier)}
            disabled={!carrier || isSubmitting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Handoff'}
          </button>
        </div>
      </div>
    </div>
  );
}
