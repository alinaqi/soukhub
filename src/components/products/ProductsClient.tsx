'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Product } from '@/types/supabase';
import AddProductModal from './AddProductModal';

interface ExtractedProduct {
  name: string;
  sku: string | null;
  price: number;
  condition: string;
  unitsSold: number;
  revenue: number;
  marketplaces: string[];
  lastOrderDate: string;
}

interface ExtractResult {
  success?: boolean;
  created?: number;
  skipped?: number;
  errors?: number;
  products: ExtractedProduct[];
  stats: {
    totalOrders: number;
    uniqueProducts: number;
    totalUnitsSold: number;
    totalRevenue: number;
  };
  error?: string;
}

interface ProductsClientProps {
  initialProducts: Product[];
  count: number;
}

export default function ProductsClient({
  initialProducts,
  count,
}: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productCount, setProductCount] = useState(count);
  const [extractModal, setExtractModal] = useState(false);
  const [extractLoading, setExtractLoading] = useState(false);
  const [extractPreview, setExtractPreview] = useState<ExtractResult | null>(
    null
  );
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(
    null
  );
  const [addModal, setAddModal] = useState(false);

  const handleExtractPreview = async () => {
    setExtractLoading(true);
    setExtractPreview(null);
    setExtractResult(null);

    try {
      const response = await fetch('/api/products/extract-from-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: true }),
      });

      const result: ExtractResult = await response.json();
      setExtractPreview(result);
    } catch (err) {
      console.error('Error previewing:', err);
    }
    setExtractLoading(false);
  };

  const handleExtractConfirm = async () => {
    setExtractLoading(true);

    try {
      const response = await fetch('/api/products/extract-from-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun: false }),
      });

      const result: ExtractResult = await response.json();
      setExtractResult(result);
      setExtractPreview(null);

      if (result.success) {
        // Refresh the page to show new products
        window.location.reload();
      }
    } catch (err) {
      console.error('Error extracting:', err);
    }
    setExtractLoading(false);
  };

  const openExtractModal = () => {
    setExtractModal(true);
    setExtractPreview(null);
    setExtractResult(null);
    handleExtractPreview();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {productCount || 0} products in your catalog
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openExtractModal}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Extract from Orders
          </button>
          <button
            onClick={() => setAddModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            + Add Product
          </button>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <span className="text-5xl mb-4 block">📦</span>
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-6">
            Extract products from your imported orders, or add them manually.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={openExtractModal}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Extract from Orders
            </button>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 font-medium transition-colors hover:bg-muted"
            >
              Import Orders
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl">
                  📦
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.brand || 'No brand'} •{' '}
                    {product.category || 'Uncategorized'}
                  </p>
                  {product.base_price && (
                    <p className="text-sm font-medium mt-1">
                      AED {product.base_price.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extract Products Modal */}
      {extractModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Extract Products from Orders
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Analyze your order history to create your product catalog
                  </p>
                </div>
                <button
                  onClick={() => setExtractModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {extractLoading && !extractPreview && !extractResult && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4 animate-pulse">🔍</div>
                  <p className="text-muted-foreground">
                    Analyzing your orders...
                  </p>
                </div>
              )}

              {extractPreview?.error && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📭</div>
                  <p className="text-muted-foreground">{extractPreview.error}</p>
                  <Link
                    href="/import"
                    className="inline-block mt-4 text-primary hover:underline"
                  >
                    Import orders first →
                  </Link>
                </div>
              )}

              {extractPreview && !extractPreview.error && (
                <div className="space-y-6">
                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {extractPreview.stats.totalOrders}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Orders Analyzed
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {extractPreview.stats.uniqueProducts}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Products Found
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        {extractPreview.stats.totalUnitsSold?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Units Sold
                      </div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold">
                        AED{' '}
                        {extractPreview.stats.totalRevenue?.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Revenue
                      </div>
                    </div>
                  </div>

                  {/* Product Preview */}
                  <div>
                    <h3 className="font-medium mb-3">
                      Products to Create (Top 10)
                    </h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left">Product</th>
                            <th className="px-3 py-2 text-left">SKU</th>
                            <th className="px-3 py-2 text-center">Sold</th>
                            <th className="px-3 py-2 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {extractPreview.products.slice(0, 10).map((product, i) => (
                            <tr key={i}>
                              <td className="px-3 py-2">
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {product.marketplaces.join(', ')}
                                </div>
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {product.sku || '—'}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {product.unitsSold}
                              </td>
                              <td className="px-3 py-2 text-right">
                                AED {product.revenue.toFixed(0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {extractPreview.products.length > 10 && (
                        <div className="px-3 py-2 text-center text-sm text-muted-foreground bg-muted/30">
                          ... and {extractPreview.products.length - 10} more
                          products
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg text-sm">
                    <strong>Note:</strong> Products will be created with 0 stock
                    quantity. Update inventory levels after creation.
                  </div>
                </div>
              )}

              {extractResult && (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-lg font-semibold mb-2">
                    Extraction Complete!
                  </h3>
                  <div className="space-y-1 text-muted-foreground mb-6">
                    <p>Created {extractResult.created} new products</p>
                    {(extractResult.skipped ?? 0) > 0 && (
                      <p className="text-sm">
                        {extractResult.skipped} already existed (skipped)
                      </p>
                    )}
                    {(extractResult.errors ?? 0) > 0 && (
                      <p className="text-sm text-warning">
                        {extractResult.errors} failed
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex gap-4">
              <button
                onClick={() => setExtractModal(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2 font-medium hover:bg-muted"
              >
                {extractResult ? 'Close' : 'Cancel'}
              </button>
              {extractPreview && !extractPreview.error && !extractResult && (
                <button
                  onClick={handleExtractConfirm}
                  disabled={extractLoading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {extractLoading
                    ? 'Creating...'
                    : `Create ${extractPreview.stats.uniqueProducts} Products`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={addModal}
        onClose={() => setAddModal(false)}
        onSuccess={() => {
          // Refresh the page to show new product
          window.location.reload();
        }}
      />
    </div>
  );
}
