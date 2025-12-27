'use client';

import { useState } from 'react';
import { AddSupplierModal } from './AddSupplierModal';
import { SupplierCard } from './SupplierCard';
import type { Supplier } from '@/types/database';

interface SupplierWithBrands extends Supplier {
  brands: string[];
  pending_orders_count: number;
}

interface SuppliersClientProps {
  suppliers: SupplierWithBrands[];
}

export function SuppliersClient({ suppliers: initialSuppliers }: SuppliersClientProps) {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const filteredSuppliers = suppliers.filter((s) => {
    if (!showInactive && !s.is_active) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        s.whatsapp_number.includes(query) ||
        s.brands.some((b) => b.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const activeCount = suppliers.filter((s) => s.is_active).length;
  const totalPending = suppliers.reduce((sum, s) => sum + s.pending_orders_count, 0);

  const handleSupplierAdded = (supplier: SupplierWithBrands) => {
    setSuppliers([supplier, ...suppliers]);
    setShowAddModal(false);
  };

  const handleSupplierUpdated = (updated: SupplierWithBrands) => {
    setSuppliers(suppliers.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleSupplierDeactivated = (id: string) => {
    setSuppliers(suppliers.map((s) => (s.id === id ? { ...s, is_active: false } : s)));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Suppliers</h1>
              <p className="text-muted-foreground">
                Manage your suppliers and brand assignments
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Add Supplier
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{activeCount}</span>
            <span className="text-muted-foreground">Active Suppliers</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-amber-500">{totalPending}</span>
            <span className="text-muted-foreground">Pending Orders</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search suppliers by name, phone, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-border"
          />
          Show inactive
        </label>
      </div>

      {/* Supplier List */}
      <div className="p-6">
        {filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl">🤝</span>
            <h3 className="mt-4 text-lg font-medium">No suppliers yet</h3>
            <p className="text-muted-foreground mt-1">
              Add your first supplier to start routing orders automatically
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
            >
              Add Supplier
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSuppliers.map((supplier) => (
              <SupplierCard
                key={supplier.id}
                supplier={supplier}
                onUpdate={handleSupplierUpdated}
                onDeactivate={handleSupplierDeactivated}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <AddSupplierModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSupplierAdded}
        />
      )}
    </div>
  );
}
