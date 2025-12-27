'use client';

import { useState, useEffect } from 'react';

interface CustomerStats {
  customer_id: string;
  name: string;
  total_orders: number;
  total_spent: number;
  is_repeat: boolean;
  is_vip: boolean;
  days_since_last_order: number;
  favorite_brands: string[];
}

interface CustomerBadgeProps {
  customerId: string;
  compact?: boolean;
}

export function CustomerBadge({ customerId, compact = false }: CustomerBadgeProps) {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (customerId) {
      fetchStats();
    }
  }, [customerId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}/stats`);
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return null;
  }

  if (compact) {
    // Just show badges inline
    return (
      <div className="inline-flex items-center gap-1">
        {stats.is_vip && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
            ⭐ VIP
          </span>
        )}
        {stats.is_repeat && !stats.is_vip && (
          <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
            🔄 Repeat
          </span>
        )}
        {stats.total_orders > 1 && (
          <span className="text-xs text-gray-500">
            ({stats.total_orders} orders)
          </span>
        )}
      </div>
    );
  }

  // Full stats card
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white border rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{stats.name}</h3>
        <div className="flex gap-1">
          {stats.is_vip && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              ⭐ VIP
            </span>
          )}
          {stats.is_repeat && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              🔄 Repeat
            </span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{stats.total_orders}</div>
          <div className="text-xs text-gray-500">Orders</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {stats.total_spent.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">AED Spent</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">{stats.days_since_last_order}</div>
          <div className="text-xs text-gray-500">Days Ago</div>
        </div>
      </div>

      {/* Favorite Brands */}
      {stats.favorite_brands.length > 0 && (
        <div className="text-xs text-gray-500">
          Favorite: {stats.favorite_brands.join(', ')}
        </div>
      )}
    </div>
  );
}

/**
 * Inline version for order lists
 */
export function CustomerInlineStats({ customerId }: { customerId: string }) {
  return <CustomerBadge customerId={customerId} compact />;
}
