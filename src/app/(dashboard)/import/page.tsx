'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';
import type { OrderStatus, FulfillmentType, PaymentMethod } from '@/types/supabase';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';
type SupportedMarketplace = 'amazon' | 'cartlow' | 'revibe';

interface ParsedOrder {
  marketplace_order_id: string;
  customer_name?: string;
  status: OrderStatus;
  order_date: string;
  total: number;
  currency: string;
  shipping_city?: string;
  shipping_country?: string;
  fulfillment?: FulfillmentType;
  payment_method?: PaymentMethod;
  raw_data: Record<string, unknown>;
}

interface MarketplaceConfig {
  name: string;
  icon: string;
  delimiter: string;
  orderIdField: string;
  dateField: string;
  totalField: string;
  statusField: string;
  customerField: string;
  cityField: string;
  countryField: string;
  fulfillmentField?: string;
  paymentField?: string;
}

const MARKETPLACE_CONFIGS: Record<SupportedMarketplace, MarketplaceConfig> = {
  amazon: {
    name: 'Amazon',
    icon: '📦',
    delimiter: '\t',
    orderIdField: 'order-id',
    dateField: 'purchase-date',
    totalField: 'item-price',
    statusField: 'shipment-status',
    customerField: 'buyer-name',
    cityField: 'ship-city',
    countryField: 'ship-country',
  },
  cartlow: {
    name: 'Cartlow',
    icon: '🛒',
    delimiter: ',',
    orderIdField: 'id',
    dateField: 'OrderDate',
    totalField: 'Cost',
    statusField: 'Status',
    customerField: 'Customer',
    cityField: 'City',
    countryField: 'Country',
    fulfillmentField: 'fulfillment',
  },
  revibe: {
    name: 'Revibe',
    icon: '📱',
    delimiter: ',',
    orderIdField: 'id',
    dateField: 'Order Date',
    totalField: 'Selling Price',
    statusField: 'Shipment Status',
    customerField: 'Customer Name',
    cityField: 'City',
    countryField: 'Country',
    paymentField: 'Payment Method',
  },
};

function normalizeStatus(status: string): OrderStatus {
  const s = status?.toLowerCase().trim() || '';
  if (s.includes('deliver')) return 'delivered';
  if (s.includes('ship') || s.includes('transit')) return 'shipped';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('return')) return 'returned';
  if (s.includes('refund')) return 'refunded';
  if (s.includes('process')) return 'processing';
  if (s.includes('confirm')) return 'confirmed';
  if (s.includes('ready')) return 'ready_to_ship';
  return 'pending';
}

function normalizeFulfillment(fulfillment: string): FulfillmentType | undefined {
  const f = fulfillment?.toLowerCase().trim() || '';
  if (f.includes('fbs')) return 'fbs';
  if (f.includes('fbc')) return 'fbc';
  if (f.includes('easy')) return 'easy_ship';
  if (f.includes('self') || f.includes('fbm')) return 'self_ship';
  return undefined;
}

function normalizePayment(payment: string): PaymentMethod | undefined {
  const p = payment?.toLowerCase().trim() || '';
  if (p.includes('card') || p.includes('credit') || p.includes('debit')) return 'card';
  if (p.includes('cod') || p.includes('cash')) return 'cod';
  if (p.includes('tabby')) return 'tabby';
  if (p.includes('tamara')) return 'tamara';
  if (p.includes('payjustnow')) return 'payjustnow';
  if (p.includes('payflex')) return 'payflex';
  if (p.includes('bank')) return 'bank_transfer';
  return undefined;
}

function parseNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseDate(value: string): string {
  try {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  } catch {
    // Ignore parse errors
  }
  return new Date().toISOString();
}

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [marketplace, setMarketplace] = useState<SupportedMarketplace | null>(null);
  const [, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedOrder[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(
    null
  );

  const router = useRouter();
  const supabase = createClient();

  const handleFileSelect = useCallback(
    (selectedFile: File, selectedMarketplace: SupportedMarketplace) => {
      setFile(selectedFile);
      setMarketplace(selectedMarketplace);
      setError(null);

      const config = MARKETPLACE_CONFIGS[selectedMarketplace];

      Papa.parse<Record<string, string>>(selectedFile, {
        delimiter: config.delimiter,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const orders: ParsedOrder[] = results.data
              .filter((row) => row[config.orderIdField])
              .map((row) => ({
                marketplace_order_id: String(row[config.orderIdField] || ''),
                customer_name: row[config.customerField] || undefined,
                status: normalizeStatus(row[config.statusField] || ''),
                order_date: parseDate(row[config.dateField] || ''),
                total: parseNumber(row[config.totalField] || '0'),
                currency: 'AED',
                shipping_city: row[config.cityField] || undefined,
                shipping_country: row[config.countryField] || 'AE',
                fulfillment: config.fulfillmentField
                  ? normalizeFulfillment(row[config.fulfillmentField] || '')
                  : undefined,
                payment_method: config.paymentField
                  ? normalizePayment(row[config.paymentField] || '')
                  : undefined,
                raw_data: row as Record<string, unknown>,
              }));

            setParsedData(orders);
            setStep('preview');
          } catch (err) {
            setError('Failed to parse file. Please check the format.');
            console.error(err);
          }
        },
        error: (err) => {
          setError(`Failed to read file: ${err.message}`);
        },
      });
    },
    []
  );

  const handleImport = async () => {
    if (!marketplace || parsedData.length === 0) return;

    setImporting(true);
    setStep('importing');
    setProgress(0);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      return;
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const order = parsedData[i];

      // Use raw insert instead of typed to avoid complex type issues
      const { error: insertError } = await supabase.from('orders').upsert(
        {
          user_id: user.id,
          marketplace,
          marketplace_order_id: order.marketplace_order_id,
          customer_name: order.customer_name,
          status: order.status,
          order_date: order.order_date,
          total: order.total,
          subtotal: order.total,
          currency: order.currency,
          shipping_city: order.shipping_city,
          shipping_country: order.shipping_country,
          fulfillment: order.fulfillment,
          payment_method: order.payment_method,
          raw_data: order.raw_data,
        } as never, // Type assertion for flexibility
        {
          onConflict: 'user_id,marketplace,marketplace_order_id',
        }
      );

      if (insertError) {
        failed++;
        console.error('Import error:', insertError);
      } else {
        success++;
      }

      setProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setImportResult({ success, failed });
    setStep('complete');
    setImporting(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Orders</h1>
        <p className="text-muted-foreground">
          Upload your order data from any marketplace
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Step 1: Select your marketplace
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {(Object.keys(MARKETPLACE_CONFIGS) as SupportedMarketplace[]).map((mp) => {
                const config = MARKETPLACE_CONFIGS[mp];
                return (
                  <label
                    key={mp}
                    className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                      marketplace === mp
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="marketplace"
                      value={mp}
                      checked={marketplace === mp}
                      onChange={() => setMarketplace(mp)}
                      className="hidden"
                    />
                    <span className="text-2xl">{config.icon}</span>
                    <span className="font-medium">{config.name}</span>
                    {marketplace === mp && <span className="ml-auto text-primary">✓</span>}
                  </label>
                );
              })}
            </div>
          </div>

          {marketplace && (
            <div className="rounded-lg border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">
                Step 2: Upload your {MARKETPLACE_CONFIGS[marketplace].name} export file
              </h2>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile && marketplace) {
                      handleFileSelect(selectedFile, marketplace);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-4xl block mb-3">📄</span>
                  <span className="font-medium">Click to upload</span>
                  <span className="text-muted-foreground block text-sm mt-1">
                    CSV, TSV, or TXT files
                  </span>
                </label>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Export your orders from {MARKETPLACE_CONFIGS[marketplace].name} seller dashboard
                and upload the file here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && marketplace && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Preview: {parsedData.length} orders found</h2>
              <button
                onClick={() => {
                  setStep('upload');
                  setParsedData([]);
                  setFile(null);
                }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Order ID</th>
                    <th className="px-3 py-2 text-left">Customer</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {parsedData.slice(0, 20).map((order, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-mono text-xs">
                        {order.marketplace_order_id}
                      </td>
                      <td className="px-3 py-2">{order.customer_name || 'N/A'}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-muted">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {new Date(order.order_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {order.currency} {order.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 20 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  ... and {parsedData.length - 20} more orders
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setStep('upload');
                setParsedData([]);
              }}
              className="flex-1 rounded-lg border border-border px-4 py-3 font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Import {parsedData.length} Orders
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-lg font-semibold mb-2">Importing orders...</h2>
          <div className="w-full bg-muted rounded-full h-3 mb-4">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground">{progress}% complete</p>
        </div>
      )}

      {/* Step: Complete */}
      {step === 'complete' && importResult && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-lg font-semibold mb-2">Import Complete!</h2>
          <p className="text-muted-foreground mb-6">
            Successfully imported {importResult.success} orders
            {importResult.failed > 0 && ` (${importResult.failed} failed)`}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setStep('upload');
                setParsedData([]);
                setFile(null);
                setMarketplace(null);
                setImportResult(null);
              }}
              className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-muted"
            >
              Import More
            </button>
            <button
              onClick={() => router.push('/orders')}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
