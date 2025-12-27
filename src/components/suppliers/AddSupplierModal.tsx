'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/product-data';
import type { Supplier, PreferredContact } from '@/types/database';

interface SupplierWithBrands extends Supplier {
  brands: string[];
  pending_orders_count: number;
}

interface AddSupplierModalProps {
  onClose: () => void;
  onSuccess: (supplier: SupplierWithBrands) => void;
}

// Get unique brands from all categories
const ALL_BRANDS = [...new Set(CATEGORIES.flatMap((c) => c.brands))].sort();

export function AddSupplierModal({ onClose, onSuccess }: AddSupplierModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    whatsapp_number: '',
    secondary_whatsapp: '',
    email: '',
    secondary_email: '',
    preferred_contact: 'whatsapp' as PreferredContact,
    delivery_times: ['10:00 AM', '4:00 PM'],
    notes: '',
    brands: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create supplier');
      }

      onSuccess(data.supplier);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier');
    } finally {
      setLoading(false);
    }
  };

  const toggleBrand = (brand: string) => {
    setFormData((prev) => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter((b) => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleDeliveryTimeChange = (index: number, value: string) => {
    const times = [...formData.delivery_times];
    times[index] = value;
    setFormData((prev) => ({ ...prev, delivery_times: times }));
  };

  const addDeliveryTime = () => {
    setFormData((prev) => ({
      ...prev,
      delivery_times: [...prev.delivery_times, ''],
    }));
  };

  const removeDeliveryTime = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      delivery_times: prev.delivery_times.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold">Add Supplier</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Supplier Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Ali Electronics"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              required
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium mb-2">WhatsApp Number *</label>
            <input
              type="tel"
              value={formData.whatsapp_number}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, whatsapp_number: e.target.value }))
              }
              placeholder="+971 50 123 4567"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">UAE format: +971 5X XXX XXXX</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2">Email (Optional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="supplier@email.com"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Preferred Contact */}
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Contact Method</label>
            <div className="flex gap-2">
              {(['whatsapp', 'email', 'both'] as PreferredContact[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, preferred_contact: method }))}
                  className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.preferred_contact === method
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {method === 'whatsapp' ? '📱 WhatsApp' : method === 'email' ? '📧 Email' : '📱📧 Both'}
                </button>
              ))}
            </div>
          </div>

          {/* Delivery Times */}
          <div>
            <label className="block text-sm font-medium mb-2">Delivery Times</label>
            <div className="space-y-2">
              {formData.delivery_times.map((time, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => handleDeliveryTimeChange(index, e.target.value)}
                    placeholder="e.g., 10:00 AM"
                    className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  {formData.delivery_times.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliveryTime(index)}
                      className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addDeliveryTime}
                className="text-sm text-primary hover:underline"
              >
                + Add delivery time
              </button>
            </div>
          </div>

          {/* Brands */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Brands (select brands this supplier provides)
            </label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg">
              {ALL_BRANDS.map((brand) => (
                <button
                  key={brand}
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    formData.brands.includes(brand)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
            {formData.brands.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {formData.brands.join(', ')}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any notes about this supplier..."
              rows={2}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.name || !formData.whatsapp_number}
            className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Supplier'}
          </button>
        </div>
      </div>
    </div>
  );
}
