import { createClient } from '@/lib/supabase/server';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentOrders } from '@/components/dashboard/RecentOrders';
import { MarketplaceBreakdown } from '@/components/dashboard/MarketplaceBreakdown';
import { Insights } from '@/components/dashboard/Insights';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AnalyticsSummary } from '@/components/dashboard/AnalyticsSummary';
import type { Order, MarketplaceConnection } from '@/types/supabase';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch stats
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .in('status', ['pending', 'confirmed', 'processing']);

  const { data: revenueData } = await supabase
    .from('orders')
    .select('total')
    .eq('user_id', user!.id)
    .eq('status', 'delivered');

  const orders = revenueData as { total: number }[] | null;
  const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id);

  // Fetch all orders for analytics (limit to last 500 for performance)
  const { data: allOrdersData } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('order_date', { ascending: false })
    .limit(500);

  // Fetch marketplace connections
  const { data: connectionsData } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('user_id', user!.id);

  const stats = {
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    totalRevenue,
    totalProducts: totalProducts || 0,
  };

  const allOrders = (allOrdersData || []) as Order[];
  const recentOrders = allOrders.slice(0, 5);
  const connections = (connectionsData || []) as MarketplaceConnection[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your marketplace performance
        </p>
      </div>

      <StatsCards stats={stats} />

      {/* AI Insights */}
      <Insights orders={allOrders} connections={connections} stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Orders & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <RecentOrders orders={recentOrders} />
          <QuickActions />
        </div>

        {/* Right Column - Analytics & Marketplace */}
        <div className="space-y-6">
          <AnalyticsSummary orders={allOrders} />
          <MarketplaceBreakdown connections={connections} />
        </div>
      </div>
    </div>
  );
}
