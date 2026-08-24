import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Products',
};
import ProductsClient from '@/components/products/ProductsClient';
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

  return <ProductsClient initialProducts={products} count={count || 0} />;
}
