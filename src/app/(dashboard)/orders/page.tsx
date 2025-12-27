import { createClient } from '@/lib/supabase/server';
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import Link from 'next/link';

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders, count } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', user!.id)
    .order('order_date', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            {count || 0} total orders across all marketplaces
          </p>
        </div>
        <Link
          href="/import"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          📥 Import Orders
        </Link>
      </div>

      <OrdersTable orders={orders || []} />
    </div>
  );
}
