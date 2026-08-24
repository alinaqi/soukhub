'use client';

import { useState, useEffect } from 'react';

interface AlternativeSupplier {
  id: string;
  name: string;
  whatsapp_number: string;
  products_supplied?: string[];
}

interface AlternativeOption {
  type: 'alternative_supplier' | 'alternative_product' | 'cancel';
  label: string;
  description: string;
  action_data?: Record<string, unknown>;
}

interface CustomerMessage {
  type: 'waiting' | 'alternative' | 'cancel';
  subject: string;
  message: string;
}

interface UnavailableContext {
  supplier_order_id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  marketplace_order_id: string;
  customer_name: string;
  original_supplier_name: string;
  alternative_product?: string;
}

interface UnavailableHandlerProps {
  supplierOrderId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function UnavailableHandler({
  supplierOrderId,
  onComplete,
  onCancel,
}: UnavailableHandlerProps) {
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<UnavailableContext | null>(null);
  const [alternativeSuppliers, setAlternativeSuppliers] = useState<AlternativeSupplier[]>([]);
  const [options, setOptions] = useState<AlternativeOption[]>([]);
  const [customerMessages, setCustomerMessages] = useState<CustomerMessage[]>([]);
  const [selectedOption, setSelectedOption] = useState<AlternativeOption | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<CustomerMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'options' | 'supplier' | 'message' | 'confirm'>('options');

  useEffect(() => {
    fetchOptions();
  }, [supplierOrderId]);

  const fetchOptions = async () => {
    try {
      const response = await fetch(`/api/supplier-orders/${supplierOrderId}/unavailable`);
      const data = await response.json();

      if (response.ok) {
        setContext(data.context);
        setAlternativeSuppliers(data.alternative_suppliers);
        setOptions(data.options);
        setCustomerMessages(data.customer_messages);
      }
    } catch (error) {
      console.error('Failed to fetch options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (option: AlternativeOption) => {
    setSelectedOption(option);

    if (option.type === 'alternative_supplier') {
      setStep('supplier');
    } else if (option.type === 'alternative_product') {
      setStep('message');
      setSelectedMessage(customerMessages.find((m) => m.type === 'alternative') || null);
    } else if (option.type === 'cancel') {
      setStep('message');
      setSelectedMessage(customerMessages.find((m) => m.type === 'cancel') || null);
    }
  };

  const handleSupplierSelect = (supplierId: string) => {
    setSelectedSupplier(supplierId);
    setStep('confirm');
  };

  const handleSubmit = async () => {
    if (!selectedOption) return;

    setIsSubmitting(true);
    try {
      let action: string;
      let actionData: Record<string, string> = {};

      switch (selectedOption.type) {
        case 'alternative_supplier':
          action = 'try_alternative_supplier';
          actionData = { alternative_supplier_id: selectedSupplier };
          break;
        case 'alternative_product':
          action = 'accept_alternative_product';
          break;
        case 'cancel':
          action = 'cancel';
          break;
        default:
          return;
      }

      const response = await fetch(`/api/supplier-orders/${supplierOrderId}/unavailable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...actionData }),
      });

      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to handle unavailable:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyMessage = async () => {
    if (selectedMessage) {
      await navigator.clipboard.writeText(selectedMessage.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-3 mt-6">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!context) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full text-center">
        <p className="text-red-600">Failed to load order details</p>
        <button onClick={onCancel} className="mt-4 text-blue-600 hover:underline">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚠️</span>
          <div>
            <h2 className="text-lg font-semibold">Product Unavailable</h2>
            <p className="text-sm text-gray-500">
              Order #{context.marketplace_order_id} • {context.customer_name}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Product Info */}
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <strong>{context.original_supplier_name}</strong> reported this item as unavailable:
          </p>
          <p className="font-medium text-red-900 mt-1">
            {context.product_name} × {context.quantity}
          </p>
          {context.alternative_product && (
            <p className="text-sm text-red-700 mt-2">
              Suggested alternative: <strong>{context.alternative_product}</strong>
            </p>
          )}
        </div>

        {/* Step: Options */}
        {step === 'options' && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">What would you like to do?</h3>
            {options.map((option) => (
              <button
                key={option.type}
                onClick={() => handleOptionSelect(option)}
                className="w-full text-left p-4 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {option.type === 'alternative_supplier' && '🔄'}
                    {option.type === 'alternative_product' && '✨'}
                    {option.type === 'cancel' && '❌'}
                  </span>
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Select Supplier */}
        {step === 'supplier' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Select Alternative Supplier</h3>
              <button
                onClick={() => setStep('options')}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back
              </button>
            </div>

            {alternativeSuppliers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No alternative suppliers found</p>
                <button
                  onClick={() => setStep('options')}
                  className="mt-4 text-blue-600 hover:underline"
                >
                  Try another option
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {alternativeSuppliers.map((supplier) => (
                  <button
                    key={supplier.id}
                    onClick={() => handleSupplierSelect(supplier.id)}
                    className={`w-full text-left p-4 border rounded-lg transition-colors ${
                      selectedSupplier === supplier.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-400'
                    }`}
                  >
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-gray-500">{supplier.whatsapp_number}</p>
                    {supplier.products_supplied && supplier.products_supplied.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Previously supplied: {supplier.products_supplied.slice(0, 3).join(', ')}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Customer Message */}
        {step === 'message' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Customer Message</h3>
              <button
                onClick={() => setStep('options')}
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back
              </button>
            </div>

            {/* Message Tabs */}
            <div className="flex gap-2">
              {customerMessages.map((msg) => (
                <button
                  key={msg.type}
                  onClick={() => setSelectedMessage(msg)}
                  className={`px-3 py-1.5 text-sm rounded-md ${
                    selectedMessage?.type === msg.type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {msg.type === 'waiting' && 'Waiting'}
                  {msg.type === 'alternative' && 'Alternative'}
                  {msg.type === 'cancel' && 'Cancellation'}
                </button>
              ))}
            </div>

            {selectedMessage && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">{selectedMessage.subject}</p>
                  <button
                    onClick={copyMessage}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Copy
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>
            )}

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Confirm Action</h3>
              <button
                onClick={() =>
                  setStep(selectedOption?.type === 'alternative_supplier' ? 'supplier' : 'message')
                }
                className="text-sm text-blue-600 hover:underline"
              >
                ← Back
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                {selectedOption?.type === 'alternative_supplier' && (
                  <>
                    This will create a new order request for{' '}
                    <strong>
                      {alternativeSuppliers.find((s) => s.id === selectedSupplier)?.name}
                    </strong>
                    .
                  </>
                )}
                {selectedOption?.type === 'alternative_product' && (
                  <>
                    This will mark the order as confirmed with the alternative product:{' '}
                    <strong>{context.alternative_product}</strong>
                  </>
                )}
                {selectedOption?.type === 'cancel' && (
                  <>
                    This will <strong>cancel</strong> this supplier order. If it&apos;s the only
                    supplier for this order, the main order will also be cancelled.
                  </>
                )}
              </p>
            </div>
          </div>
        )}
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
        {step === 'confirm' && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Processing...' : 'Confirm'}
          </button>
        )}
      </div>
    </div>
  );
}
