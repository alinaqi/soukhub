import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SuppliersClient } from '@/components/suppliers/SuppliersClient';
import { getTable } from '@/lib/supabase/tables';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Suppliers',
};

export default async function SuppliersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch suppliers with brand rules
  const { data: suppliers } = await getTable(supabase, 'suppliers')
    .select(`
      *,
      supplier_brand_rules (brand, category, priority)
    `)
    .eq('user_id', user.id)
    .order('name');

  // Get pending order counts per supplier
  const { data: orderCounts } = await getTable(supabase, 'supplier_orders')
    .select('supplier_id')
    .eq('user_id', user.id)
    .in('status', ['pending_send', 'sent']);

  const countMap: Record<string, number> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orderCounts?.forEach((o: any) => {
    countMap[o.supplier_id] = (countMap[o.supplier_id] || 0) + 1;
  });

  // Format suppliers with brands
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedSuppliers = suppliers?.map((s: any) => ({
    ...s,
    brands: [...new Set(s.supplier_brand_rules?.map((r: { brand: string }) => r.brand) || [])],
    pending_orders_count: countMap[s.id] || 0,
  })) || [];

  return <SuppliersClient suppliers={formattedSuppliers} />;
}
