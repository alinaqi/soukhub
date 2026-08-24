'use client';

import { useState } from 'react';
import type { SupplierReplyParsed, ParsedOrderStatus, OrderStatus } from '@/lib/ai/parse-supplier-reply';

interface SupplierReplyReviewProps {
  parsed: SupplierReplyParsed;
  supplierName: string;
  onConfirm: (orders: ParsedOrderStatus[]) => Promise<void>;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-800' },
  { value: 'unavailable', label: 'Unavailable', color: 'bg-red-100 text-red-800' },
  { value: 'alternative_offered', label: 'Alternative', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'unclear', label: 'Unclear', color: 'bg-gray-100 text-gray-800' },
];

export function SupplierReplyReview({
  parsed,
  supplierName,
  onConfirm,
  onCancel,
}: SupplierReplyReviewProps) {
  const [orders, setOrders] = useState<ParsedOrderStatus[]>(parsed.orders);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateOrderStatus = (index: number, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order, i) => (i === index ? { ...order, status } : order))
    );
  };

  const updateOrderField = (
    index: number,
    field: 'alternative_product' | 'expected_delivery' | 'notes',
    value: string
  ) => {
    setOrders((prev) =>
      prev.map((order, i) => (i === index ? { ...order, [field]: value } : order))
    );
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(orders);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getIntentLabel = (intent: string) => {
    const labels: Record<string, string> = {
      all_confirmed: 'All items available',
      all_unavailable: 'All items unavailable',
      partial: 'Partial availability',
      alternative: 'Alternative offered',
      unclear: 'Unclear response',
      question: 'Supplier asking question',
    };
    return labels[intent] || intent;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4">
        <h2 className="text-lg font-semibold">Review Supplier Reply</h2>
        <p className="text-sm text-gray-500">From: {supplierName}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Original Message */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Original Message</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap">
            {parsed.raw_reply}
          </div>
        </div>

        {/* AI Interpretation */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-900">AI Interpretation</h3>
            <span className={`text-sm font-medium ${getConfidenceColor(parsed.confidence)}`}>
              {Math.round(parsed.confidence * 100)}% confident
            </span>
          </div>
          <p className="text-sm text-blue-800 mb-2">
            <strong>Intent:</strong> {getIntentLabel(parsed.overall_intent)}
          </p>
          <p className="text-sm text-blue-700">{parsed.reasoning}</p>
        </div>

        {/* Orders to Update */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Order Status Updates
          </h3>
          <div className="space-y-4">
            {orders.map((order, index) => (
              <div
                key={order.supplier_order_id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    Order #{order.supplier_order_id.slice(0, 8)}
                  </span>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      updateOrderStatus(index, e.target.value as OrderStatus)
                    }
                    className={`text-sm rounded-md px-3 py-1.5 border-0 ${
                      STATUS_OPTIONS.find((s) => s.value === order.status)?.color
                    }`}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional fields based on status */}
                {order.status === 'alternative_offered' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Alternative Product
                    </label>
                    <input
                      type="text"
                      value={order.alternative_product || ''}
                      onChange={(e) =>
                        updateOrderField(index, 'alternative_product', e.target.value)
                      }
                      placeholder="What alternative was offered?"
                      className="w-full text-sm border rounded-md px-3 py-2"
                    />
                  </div>
                )}

                {order.status === 'confirmed' && (
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Expected Delivery
                    </label>
                    <input
                      type="text"
                      value={order.expected_delivery || ''}
                      onChange={(e) =>
                        updateOrderField(index, 'expected_delivery', e.target.value)
                      }
                      placeholder="e.g., Tomorrow, 2 days"
                      className="w-full text-sm border rounded-md px-3 py-2"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Notes</label>
                  <input
                    type="text"
                    value={order.notes || ''}
                    onChange={(e) => updateOrderField(index, 'notes', e.target.value)}
                    placeholder="Any additional notes"
                    className="w-full text-sm border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Updating...' : 'Confirm Updates'}
        </button>
      </div>
    </div>
  );
}
