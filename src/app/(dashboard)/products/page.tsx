import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import type { Product } from '@/types/supabase';

export default async function ProductsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, count } = await supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const products = (data || []) as Product[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            {count || 0} products in your catalog
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
          + Add Product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <span className="text-5xl mb-4 block">🏷️</span>
          <h3 className="text-lg font-semibold mb-2">No products yet</h3>
          <p className="text-muted-foreground mb-6">
            Products will be automatically created when you import orders,
            or you can add them manually.
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            📥 Import Orders
          </Link>
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
                  🏷️
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {product.brand || 'No brand'} • {product.category || 'Uncategorized'}
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
    </div>
  );
}
