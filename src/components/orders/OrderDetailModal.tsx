'use client';

import { useState } from 'react';
import type { Order } from '@/types/supabase';

interface OrderDetailModalProps {
  order: Order;
  onClose: () => void;
  onUpdate: (orderId: string, updates: Partial<Order>) => Promise<void>;
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'processing', label: 'Processing', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ready_to_ship', label: 'Ready to Ship', color: 'bg-blue-100 text-blue-700' },
  { value: 'shipped', label: 'Shipped', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-purple-100 text-purple-700' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' },
  { value: 'returned', label: 'Returned', color: 'bg-orange-100 text-orange-700' },
  { value: 'refunded', label: 'Refunded', color: 'bg-pink-100 text-pink-700' },
];

export function OrderDetailModal({ order, onClose, onUpdate }: OrderDetailModalProps) {
  const [status, setStatus] = useState<string>(order.status || 'pending');
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [carrier, setCarrier] = useState(order.carrier || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    setError('');

    try {
      await onUpdate(order.id, {
        status: status as Order['status'],
        tracking_number: trackingNumber || null,
        carrier: carrier || null,
        notes: notes || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatusInfo = ORDER_STATUSES.find((s) => s.value === order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Order Details</h2>
            <p className="text-sm text-muted-foreground">
              {order.marketplace_order_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Marketplace</label>
              <p className="font-medium capitalize">{order.marketplace}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Order Date</label>
              <p className="font-medium">
                {new Date(order.order_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Current Status</label>
              <p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${currentStatusInfo?.color}`}
                >
                  {currentStatusInfo?.label}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Total</label>
              <p className="font-medium">
                {order.currency} {order.total?.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground">Name</label>
                <p className="font-medium">{order.customer_name || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Email</label>
                <p className="font-medium">{order.customer_email || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Phone</label>
                <p className="font-medium">{order.customer_phone || '-'}</p>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">City</label>
                <p className="font-medium">{order.shipping_city || '-'}</p>
              </div>
            </div>
          </div>

          {/* Edit Section */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-3">Update Order</h3>

            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tracking */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Carrier</label>
                  <input
                    type="text"
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., Aramex, DHL"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background resize-none"
                  placeholder="Add internal notes..."
                />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {order.status !== 'delivered' && (
                <button
                  onClick={() => setStatus('delivered')}
                  className="px-3 py-1.5 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  Mark as Delivered
                </button>
              )}
              {order.status !== 'shipped' && order.status !== 'delivered' && (
                <button
                  onClick={() => setStatus('shipped')}
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                >
                  Mark as Shipped
                </button>
              )}
              {order.status && !['cancelled', 'returned', 'refunded'].includes(order.status) && (
                <button
                  onClick={() => setStatus('cancelled')}
                  className="px-3 py-1.5 text-sm rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                >
                  Cancel Order
                </button>
              )}
              {order.status === 'delivered' && (
                <>
                  <button
                    onClick={() => setStatus('returned')}
                    className="px-3 py-1.5 text-sm rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                  >
                    Process Return
                  </button>
                  <button
                    onClick={() => setStatus('refunded')}
                    className="px-3 py-1.5 text-sm rounded-lg bg-pink-100 text-pink-700 hover:bg-pink-200 transition-colors"
                  >
                    Issue Refund
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
