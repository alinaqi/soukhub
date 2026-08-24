'use client';

import { useState } from 'react';
import type { Supplier } from '@/types/database';

interface SupplierWithBrands extends Supplier {
  brands: string[];
  pending_orders_count: number;
}

interface SupplierCardProps {
  supplier: SupplierWithBrands;
  onUpdate: (supplier: SupplierWithBrands) => void;
  onDeactivate: (id: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SupplierCard({ supplier, onUpdate, onDeactivate }: SupplierCardProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const whatsappLink = `https://wa.me/${supplier.whatsapp_number.replace(/\+/g, '')}`;

  const handleDeactivate = async () => {
    if (!confirm(`Deactivate ${supplier.name}? They will no longer receive order requests.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onDeactivate(supplier.id);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to deactivate supplier');
      }
    } catch (error) {
      console.error('Error deactivating supplier:', error);
      alert('Failed to deactivate supplier');
    } finally {
      setLoading(false);
    }
  };

  const formatDeliveryTimes = (times: string[]) => {
    if (!times || times.length === 0) return 'Not set';
    return times.join(', ');
  };

  return (
    <div
      className={`rounded-xl border bg-card p-5 transition-all hover:shadow-md ${
        !supplier.is_active ? 'opacity-60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
            👤
          </div>
          <div>
            <h3 className="font-semibold text-lg">{supplier.name}</h3>
            {!supplier.is_active && (
              <span className="text-xs text-red-500 font-medium">Inactive</span>
            )}
          </div>
        </div>
        {supplier.pending_orders_count > 0 && (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            {supplier.pending_orders_count} pending
          </span>
        )}
      </div>

      {/* Contact */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span>📱</span>
          <span className="text-muted-foreground">{supplier.whatsapp_number}</span>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium hover:bg-green-600 transition-colors"
          >
            WhatsApp
          </a>
        </div>
        {supplier.email && (
          <div className="flex items-center gap-2 text-sm">
            <span>📧</span>
            <span className="text-muted-foreground">{supplier.email}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border my-4" />

      {/* Brands */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm mb-2">
          <span>📦</span>
          <span className="font-medium">Brands:</span>
        </div>
        {supplier.brands.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {supplier.brands.map((brand) => (
              <span
                key={brand}
                className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-xs"
              >
                {brand}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">No brands assigned</span>
        )}
      </div>

      {/* Delivery Times */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span>🕐</span>
        <span>Delivers: {formatDeliveryTimes(supplier.delivery_times)}</span>
      </div>

      {/* Notes */}
      {supplier.notes && (
        <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground mb-4">
          {supplier.notes}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => window.open(`/orders?supplier=${supplier.id}`, '_self')}
          className="flex-1 px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
        >
          View Orders
        </button>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Edit
        </button>
        {supplier.is_active && (
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            {loading ? '...' : '✕'}
          </button>
        )}
      </div>
    </div>
  );
}
