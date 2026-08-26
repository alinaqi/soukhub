import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Orders',
};
import { OrdersTable } from '@/components/dashboard/OrdersTable';
import Link from 'next/link';

const CHANNEL_META: Record<string, { label: string; className: string }> = {
  soukhub: { label: '🏬 SoukHub', className: 'border-primary/40 bg-primary/5 text-primary' },
  amazon: { label: '📦 Amazon', className: 'border-border bg-card' },
  cartlow: { label: '🛒 Cartlow', className: 'border-border bg-card' },
  revibe: { label: '📱 Revibe', className: 'border-border bg-card' },
  noon: { label: '🌙 Noon', className: 'border-border bg-card' },
  other: { label: '🏪 Other', className: 'border-border bg-card' },
};

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: orders, count }, { data: channelRows }] = await Promise.all([
    supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('order_date', { ascending: false })
      .limit(50),
    supabase.from('orders').select('marketplace').eq('user_id', user!.id).limit(5000),
  ]);

  // Per-channel counts: your own marketplace next to the external providers
  const channelCounts = new Map<string, number>();
  for (const row of channelRows ?? []) {
    const key = row.marketplace ?? 'other';
    channelCounts.set(key, (channelCounts.get(key) ?? 0) + 1);
  }
  const channels = [...channelCounts.entries()].sort((a, b) => {
    if (a[0] === 'soukhub') return -1;
    if (b[0] === 'soukhub') return 1;
    return b[1] - a[1];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            {count || 0} total orders — SoukHub and external marketplaces
          </p>
        </div>
        <Link
          href="/import"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          📥 Import Orders
        </Link>
      </div>

      {channels.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {channels.map(([channel, n]) => {
            const meta = CHANNEL_META[channel] ?? CHANNEL_META.other;
            return (
              <span
                key={channel}
                className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${meta.className}`}
              >
                {meta.label}
                <span className="font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {n}
                </span>
              </span>
            );
          })}
        </div>
      )}

      <OrdersTable orders={orders || []} />
    </div>
  );
}
