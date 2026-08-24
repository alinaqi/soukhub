'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  packed_quantity?: number;
}

interface PackingOrder {
  id: string;
  marketplace_order_id: string;
  marketplace: string;
  customer_name: string;
  shipping_city: string;
  shipping_address?: string;
  total: number;
  currency: string;
  items: OrderItem[];
  supplierOrder?: {
    id: string;
    status: string;
    supplier_name: string;
  };
}

interface PackingStationProps {
  orders: PackingOrder[];
  totalCount: number;
}

export function PackingStation({ orders: initialOrders, totalCount }: PackingStationProps) {
  const [orders, setOrders] = useState<PackingOrder[]>(initialOrders);
  const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
  const [packedItems, setPackedItems] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOrder = orders[currentOrderIndex];
  const packedCount = orders.length > 0 ? currentOrderIndex : 0;

  // Calculate if current order is fully packed
  const isCurrentOrderFullyPacked = currentOrder?.items.every(
    (item) => (packedItems[item.id] || 0) >= item.quantity
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'Enter':
          if (isCurrentOrderFullyPacked && !isSubmitting) {
            handleMarkAsPacked();
          }
          break;
        case 'ArrowRight':
          if (currentOrderIndex < orders.length - 1) {
            setCurrentOrderIndex((i) => i + 1);
            setPackedItems({});
          }
          break;
        case 'ArrowLeft':
          if (currentOrderIndex > 0) {
            setCurrentOrderIndex((i) => i - 1);
            setPackedItems({});
          }
          break;
        case 'p':
        case 'P':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowPrintPreview(true);
          }
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const itemIndex = parseInt(e.key) - 1;
          if (currentOrder?.items[itemIndex]) {
            handlePackItem(currentOrder.items[itemIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentOrder, isCurrentOrderFullyPacked, isSubmitting, currentOrderIndex, orders.length]);

  const handlePackItem = useCallback((itemId: string) => {
    const item = currentOrder?.items.find((i) => i.id === itemId);
    if (!item) return;

    setPackedItems((prev) => {
      const current = prev[itemId] || 0;
      if (current >= item.quantity) return prev;
      return { ...prev, [itemId]: current + 1 };
    });
  }, [currentOrder]);

  const handleUnpackItem = useCallback((itemId: string) => {
    setPackedItems((prev) => {
      const current = prev[itemId] || 0;
      if (current <= 0) return prev;
      return { ...prev, [itemId]: current - 1 };
    });
  }, []);

  const handleMarkAsPacked = async () => {
    if (!currentOrder || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/packing/mark-packed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: currentOrder.id,
          supplier_order_id: currentOrder.supplierOrder?.id,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to mark as packed');
      }

      // Show success message
      setSuccessMessage(`Order ${currentOrder.marketplace_order_id} packed!`);
      setTimeout(() => setSuccessMessage(null), 2000);

      // Remove this order and move to next
      const newOrders = orders.filter((_, i) => i !== currentOrderIndex);
      setOrders(newOrders);

      if (currentOrderIndex >= newOrders.length && newOrders.length > 0) {
        setCurrentOrderIndex(newOrders.length - 1);
      }
      setPackedItems({});
    } catch (error) {
      console.error('Error marking as packed:', error);
      alert('Failed to mark as packed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <span className="text-6xl mb-4">📦</span>
        <h2 className="text-xl font-semibold mb-2">No orders to pack</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Orders will appear here when suppliers deliver products.
          Check the Operations page for order status.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="max-w-4xl mx-auto">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-pulse">
          {successMessage}
        </div>
      )}

      {/* Header Stats */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Packing Station</h1>
          <p className="text-muted-foreground">
            {packedCount} of {totalCount} packed today
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-sm text-muted-foreground">remaining</div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${totalCount > 0 ? ((totalCount - orders.length) / totalCount) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => {
            setCurrentOrderIndex((i) => Math.max(0, i - 1));
            setPackedItems({});
          }}
          disabled={currentOrderIndex === 0}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
        >
          ← Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Order {currentOrderIndex + 1} of {orders.length}
        </span>
        <button
          onClick={() => {
            setCurrentOrderIndex((i) => Math.min(orders.length - 1, i + 1));
            setPackedItems({});
          }}
          disabled={currentOrderIndex === orders.length - 1}
          className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
        >
          Next →
        </button>
      </div>

      {/* Current Order Card */}
      {currentOrder && (
        <div className="bg-card border rounded-xl overflow-hidden">
          {/* Order Header */}
          <div className="p-4 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">
                    {currentOrder.marketplace_order_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    currentOrder.marketplace === 'amazon' ? 'bg-orange-100 text-orange-700' :
                    currentOrder.marketplace === 'noon' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {currentOrder.marketplace}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currentOrder.customer_name} • {currentOrder.shipping_city}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {currentOrder.currency} {currentOrder.total.toFixed(2)}
                </div>
                {currentOrder.supplierOrder && (
                  <div className="text-sm text-muted-foreground">
                    via {currentOrder.supplierOrder.supplier_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Checklist */}
          <div className="p-4">
            <h3 className="font-medium mb-3">Items to Pack</h3>
            <div className="space-y-3">
              {currentOrder.items.map((item, index) => {
                const packed = packedItems[item.id] || 0;
                const isFullyPacked = packed >= item.quantity;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isFullyPacked ? 'bg-green-50 border-green-200' : 'bg-background'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono">
                          [{index + 1}]
                        </span>
                        <span className={isFullyPacked ? 'line-through text-muted-foreground' : ''}>
                          {item.product_name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUnpackItem(item.id)}
                        disabled={packed === 0}
                        className="w-8 h-8 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className={`font-mono text-lg min-w-[4rem] text-center ${
                        isFullyPacked ? 'text-green-600' : ''
                      }`}>
                        {packed}/{item.quantity}
                      </span>
                      <button
                        onClick={() => handlePackItem(item.id)}
                        disabled={isFullyPacked}
                        className="w-8 h-8 rounded border flex items-center justify-center hover:bg-muted disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>

                    {isFullyPacked && (
                      <span className="text-green-600 text-lg">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t bg-muted/20">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-muted"
              >
                Print Slip (Ctrl+P)
              </button>

              <button
                onClick={handleMarkAsPacked}
                disabled={!isCurrentOrderFullyPacked || isSubmitting}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isCurrentOrderFullyPacked
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Mark as Packed (Enter)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium text-sm mb-2">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">1-9</kbd> Pack item by number</div>
          <div><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> Mark as packed</div>
          <div><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">←/→</kbd> Navigate orders</div>
          <div><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+P</kbd> Print packing slip</div>
        </div>
      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && currentOrder && (
        <PackingSlipModal
          order={currentOrder}
          onClose={() => setShowPrintPreview(false)}
        />
      )}
    </div>
  );
}

// Packing Slip Modal
function PackingSlipModal({
  order,
  onClose,
}: {
  order: PackingOrder;
  onClose: () => void;
}) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Packing Slip - ${order.marketplace_order_id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .order-id { font-size: 24px; font-weight: bold; }
          .customer { margin-bottom: 20px; }
          .items { width: 100%; border-collapse: collapse; }
          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .items th { background: #f5f5f5; }
          .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Packing Slip Preview</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>

        <div ref={printRef} className="p-6">
          <div className="header text-center mb-6">
            <div className="text-2xl font-bold">{order.marketplace_order_id}</div>
            <div className="text-sm text-gray-600">{order.marketplace.toUpperCase()}</div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-600">Ship to:</div>
            <div className="font-medium">{order.customer_name}</div>
            {order.shipping_address && <div className="text-sm">{order.shipping_address}</div>}
            <div className="text-sm">{order.shipping_city}</div>
          </div>

          <table className="w-full border-collapse mb-6">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">#</th>
                <th className="text-left py-2">Item</th>
                <th className="text-right py-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">{item.product_name}</td>
                  <td className="py-2 text-right">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="text-center text-sm text-gray-500">
            Thank you for your order!
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg"
          >
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
