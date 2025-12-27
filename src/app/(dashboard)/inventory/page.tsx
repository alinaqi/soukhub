'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  variant_id: string;
  quantity: number;
  reserved: number;
  warehouse_location: string | null;
  reorder_point: number;
  updated_at: string;
  product_variants: {
    id: string;
    sku: string;
    name: string | null;
    color: string | null;
    storage: string | null;
    condition: string;
    price: number | null;
    products: {
      id: string;
      name: string;
      brand: string | null;
      category: string | null;
    };
  };
}

interface StockAdjustment {
  variantId: string;
  type: 'add' | 'remove' | 'set';
  quantity: number;
  reason: string;
}

type FilterStatus = 'all' | 'low_stock' | 'out_of_stock' | 'in_stock';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [adjustmentModal, setAdjustmentModal] = useState<InventoryItem | null>(null);
  const [adjustment, setAdjustment] = useState<StockAdjustment>({
    variantId: '',
    type: 'add',
    quantity: 0,
    reason: '',
  });
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('inventory')
      .select(`
        *,
        product_variants!inner (
          id,
          sku,
          name,
          color,
          storage,
          condition,
          price,
          products!inner (
            id,
            name,
            brand,
            category,
            user_id
          )
        )
      `)
      .eq('product_variants.products.user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventory:', error);
    } else {
      setInventory(data as unknown as InventoryItem[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const filteredInventory = inventory.filter(item => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery ||
      item.product_variants.sku.toLowerCase().includes(searchLower) ||
      item.product_variants.products.name.toLowerCase().includes(searchLower) ||
      item.product_variants.products.brand?.toLowerCase().includes(searchLower) ||
      item.warehouse_location?.toLowerCase().includes(searchLower);

    // Status filter
    const available = item.quantity - item.reserved;
    let matchesStatus = true;
    if (filterStatus === 'out_of_stock') {
      matchesStatus = available <= 0;
    } else if (filterStatus === 'low_stock') {
      matchesStatus = available > 0 && available <= item.reorder_point;
    } else if (filterStatus === 'in_stock') {
      matchesStatus = available > item.reorder_point;
    }

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: inventory.length,
    totalUnits: inventory.reduce((sum, i) => sum + i.quantity, 0),
    reserved: inventory.reduce((sum, i) => sum + i.reserved, 0),
    lowStock: inventory.filter(i => {
      const available = i.quantity - i.reserved;
      return available > 0 && available <= i.reorder_point;
    }).length,
    outOfStock: inventory.filter(i => i.quantity - i.reserved <= 0).length,
  };

  const openAdjustmentModal = (item: InventoryItem) => {
    setAdjustmentModal(item);
    setAdjustment({
      variantId: item.variant_id,
      type: 'add',
      quantity: 0,
      reason: '',
    });
  };

  const handleAdjustStock = async () => {
    if (!adjustmentModal || adjustment.quantity <= 0) return;

    setSaving(true);
    const currentQty = adjustmentModal.quantity;
    let newQty = currentQty;

    if (adjustment.type === 'add') {
      newQty = currentQty + adjustment.quantity;
    } else if (adjustment.type === 'remove') {
      newQty = Math.max(0, currentQty - adjustment.quantity);
    } else {
      newQty = adjustment.quantity;
    }

    const { error } = await supabase
      .from('inventory')
      .update({ quantity: newQty } as never)
      .eq('id', adjustmentModal.id);

    if (error) {
      console.error('Error adjusting stock:', error);
      alert('Failed to adjust stock');
    } else {
      // Log the adjustment
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('activity_log').insert({
          user_id: user.id,
          activity_type: 'inventory_updated',
          title: `Stock ${adjustment.type}: ${adjustmentModal.product_variants.sku}`,
          description: adjustment.reason || `${adjustment.type} ${adjustment.quantity} units`,
          metadata: {
            variant_id: adjustmentModal.variant_id,
            previous_qty: currentQty,
            new_qty: newQty,
            adjustment_type: adjustment.type,
            adjustment_qty: adjustment.quantity,
          },
        } as never);
      }

      setAdjustmentModal(null);
      fetchInventory();
    }
    setSaving(false);
  };

  const getStockStatus = (item: InventoryItem) => {
    const available = item.quantity - item.reserved;
    if (available <= 0) {
      return { label: 'Out of Stock', color: 'bg-error/10 text-error' };
    }
    if (available <= item.reorder_point) {
      return { label: 'Low Stock', color: 'bg-warning/10 text-warning' };
    }
    return { label: 'In Stock', color: 'bg-success/10 text-success' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading inventory...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage stock levels across all products</p>
        </div>
        <Link
          href="/import"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Import Inventory
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total SKUs</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Total Units</div>
          <div className="text-2xl font-bold">{stats.totalUnits.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Reserved</div>
          <div className="text-2xl font-bold">{stats.reserved.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Low Stock</div>
          <div className="text-2xl font-bold text-warning">{stats.lowStock}</div>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="text-sm text-muted-foreground">Out of Stock</div>
          <div className="text-2xl font-bold text-error">{stats.outOfStock}</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {stats.lowStock > 0 && (
        <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚠️</span>
            <span className="font-semibold text-warning">Low Stock Alert</span>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            {stats.lowStock} items are running low on stock and may need reordering.
          </p>
          <button
            onClick={() => setFilterStatus('low_stock')}
            className="text-sm text-warning hover:underline"
          >
            View low stock items →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by SKU, product, brand, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm"
        >
          <option value="all">All Items</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>

      {/* Inventory Grid */}
      {filteredInventory.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-4xl mb-4">📦</div>
          <h2 className="text-lg font-semibold mb-2">No inventory items found</h2>
          <p className="text-muted-foreground mb-4">
            {inventory.length === 0
              ? 'Import your inventory data to get started'
              : 'No items match your current filters'}
          </p>
          {inventory.length === 0 && (
            <Link
              href="/import"
              className="inline-block rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90"
            >
              Import Inventory
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Product</th>
                  <th className="px-4 py-3 text-left font-medium">SKU</th>
                  <th className="px-4 py-3 text-left font-medium">Variant</th>
                  <th className="px-4 py-3 text-center font-medium">Available</th>
                  <th className="px-4 py-3 text-center font-medium">Reserved</th>
                  <th className="px-4 py-3 text-center font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">Location</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredInventory.map((item) => {
                  const available = item.quantity - item.reserved;
                  const status = getStockStatus(item);
                  return (
                    <tr key={item.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.product_variants.products.name}</div>
                        {item.product_variants.products.brand && (
                          <div className="text-xs text-muted-foreground">
                            {item.product_variants.products.brand}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {item.product_variants.sku}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.product_variants.color && (
                            <span className="px-2 py-0.5 bg-muted rounded text-xs">
                              {item.product_variants.color}
                            </span>
                          )}
                          {item.product_variants.storage && (
                            <span className="px-2 py-0.5 bg-muted rounded text-xs">
                              {item.product_variants.storage}
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-muted rounded text-xs capitalize">
                            {item.product_variants.condition}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-medium">
                        <span className={available <= 0 ? 'text-error' : available <= item.reorder_point ? 'text-warning' : ''}>
                          {available}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">
                        {item.reserved}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.warehouse_location || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openAdjustmentModal(item)}
                          className="px-3 py-1 text-xs rounded-lg border border-border hover:bg-muted"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-md">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-semibold">Adjust Stock</h2>
              <p className="text-sm text-muted-foreground">
                {adjustmentModal.product_variants.products.name} ({adjustmentModal.product_variants.sku})
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm">Current Stock</span>
                <span className="font-bold">{adjustmentModal.quantity} units</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Adjustment Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'add', label: 'Add Stock', icon: '+' },
                    { value: 'remove', label: 'Remove', icon: '−' },
                    { value: 'set', label: 'Set To', icon: '=' },
                  ].map(({ value, label, icon }) => (
                    <button
                      key={value}
                      onClick={() => setAdjustment(prev => ({ ...prev, type: value as 'add' | 'remove' | 'set' }))}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        adjustment.type === value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      <div className="text-xl font-bold">{icon}</div>
                      <div className="text-xs">{label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={adjustment.quantity}
                  onChange={(e) => setAdjustment(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Reason (optional)</label>
                <input
                  type="text"
                  placeholder="e.g., New shipment received, Damaged goods"
                  value={adjustment.reason}
                  onChange={(e) => setAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2"
                />
              </div>

              {adjustment.quantity > 0 && (
                <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                  <span className="text-sm">New Stock Level</span>
                  <span className="font-bold">
                    {adjustment.type === 'add'
                      ? adjustmentModal.quantity + adjustment.quantity
                      : adjustment.type === 'remove'
                      ? Math.max(0, adjustmentModal.quantity - adjustment.quantity)
                      : adjustment.quantity} units
                  </span>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex gap-4">
              <button
                onClick={() => setAdjustmentModal(null)}
                className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                disabled={saving || adjustment.quantity <= 0}
                className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
