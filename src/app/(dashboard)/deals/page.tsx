import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { DealsClient } from '@/components/dashboard/DealsClient';

export const metadata: Metadata = {
  title: 'Deals',
};

export default async function DealsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user!.id)
    .maybeSingle();

  const { data } = await supabase
    .from('products')
    .select('id, name, base_price, is_published')
    .eq('org_id', profile?.organization_id ?? '00000000-0000-0000-0000-000000000000')
    .order('created_at', { ascending: false })
    .limit(200);

  const products = (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    base_price: p.base_price != null ? Number(p.base_price) : null,
    is_published: !!p.is_published,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold">Deals</h1>
      <p className="mt-1 text-muted-foreground">
        Run limited-time prices on your products — SoukHub promotes live deals across the
        marketplace.
      </p>
      <div className="mt-6">
        <DealsClient products={products} />
      </div>
    </div>
  );
}
