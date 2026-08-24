'use client';

import { useState, useEffect } from 'react';
import { CustomerCommunication } from './CustomerCommunication';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  total_orders: number;
  total_spent: number;
  first_order_date: string | null;
  last_order_date: string | null;
  created_at: string;
}

interface CustomerStats {
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  first_order_date: string;
  last_order_date: string;
  average_order_value: number;
  favorite_brands: string[];
  is_repeat: boolean;
  is_vip: boolean;
  days_since_last_order: number;
}

export function CustomersClient({ userId }: { userId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ created: number; updated: number } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'vip' | 'repeat' | 'new'>('all');
  const [detailTab, setDetailTab] = useState<'info' | 'communicate'>('info');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncFromOrders = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const response = await fetch('/api/customers/sync-from-orders', {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        setSyncResult({ created: data.created, updated: data.updated });
        fetchCustomers();
      }
    } catch (error) {
      console.error('Failed to sync customers:', error);
    } finally {
      setSyncing(false);
    }
  };

  const fetchCustomerStats = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/stats`);
      const data = await response.json();
      if (response.ok && data.stats) {
        setCustomerStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch customer stats:', error);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerStats(null);
    setDetailTab('info');
    fetchCustomerStats(customer.id);
  };

  const handleCommunicationSent = async (type: 'email' | 'whatsapp', templateId: string) => {
    if (!selectedCustomer) return;
    try {
      await fetch('/api/customers/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          type,
          templateId,
        }),
      });
    } catch (error) {
      console.error('Failed to log communication:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter and search customers
  const filteredCustomers = customers.filter((customer) => {
    // Search filter
    const matchesSearch =
      searchTerm === '' ||
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm);

    // Type filter
    let matchesFilter = true;
    if (filter === 'vip') {
      matchesFilter = customer.total_orders >= 5;
    } else if (filter === 'repeat') {
      matchesFilter = customer.total_orders >= 2 && customer.total_orders < 5;
    } else if (filter === 'new') {
      matchesFilter = customer.total_orders === 1;
    }

    return matchesSearch && matchesFilter;
  });

  // Stats summary
  const totalCustomers = customers.length;
  const vipCount = customers.filter((c) => c.total_orders >= 5).length;
  const repeatCount = customers.filter((c) => c.total_orders >= 2).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and track loyalty
          </p>
        </div>
        <button
          onClick={syncFromOrders}
          disabled={syncing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {syncing ? (
            <>
              <span className="animate-spin">⟳</span>
              Syncing...
            </>
          ) : (
            <>
              <span>🔄</span>
              Sync from Orders
            </>
          )}
        </button>
      </div>

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-600 dark:text-green-400">
          Sync complete: {syncResult.created} new customers, {syncResult.updated} updated
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Customers</div>
          <div className="text-2xl font-bold">{totalCustomers}</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">VIP Customers</div>
          <div className="text-2xl font-bold text-yellow-600">{vipCount}</div>
          <div className="text-xs text-muted-foreground">5+ orders</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Repeat Customers</div>
          <div className="text-2xl font-bold text-blue-600">{repeatCount}</div>
          <div className="text-xs text-muted-foreground">2+ orders</div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Revenue</div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'vip', 'repeat', 'new'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f === 'all' ? 'All' : f === 'vip' ? '⭐ VIP' : f === 'repeat' ? '🔄 Repeat' : '🆕 New'}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List and Detail */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 bg-card rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Contact</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Orders</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Spent</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {customers.length === 0 ? (
                        <div>
                          <p className="mb-2">No customers yet</p>
                          <p className="text-sm">
                            Click &quot;Sync from Orders&quot; to extract customers from your orders
                          </p>
                        </div>
                      ) : (
                        'No customers match your search'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      onClick={() => selectCustomer(customer)}
                      className={`border-b border-border cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedCustomer?.id === customer.id ? 'bg-muted' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-medium">{customer.name}</div>
                        {customer.city && (
                          <div className="text-sm text-muted-foreground">{customer.city}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {customer.email && <div>{customer.email}</div>}
                          {customer.phone && (
                            <div className="text-muted-foreground">{customer.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-medium">{customer.total_orders}</span>
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(customer.total_spent)}
                      </td>
                      <td className="p-4 text-center">
                        <InlineBadge totalOrders={customer.total_orders} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Detail */}
        <div className="bg-card rounded-lg border">
          {selectedCustomer ? (
            <div className="space-y-0">
              {/* Customer Header */}
              <div className="text-center p-6 border-b border-border">
                <div className="text-4xl mb-2">
                  {customerStats?.is_vip ? '⭐' : customerStats?.is_repeat ? '🔄' : '👤'}
                </div>
                <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                {customerStats && (
                  <div className="mt-1">
                    <InlineBadge totalOrders={customerStats.total_orders} />
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setDetailTab('info')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    detailTab === 'info'
                      ? 'text-foreground border-b-2 border-primary bg-muted/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  👤 Info
                </button>
                <button
                  onClick={() => setDetailTab('communicate')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    detailTab === 'communicate'
                      ? 'text-foreground border-b-2 border-primary bg-muted/30'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  💬 Communicate
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {detailTab === 'info' ? (
                  <div className="space-y-6">
                    <div className="space-y-3 text-sm">
                      {selectedCustomer.email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email</span>
                          <a
                            href={`mailto:${selectedCustomer.email}`}
                            className="text-primary hover:underline"
                          >
                            {selectedCustomer.email}
                          </a>
                        </div>
                      )}
                      {selectedCustomer.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <a
                            href={`https://wa.me/${selectedCustomer.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline"
                          >
                            {selectedCustomer.phone}
                          </a>
                        </div>
                      )}
                      {selectedCustomer.city && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">City</span>
                          <span>{selectedCustomer.city}</span>
                        </div>
                      )}
                    </div>

                    {customerStats && (
                      <>
                        <div className="border-t border-border pt-4 space-y-3 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Orders</span>
                            <span className="font-medium">{customerStats.total_orders}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Spent</span>
                            <span className="font-medium">{formatCurrency(customerStats.total_spent)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Avg Order</span>
                            <span className="font-medium">
                              {formatCurrency(customerStats.average_order_value)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">First Order</span>
                            <span>{formatDate(customerStats.first_order_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Order</span>
                            <span>{formatDate(customerStats.last_order_date)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Active</span>
                            <span>{customerStats.days_since_last_order} days ago</span>
                          </div>
                        </div>

                        {customerStats.favorite_brands && customerStats.favorite_brands.length > 0 && (
                          <div className="border-t border-border pt-4">
                            <div className="text-sm text-muted-foreground mb-2">Favorite Brands</div>
                            <div className="flex flex-wrap gap-1">
                              {customerStats.favorite_brands.slice(0, 3).map((brand, i) => (
                                <span key={i} className="text-xs px-2 py-1 bg-muted rounded-full">
                                  {brand}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {(customerStats.is_vip || customerStats.is_repeat) && (
                          <button
                            onClick={() => setShowThankYou(true)}
                            className="w-full px-4 py-2 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
                          >
                            Generate Thank You Note
                          </button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <CustomerCommunication
                    customer={{
                      id: selectedCustomer.id,
                      name: selectedCustomer.name,
                      firstName: selectedCustomer.name.split(' ')[0],
                      email: selectedCustomer.email,
                      phone: selectedCustomer.phone,
                      totalOrders: customerStats?.total_orders || selectedCustomer.total_orders,
                      totalSpent: customerStats?.total_spent || selectedCustomer.total_spent,
                      lastOrderDate: customerStats?.last_order_date || selectedCustomer.last_order_date,
                      isVip: customerStats?.is_vip,
                      favoriteBrands: customerStats?.favorite_brands,
                    }}
                    onCommunicationSent={handleCommunicationSent}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8 p-6">
              <div className="text-4xl mb-2">👆</div>
              <p>Select a customer to see details</p>
            </div>
          )}
        </div>
      </div>

      {/* Thank You Note Modal */}
      {showThankYou && selectedCustomer && customerStats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold">Thank You Note</h3>
              <button
                onClick={() => setShowThankYou(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <SimpleThankYouNote
                customerName={selectedCustomer.name}
                orderCount={customerStats.total_orders}
                isVip={customerStats.is_vip}
                favoriteBrands={customerStats.favorite_brands || []}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline badge component
function InlineBadge({ totalOrders }: { totalOrders: number }) {
  if (totalOrders >= 5) {
    return (
      <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full">
        ⭐ VIP
      </span>
    );
  }
  if (totalOrders >= 2) {
    return (
      <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-full">
        🔄 Repeat
      </span>
    );
  }
  return (
    <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
      New
    </span>
  );
}

// Simple thank you note component
function SimpleThankYouNote({
  customerName,
  orderCount,
  isVip,
  favoriteBrands,
}: {
  customerName: string;
  orderCount: number;
  isVip: boolean;
  favoriteBrands: string[];
}) {
  const firstName = customerName.split(' ')[0];
  const brandMention = favoriteBrands.length > 0 ? favoriteBrands[0] : 'your favorite';

  const generateNote = () => {
    if (isVip) {
      return `Dear ${firstName},

Thank you for being one of our most valued VIP customers! This is your ${orderCount}${getOrdinalSuffix(orderCount)} order with us, and we truly appreciate your continued trust and loyalty.

We love that you're a fan of ${brandMention} products!

As a VIP customer, you're always our priority. If you ever need anything, don't hesitate to reach out.

With gratitude,
Your Team`;
    }

    return `Hi ${firstName}!

Thank you for your order! We're so happy to have you back for your ${orderCount}${getOrdinalSuffix(orderCount)} purchase with us.

We noticed you love ${brandMention} - great choice!

We appreciate your continued support!

Best regards,
Your Team`;
  };

  const getOrdinalSuffix = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const note = generateNote();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Thank You Note</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 40px; max-width: 500px; margin: 0 auto; }
            .note { border: 2px solid ${isVip ? '#fbbf24' : '#e5e7eb'}; border-radius: 12px; padding: 30px; }
            .header { text-align: center; font-size: 24px; margin-bottom: 20px; }
            .content { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="note">
            <div class="header">${isVip ? '⭐ VIP Customer ⭐' : '💝 Thank You! 💝'}</div>
            <div class="content">${note}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(note);
  };

  return (
    <div className="space-y-4">
      <div className={`border rounded-lg p-4 ${isVip ? 'border-yellow-500/30 bg-yellow-500/10' : 'border-border bg-muted'}`}>
        <pre className="whitespace-pre-wrap text-sm font-sans text-foreground">{note}</pre>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={handleCopy}
          className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted"
        >
          Copy
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Print Note
        </button>
      </div>
    </div>
  );
}
