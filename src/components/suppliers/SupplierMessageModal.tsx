'use client';

import { useState } from 'react';

interface SupplierOrder {
  id: string;
  marketplace_order_id: string;
  product_name: string;
  quantity: number;
}

interface Supplier {
  id: string;
  name: string;
  whatsapp_number: string;
  email?: string;
  preferred_contact: 'whatsapp' | 'email' | 'both';
}

interface SupplierMessageModalProps {
  supplier: Supplier;
  orders: SupplierOrder[];
  onClose: () => void;
  onSent: () => void;
}

type ContactMethod = 'whatsapp' | 'email';

export function SupplierMessageModal({
  supplier,
  orders,
  onClose,
  onSent,
}: SupplierMessageModalProps) {
  const [method, setMethod] = useState<ContactMethod>(
    supplier.preferred_contact === 'email' ? 'email' : 'whatsapp'
  );
  const [isSending, setIsSending] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const hasEmail = Boolean(supplier.email);
  const hasWhatsApp = Boolean(supplier.whatsapp_number);

  const handleSend = async () => {
    setIsSending(true);

    try {
      const supplierOrderIds = orders.map((o) => o.id);

      if (method === 'whatsapp') {
        // Generate WhatsApp message
        const response = await fetch('/api/whatsapp/send-supplier-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_order_ids: supplierOrderIds,
            custom_message: useCustom ? customMessage : undefined,
          }),
        });

        const data = await response.json();

        if (response.ok && data.results?.[0]?.whatsapp_link) {
          // Open WhatsApp
          window.open(data.results[0].whatsapp_link, '_blank');
          onSent();
        }
      } else {
        // Send email
        const response = await fetch(`/api/suppliers/${supplier.id}/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_order_ids: supplierOrderIds,
            custom_body: useCustom ? customMessage : undefined,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.email_link) {
            // Mailto fallback
            window.open(data.email_link, '_blank');
          }
          onSent();
        }
      }
    } catch (error) {
      console.error('Failed to send:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Message Supplier</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">{supplier.name}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Contact Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Send via
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setMethod('whatsapp')}
                disabled={!hasWhatsApp}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  method === 'whatsapp'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!hasWhatsApp ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-1">📱</div>
                <div className="font-medium">WhatsApp</div>
                <div className="text-xs text-gray-500">Instant</div>
              </button>

              <button
                onClick={() => setMethod('email')}
                disabled={!hasEmail}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  method === 'email'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${!hasEmail ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="text-2xl mb-1">📧</div>
                <div className="font-medium">Email</div>
                <div className="text-xs text-gray-500">With records</div>
              </button>
            </div>

            {!hasEmail && method === 'whatsapp' && (
              <p className="text-xs text-gray-500 mt-2">
                No email on file.{' '}
                <button className="text-blue-600 hover:underline">Add email</button>
              </p>
            )}
          </div>

          {/* Orders Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Orders to send ({orders.length})
            </label>
            <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
              {orders.map((order) => (
                <div key={order.id} className="text-sm py-1">
                  <span className="font-medium">#{order.marketplace_order_id}</span>
                  <span className="text-gray-500 ml-2">
                    {order.product_name} ×{order.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Message Toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">Customize message</span>
            </label>

            {useCustom && (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Enter your custom message..."
                rows={4}
                className="mt-3 w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>

          {/* Contact Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              {method === 'whatsapp' ? (
                <>
                  <span>📱</span>
                  <span>{supplier.whatsapp_number}</span>
                </>
              ) : (
                <>
                  <span>📧</span>
                  <span>{supplier.email || 'No email'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSending}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSending}
            className={`px-6 py-2 text-sm text-white rounded-md transition-colors disabled:opacity-50 ${
              method === 'whatsapp'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSending ? 'Sending...' : method === 'whatsapp' ? 'Open WhatsApp' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
}
