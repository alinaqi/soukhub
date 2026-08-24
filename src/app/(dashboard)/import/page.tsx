'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';
import type { OrderStatus, FulfillmentType, PaymentMethod, MarketplaceType } from '@/types/supabase';

type ImportStep = 'upload' | 'analyzing' | 'mapping' | 'preview' | 'importing' | 'complete';
type DataType = 'orders' | 'inventory' | 'products';

interface FieldMapping {
  sourceHeader: string;
  targetField: string;
  confidence: number;
  sampleValue?: string;
}

interface MappingResult {
  dataType: DataType;
  marketplace: MarketplaceType | null;
  mappings: FieldMapping[];
  unmappedHeaders: string[];
}

interface ParsedRow {
  [key: string]: string | number | null;
}

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

function parseNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

function parseDate(value: string | null | undefined): string {
  if (!value) return new Date().toISOString();
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

// Available target fields for each data type
const TARGET_FIELDS: Record<DataType, { required: string[]; optional: string[] }> = {
  orders: {
    required: ['marketplace_order_id', 'order_date'],
    optional: [
      'customer_name', 'customer_email', 'customer_phone', 'status',
      'subtotal', 'shipping_cost', 'tax', 'discount', 'total', 'currency',
      'shipping_city', 'shipping_country', 'fulfillment', 'payment_method',
      'tracking_number', 'carrier', 'ship_date', 'delivery_date', 'notes',
    ],
  },
  inventory: {
    required: ['sku'],
    optional: [
      'product_name', 'quantity', 'reserved', 'warehouse_location',
      'reorder_point', 'cost', 'price', 'condition', 'color', 'storage',
      'brand', 'category', 'barcode',
    ],
  },
  products: {
    required: ['name'],
    optional: [
      'sku', 'brand', 'category', 'description', 'base_price', 'cost_price',
      'condition', 'color', 'storage', 'barcode', 'is_active',
    ],
  },
};

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [dataType, setDataType] = useState<DataType>('orders');
  const [rawData, setRawData] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappingResult, setMappingResult] = useState<MappingResult | null>(null);
  const [editedMappings, setEditedMappings] = useState<FieldMapping[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; updated: number } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  // Parse file and get headers
  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.data.length === 0) {
          setError('File is empty or has no valid rows');
          return;
        }

        const fileHeaders = Object.keys(results.data[0] || {});
        setHeaders(fileHeaders);
        setRawData(results.data as ParsedRow[]);
        setStep('analyzing');

        // Call AI to map headers
        try {
          const response = await fetch('/api/map-headers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              headers: fileHeaders,
              sampleRows: results.data.slice(0, 5),
              dataType: dataType,
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Failed to analyze headers');
          }

          const result: MappingResult = await response.json();
          setMappingResult(result);

          // Add sample values to mappings
          const mappingsWithSamples = result.mappings.map(m => ({
            ...m,
            sampleValue: String(results.data[0]?.[m.sourceHeader] || ''),
          }));
          setEditedMappings(mappingsWithSamples);

          // Auto-set data type from AI response
          if (result.dataType) {
            setDataType(result.dataType);
          }

          setStep('mapping');
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to analyze file');
          setStep('upload');
        }
      },
      error: (err) => {
        setError(`Failed to read file: ${err.message}`);
      },
    });
  }, [dataType]);

  // Update a single mapping
  const updateMapping = (sourceHeader: string, targetField: string) => {
    setEditedMappings(prev =>
      prev.map(m =>
        m.sourceHeader === sourceHeader
          ? { ...m, targetField, confidence: 1.0 }
          : m
      )
    );
  };

  // Remove a mapping
  const removeMapping = (sourceHeader: string) => {
    setEditedMappings(prev => prev.filter(m => m.sourceHeader !== sourceHeader));
  };

  // Add a new mapping
  const addMapping = (sourceHeader: string) => {
    const sample = String(rawData[0]?.[sourceHeader] || '');
    setEditedMappings(prev => [
      ...prev,
      { sourceHeader, targetField: '', confidence: 0, sampleValue: sample }
    ]);
  };

  // Transform raw data using mappings
  const transformData = () => {
    return rawData.map(row => {
      const transformed: Record<string, unknown> = {};

      editedMappings.forEach(mapping => {
        if (mapping.targetField && mapping.sourceHeader in row) {
          const value = row[mapping.sourceHeader];

          // Apply transformations based on target field
          switch (mapping.targetField) {
            case 'status':
              transformed[mapping.targetField] = normalizeStatus(String(value || ''));
              break;
            case 'fulfillment':
              transformed[mapping.targetField] = normalizeFulfillment(String(value || ''));
              break;
            case 'payment_method':
              transformed[mapping.targetField] = normalizePayment(String(value || ''));
              break;
            case 'order_date':
            case 'ship_date':
            case 'delivery_date':
              transformed[mapping.targetField] = parseDate(String(value || ''));
              break;
            case 'total':
            case 'subtotal':
            case 'tax':
            case 'discount':
            case 'shipping_cost':
            case 'price':
            case 'cost':
            case 'base_price':
            case 'cost_price':
            case 'quantity':
            case 'reserved':
            case 'reorder_point':
              transformed[mapping.targetField] = parseNumber(value);
              break;
            case 'is_active':
              transformed[mapping.targetField] = String(value).toLowerCase() !== 'false' && value !== '0';
              break;
            default:
              transformed[mapping.targetField] = value;
          }
        }
      });

      // Store raw data
      transformed.raw_data = row;

      return transformed;
    }).filter(row => {
      // Filter out rows missing required fields
      const required = TARGET_FIELDS[dataType].required;
      return required.every(field => row[field] !== undefined && row[field] !== null && row[field] !== '');
    });
  };

  // Proceed to preview
  const handleProceedToPreview = () => {
    // Check required mappings
    const required = TARGET_FIELDS[dataType].required;
    const mappedFields = editedMappings.map(m => m.targetField);
    const missingRequired = required.filter(f => !mappedFields.includes(f));

    if (missingRequired.length > 0) {
      setError(`Missing required mappings: ${missingRequired.join(', ')}`);
      return;
    }

    setError(null);
    setStep('preview');
  };

  // Import data
  const handleImport = async () => {
    setImporting(true);
    setStep('importing');
    setProgress(0);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setImporting(false);
      return;
    }

    const transformedData = transformData();
    let success = 0;
    let failed = 0;
    const updated = 0;

    const marketplace = mappingResult?.marketplace || 'other';

    for (let i = 0; i < transformedData.length; i++) {
      const item = transformedData[i];

      try {
        if (dataType === 'orders') {
          const orderData = {
            user_id: user.id,
            marketplace: marketplace as MarketplaceType,
            marketplace_order_id: String(item.marketplace_order_id),
            status: (item.status as OrderStatus) || 'pending',
            order_date: item.order_date as string,
            customer_name: item.customer_name as string || null,
            customer_email: item.customer_email as string || null,
            customer_phone: item.customer_phone as string || null,
            subtotal: (item.subtotal as number) || (item.total as number) || 0,
            total: (item.total as number) || (item.subtotal as number) || 0,
            shipping_cost: (item.shipping_cost as number) || 0,
            tax: (item.tax as number) || 0,
            discount: (item.discount as number) || 0,
            currency: (item.currency as string) || 'AED',
            shipping_city: item.shipping_city as string || null,
            shipping_country: (item.shipping_country as string) || 'AE',
            fulfillment: item.fulfillment as FulfillmentType || null,
            payment_method: item.payment_method as PaymentMethod || null,
            tracking_number: item.tracking_number as string || null,
            carrier: item.carrier as string || null,
            ship_date: item.ship_date as string || null,
            delivery_date: item.delivery_date as string || null,
            notes: item.notes as string || null,
            raw_data: item.raw_data,
          };

          const { error: insertError } = await supabase
            .from('orders')
            .upsert(orderData as never, {
              onConflict: 'user_id,marketplace,marketplace_order_id',
            });

          if (insertError) {
            failed++;
            console.error('Import error:', insertError);
          } else {
            success++;
          }
        } else if (dataType === 'inventory') {
          // For inventory, we need to handle product/variant creation
          const sku = String(item.sku);
          const productName = (item.product_name as string) || sku;

          // Check if product exists with this SKU
          const { data: existingVariant } = await supabase
            .from('product_variants')
            .select('id, product_id')
            .eq('sku', sku)
            .single();

          let variantId = (existingVariant as { id: string } | null)?.id;

          if (!variantId) {
            // Create product first
            const { data: product, error: productError } = await supabase
              .from('products')
              .insert({
                user_id: user.id,
                name: productName,
                brand: item.brand as string || null,
                category: item.category as string || null,
                base_price: item.price as number || null,
                cost_price: item.cost as number || null,
              } as never)
              .select('id')
              .single();

            const productData = product as { id: string } | null;
            if (productError || !productData) {
              failed++;
              console.error('Product creation error:', productError);
              continue;
            }

            // Create variant
            const { data: variant, error: variantError } = await supabase
              .from('product_variants')
              .insert({
                product_id: productData.id,
                sku: sku,
                name: productName,
                color: item.color as string || null,
                storage: item.storage as string || null,
                condition: (item.condition as string) || 'new',
                price: item.price as number || null,
                cost: item.cost as number || null,
                barcode: item.barcode as string || null,
              } as never)
              .select('id')
              .single();

            const variantData = variant as { id: string } | null;
            if (variantError || !variantData) {
              failed++;
              console.error('Variant creation error:', variantError);
              continue;
            }

            variantId = variantData.id;
          }

          // Upsert inventory
          const { error: invError } = await supabase
            .from('inventory')
            .upsert({
              variant_id: variantId,
              quantity: (item.quantity as number) || 0,
              reserved: (item.reserved as number) || 0,
              warehouse_location: item.warehouse_location as string || null,
              reorder_point: (item.reorder_point as number) || 5,
            } as never, {
              onConflict: 'variant_id',
            });

          if (invError) {
            failed++;
            console.error('Inventory error:', invError);
          } else {
            success++;
          }
        } else if (dataType === 'products') {
          // Create or update products
          const { error: productError } = await supabase
            .from('products')
            .upsert({
              user_id: user.id,
              name: item.name as string,
              brand: item.brand as string || null,
              category: item.category as string || null,
              description: item.description as string || null,
              base_price: item.base_price as number || null,
              cost_price: item.cost_price as number || null,
              is_active: item.is_active !== false,
            } as never, {
              onConflict: 'user_id,name',
              ignoreDuplicates: false,
            });

          if (productError) {
            failed++;
            console.error('Product error:', productError);
          } else {
            success++;
          }
        }
      } catch (err) {
        failed++;
        console.error('Import error:', err);
      }

      setProgress(Math.round(((i + 1) / transformedData.length) * 100));
    }

    setImportResult({ success, failed, updated });
    setStep('complete');
    setImporting(false);
  };

  const resetImport = () => {
    setStep('upload');
    setRawData([]);
    setHeaders([]);
    setMappingResult(null);
    setEditedMappings([]);
    setError(null);
    setImportResult(null);
  };

  const previewData = step === 'preview' ? transformData().slice(0, 20) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-muted-foreground">
          Upload any CSV or TSV file - AI will automatically map your columns
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error/10 border border-error/20 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm">
        {['upload', 'analyzing', 'mapping', 'preview', 'importing', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
              step === s ? 'bg-primary text-primary-foreground' :
              ['upload', 'analyzing', 'mapping', 'preview', 'importing', 'complete'].indexOf(step) > i
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            {i < 5 && <div className="w-8 h-0.5 bg-muted" />}
          </div>
        ))}
      </div>

      {/* Step: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">What are you importing?</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { type: 'orders' as DataType, label: 'Orders', icon: '📦', desc: 'Order data from marketplaces' },
                { type: 'inventory' as DataType, label: 'Inventory', icon: '📊', desc: 'Stock levels and quantities' },
                { type: 'products' as DataType, label: 'Products', icon: '🏷️', desc: 'Product catalog' },
              ].map(({ type, label, icon, desc }) => (
                <label
                  key={type}
                  className={`flex flex-col gap-1 p-4 rounded-lg border cursor-pointer transition-colors ${
                    dataType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="dataType"
                    value={type}
                    checked={dataType === type}
                    onChange={() => setDataType(type)}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{icon}</span>
                    <span className="font-medium">{label}</span>
                    {dataType === type && <span className="ml-auto text-primary">✓</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Upload your file</h2>
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
              <input
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-5xl block mb-4">📄</span>
                <span className="font-medium text-lg">Drop your file here or click to upload</span>
                <span className="text-muted-foreground block text-sm mt-2">
                  CSV, TSV, or TXT files from any marketplace
                </span>
                <span className="text-xs text-muted-foreground mt-4 block">
                  AI will automatically detect and map your columns
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Step: Analyzing */}
      {step === 'analyzing' && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-5xl mb-4 animate-pulse">🤖</div>
          <h2 className="text-lg font-semibold mb-2">Analyzing your file...</h2>
          <p className="text-muted-foreground">
            AI is examining your headers and sample data to create smart mappings
          </p>
        </div>
      )}

      {/* Step: Mapping */}
      {step === 'mapping' && mappingResult && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Review Column Mappings</h2>
                <p className="text-sm text-muted-foreground">
                  Detected: <span className="font-medium">{mappingResult.dataType}</span>
                  {mappingResult.marketplace && (
                    <> from <span className="font-medium capitalize">{mappingResult.marketplace}</span></>
                  )}
                </p>
              </div>
              <button
                onClick={resetImport}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Start Over
              </button>
            </div>

            <div className="space-y-3">
              {editedMappings.map((mapping) => (
                <div key={mapping.sourceHeader} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm truncate">{mapping.sourceHeader}</div>
                    {mapping.sampleValue && (
                      <div className="text-xs text-muted-foreground truncate">
                        e.g., {mapping.sampleValue}
                      </div>
                    )}
                  </div>
                  <span className="text-muted-foreground">→</span>
                  <select
                    value={mapping.targetField}
                    onChange={(e) => updateMapping(mapping.sourceHeader, e.target.value)}
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="">-- Skip this column --</option>
                    <optgroup label="Required Fields">
                      {TARGET_FIELDS[dataType].required.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Optional Fields">
                      {TARGET_FIELDS[dataType].optional.map(field => (
                        <option key={field} value={field}>{field}</option>
                      ))}
                    </optgroup>
                  </select>
                  <div className={`w-16 text-xs text-center ${
                    mapping.confidence >= 0.8 ? 'text-success' :
                    mapping.confidence >= 0.5 ? 'text-warning' : 'text-muted-foreground'
                  }`}>
                    {mapping.targetField ? `${Math.round(mapping.confidence * 100)}%` : '—'}
                  </div>
                  <button
                    onClick={() => removeMapping(mapping.sourceHeader)}
                    className="text-muted-foreground hover:text-error"
                    title="Remove mapping"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Unmapped headers */}
            {mappingResult.unmappedHeaders.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-sm font-medium mb-2">Unmapped Columns</h3>
                <div className="flex flex-wrap gap-2">
                  {mappingResult.unmappedHeaders.filter(h => !editedMappings.find(m => m.sourceHeader === h)).map(header => (
                    <button
                      key={header}
                      onClick={() => addMapping(header)}
                      className="px-3 py-1 bg-muted rounded-full text-xs hover:bg-muted/80"
                    >
                      + {header}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={resetImport}
              className="flex-1 rounded-lg border border-border px-4 py-3 font-medium transition-colors hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleProceedToPreview}
              className="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Preview Data →
            </button>
          </div>
        </div>
      )}

      {/* Step: Preview */}
      {step === 'preview' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Preview: {transformData().length} {dataType} ready to import
              </h2>
              <button
                onClick={() => setStep('mapping')}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Edit Mappings
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    {editedMappings.filter(m => m.targetField).slice(0, 6).map(m => (
                      <th key={m.targetField} className="px-3 py-2 text-left whitespace-nowrap">
                        {m.targetField}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewData.map((row, i) => (
                    <tr key={i}>
                      {editedMappings.filter(m => m.targetField).slice(0, 6).map(m => (
                        <td key={m.targetField} className="px-3 py-2 truncate max-w-48">
                          {String(row[m.targetField] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {transformData().length > 20 && (
                <p className="text-center text-sm text-muted-foreground py-4">
                  ... and {transformData().length - 20} more rows
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('mapping')}
              className="flex-1 rounded-lg border border-border px-4 py-3 font-medium transition-colors hover:bg-muted"
            >
              ← Back
            </button>
            <button
              onClick={handleImport}
              className="flex-1 rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Import {transformData().length} {dataType}
            </button>
          </div>
        </div>
      )}

      {/* Step: Importing */}
      {step === 'importing' && (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h2 className="text-lg font-semibold mb-2">Importing {dataType}...</h2>
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
          <div className="text-muted-foreground mb-6 space-y-1">
            <p>Successfully imported {importResult.success} {dataType}</p>
            {importResult.failed > 0 && (
              <p className="text-warning">{importResult.failed} failed to import</p>
            )}
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetImport}
              className="rounded-lg border border-border px-6 py-2 font-medium transition-colors hover:bg-muted"
            >
              Import More
            </button>
            <button
              onClick={() => router.push(dataType === 'orders' ? '/orders' : dataType === 'inventory' ? '/inventory' : '/products')}
              className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
