'use client';

import { useState, useEffect } from 'react';
import type { FulfillmentModel, Supplier, WorkflowConfig } from '@/types/database';

interface WorkflowWizardProps {
  config: Partial<WorkflowConfig>;
  suppliers: Supplier[];
  isDefault: boolean;
}

interface BrandRule {
  supplierId: string;
  brand: string;
  priority: number;
}

const FULFILLMENT_MODELS: { value: FulfillmentModel; label: string; description: string; icon: string }[] = [
  {
    value: 'supplier_fulfilled',
    label: 'Supplier Fulfilled',
    description: 'Suppliers deliver products to you for packing and shipping',
    icon: '🤝',
  },
  {
    value: 'self_fulfilled',
    label: 'Self Fulfilled',
    description: 'You manage your own inventory and fulfillment',
    icon: '📦',
  },
  {
    value: 'hybrid',
    label: 'Hybrid',
    description: 'Mix of supplier-fulfilled and self-fulfilled products',
    icon: '🔄',
  },
];

const COMMON_BRANDS = [
  'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony',
  'Nothing', 'Oppo', 'Vivo', 'Realme', 'Motorola', 'Nokia', 'LG',
];

const DELIVERY_TIMES = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
];

export function WorkflowWizard({ config, suppliers: initialSuppliers, isDefault }: WorkflowWizardProps) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);

  // Form state
  const [fulfillmentModel, setFulfillmentModel] = useState<FulfillmentModel>(
    config.fulfillment_model || 'supplier_fulfilled'
  );
  const [brandRules, setBrandRules] = useState<BrandRule[]>([]);
  const [deliverySchedule, setDeliverySchedule] = useState<Record<string, string[]>>(
    config.delivery_schedule || {}
  );
  const [autoRouteOrders, setAutoRouteOrders] = useState(config.auto_route_orders ?? true);
  const [autoSendMessages, setAutoSendMessages] = useState(config.auto_send_supplier_messages ?? false);

  // New supplier form
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', whatsapp: '', brands: '' });
  const [addingSupplier, setAddingSupplier] = useState(false);

  // Load existing brand rules
  useEffect(() => {
    const loadBrandRules = async () => {
      try {
        const res = await fetch('/api/suppliers');
        const data = await res.json();
        if (data.suppliers) {
          setSuppliers(data.suppliers);
          // Extract brand rules from suppliers
          const rules: BrandRule[] = [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.suppliers.forEach((s: any) => {
            s.supplier_brand_rules?.forEach((r: { brand: string; priority: number }) => {
              rules.push({ supplierId: s.id, brand: r.brand, priority: r.priority });
            });
          });
          setBrandRules(rules);
        }
      } catch (error) {
        console.error('Failed to load suppliers:', error);
      }
    };
    loadBrandRules();
  }, []);

  const totalSteps = fulfillmentModel === 'self_fulfilled' ? 2 : 5;

  const handleAddSupplier = async () => {
    if (!newSupplier.name || !newSupplier.whatsapp) return;

    setAddingSupplier(true);
    try {
      const brands = newSupplier.brands
        .split(',')
        .map(b => b.trim())
        .filter(Boolean);

      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSupplier.name,
          whatsapp_number: newSupplier.whatsapp,
          brands,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.error || 'Failed to add supplier');
        return;
      }

      const data = await res.json();
      setSuppliers([...suppliers, data.supplier]);

      // Add brand rules for the new supplier
      brands.forEach((brand, index) => {
        setBrandRules(prev => [...prev, {
          supplierId: data.supplier.id,
          brand,
          priority: index + 1,
        }]);
      });

      setNewSupplier({ name: '', whatsapp: '', brands: '' });
      setShowAddSupplier(false);
    } catch (error) {
      console.error('Failed to add supplier:', error);
      alert('Failed to add supplier');
    } finally {
      setAddingSupplier(false);
    }
  };

  const handleAddBrandRule = (supplierId: string, brand: string) => {
    if (!brand || brandRules.some(r => r.brand === brand)) return;
    setBrandRules([...brandRules, { supplierId, brand, priority: brandRules.length + 1 }]);
  };

  const handleRemoveBrandRule = (brand: string) => {
    setBrandRules(brandRules.filter(r => r.brand !== brand));
  };

  const handleToggleDeliveryTime = (supplierId: string, time: string) => {
    const current = deliverySchedule[supplierId] || [];
    const updated = current.includes(time)
      ? current.filter(t => t !== time)
      : [...current, time].sort((a, b) => {
          const parseTime = (t: string) => {
            const [h, m] = t.split(':');
            let hour = parseInt(h);
            if (t.includes('PM') && hour !== 12) hour += 12;
            if (t.includes('AM') && hour === 12) hour = 0;
            return hour * 60 + parseInt(m);
          };
          return parseTime(a) - parseTime(b);
        });

    setDeliverySchedule({ ...deliverySchedule, [supplierId]: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save workflow config
      const configRes = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fulfillment_model: fulfillmentModel,
          delivery_schedule: deliverySchedule,
          auto_route_orders: autoRouteOrders,
          auto_send_supplier_messages: autoSendMessages,
        }),
      });

      if (!configRes.ok) {
        throw new Error('Failed to save workflow config');
      }

      // Save brand rules (update each supplier)
      for (const supplier of suppliers) {
        const supplierBrands = brandRules
          .filter(r => r.supplierId === supplier.id)
          .map(r => r.brand);

        const supplierDeliveryTimes = deliverySchedule[supplier.id] || [];

        await fetch(`/api/suppliers/${supplier.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brands: supplierBrands,
            delivery_times: supplierDeliveryTimes,
          }),
        });
      }

      alert('Workflow configuration saved!');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">How do you fulfill orders?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Choose how products get to your customers
              </p>
            </div>

            <div className="grid gap-4">
              {FULFILLMENT_MODELS.map((model) => (
                <button
                  key={model.value}
                  onClick={() => setFulfillmentModel(model.value)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    fulfillmentModel === model.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <div className="font-medium">{model.label}</div>
                      <div className="text-sm text-muted-foreground">{model.description}</div>
                    </div>
                    {fulfillmentModel === model.value && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        if (fulfillmentModel === 'self_fulfilled') {
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Automation Settings</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Configure how SoukHub helps manage your orders
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-medium">Auto-mark orders as processing</div>
                    <div className="text-sm text-muted-foreground">
                      Automatically update order status when imported
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoRouteOrders}
                    onChange={(e) => setAutoRouteOrders(e.target.checked)}
                    className="w-5 h-5 rounded"
                  />
                </label>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Your Suppliers</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add suppliers who fulfill your orders
              </p>
            </div>

            {suppliers.length > 0 && (
              <div className="space-y-2">
                {suppliers.map((supplier) => (
                  <div
                    key={supplier.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏪</span>
                      <div>
                        <div className="font-medium">{supplier.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.whatsapp_number}
                        </div>
                      </div>
                    </div>
                    {supplier.is_active && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!showAddSupplier ? (
              <button
                onClick={() => setShowAddSupplier(true)}
                className="w-full p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors"
              >
                + Add Supplier
              </button>
            ) : (
              <div className="p-4 rounded-lg border bg-muted/20 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Supplier Name</label>
                    <input
                      type="text"
                      value={newSupplier.name}
                      onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                      placeholder="e.g., Ahmed Electronics"
                      className="w-full px-3 py-2 rounded-lg border bg-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={newSupplier.whatsapp}
                      onChange={(e) => setNewSupplier({ ...newSupplier, whatsapp: e.target.value })}
                      placeholder="+971 5X XXX XXXX"
                      className="w-full px-3 py-2 rounded-lg border bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Brands (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newSupplier.brands}
                    onChange={(e) => setNewSupplier({ ...newSupplier, brands: e.target.value })}
                    placeholder="Apple, Samsung, Google"
                    className="w-full px-3 py-2 rounded-lg border bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddSupplier}
                    disabled={addingSupplier || !newSupplier.name || !newSupplier.whatsapp}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {addingSupplier ? 'Adding...' : 'Add Supplier'}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddSupplier(false);
                      setNewSupplier({ name: '', whatsapp: '', brands: '' });
                    }}
                    className="px-4 py-2 border rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {suppliers.length === 0 && !showAddSupplier && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add at least one supplier to continue
              </p>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Brand Assignment</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Assign which supplier handles each brand
              </p>
            </div>

            {suppliers.map((supplier) => {
              const supplierBrands = brandRules
                .filter(r => r.supplierId === supplier.id)
                .map(r => r.brand);

              return (
                <div key={supplier.id} className="p-4 rounded-lg border space-y-3">
                  <div className="font-medium flex items-center gap-2">
                    <span>🏪</span>
                    {supplier.name}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {supplierBrands.map((brand) => (
                      <span
                        key={brand}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded text-sm"
                      >
                        {brand}
                        <button
                          onClick={() => handleRemoveBrandRule(brand)}
                          className="hover:text-destructive"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {COMMON_BRANDS.filter(
                      b => !brandRules.some(r => r.brand === b)
                    ).map((brand) => (
                      <button
                        key={brand}
                        onClick={() => handleAddBrandRule(supplier.id, brand)}
                        className="px-2 py-1 text-xs border rounded hover:bg-muted transition-colors"
                      >
                        + {brand}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Delivery Schedule</h3>
              <p className="text-sm text-muted-foreground mb-4">
                When do suppliers typically deliver to you?
              </p>
            </div>

            {suppliers.map((supplier) => {
              const times = deliverySchedule[supplier.id] || [];

              return (
                <div key={supplier.id} className="p-4 rounded-lg border space-y-3">
                  <div className="font-medium flex items-center gap-2">
                    <span>🏪</span>
                    {supplier.name}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {DELIVERY_TIMES.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleToggleDeliveryTime(supplier.id, time)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          times.includes(time)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>

                  {times.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Deliveries at: {times.join(', ')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Automation Settings</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Configure how SoukHub handles orders automatically
              </p>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors">
                <div>
                  <div className="font-medium">Auto-route orders to suppliers</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically assign orders to suppliers based on brand rules
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoRouteOrders}
                  onChange={(e) => setAutoRouteOrders(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:border-primary/50 transition-colors">
                <div>
                  <div className="font-medium">Auto-send WhatsApp messages</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically message suppliers when orders are routed
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoSendMessages}
                  onChange={(e) => setAutoSendMessages(e.target.checked)}
                  className="w-5 h-5 rounded accent-primary"
                />
              </label>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Fulfillment: {FULFILLMENT_MODELS.find(m => m.value === fulfillmentModel)?.label}</li>
                <li>• Suppliers: {suppliers.length} configured</li>
                <li>• Brands: {brandRules.length} assigned</li>
                <li>• Auto-routing: {autoRouteOrders ? 'Enabled' : 'Disabled'}</li>
                <li>• Auto-messaging: {autoSendMessages ? 'Enabled' : 'Disabled'}</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 2:
        return fulfillmentModel === 'self_fulfilled' || suppliers.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Workflow Configuration</h1>
        <p className="text-muted-foreground">
          {isDefault
            ? 'Set up your order fulfillment workflow'
            : 'Update your workflow settings'}
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
          <span className="text-sm text-muted-foreground">
            {Math.round((step / totalSteps) * 100)}% complete
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl border p-6 mb-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Continue →
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        )}
      </div>
    </div>
  );
}
