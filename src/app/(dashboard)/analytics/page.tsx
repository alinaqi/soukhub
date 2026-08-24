import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { AnalyticsPageClient } from '@/components/analytics/AnalyticsPageClient';

export const metadata: Metadata = {
  title: 'Analytics & Insights',
};

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all orders for analytics
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('order_date', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Actionable insights and comprehensive performance analytics
        </p>
      </div>

      <AnalyticsPageClient orders={orders || []} />
    </div>
  );
}
