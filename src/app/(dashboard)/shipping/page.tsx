import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShippingDashboard } from '@/components/shipping/ShippingDashboard';
import { getTable } from '@/lib/supabase/tables';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Handoff',
};

export default async function ShippingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get workflow config for groupBy preference
  const { data: workflowConfig } = await getTable(supabase, 'workflow_config')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Get workflow rules for shipping group preference
  const { data: shippingRule } = await getTable(supabase, 'workflow_rules')
    .select('config')
    .eq('user_id', user.id)
    .eq('rule_type', 'shipping')
    .maybeSingle();

  // Default groupBy to marketplace if not configured
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupBy: 'marketplace' | 'destination' | 'carrier' =
    (shippingRule?.config as any)?.group_by || 'marketplace';

  // Fetch orders ready to ship (status = 'ready_to_ship')
  const { data: ordersData } = await supabase
    .from('orders')
    .select(`
      id,
      marketplace_order_id,
      marketplace,
      customer_name,
      shipping_city,
      shipping_address,
      total,
      currency,
      carrier,
      tracking_number,
      order_items (id)
    `)
    .eq('user_id', user.id)
    .eq('status', 'ready_to_ship')
    .order('order_date', { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = (ordersData || []).map((order: any) => ({
    id: order.id,
    marketplace_order_id: order.marketplace_order_id,
    marketplace: order.marketplace,
    customer_name: order.customer_name,
    shipping_city: order.shipping_city,
    shipping_address: order.shipping_address,
    total: order.total || 0,
    currency: order.currency || 'AED',
    carrier: order.carrier,
    tracking_number: order.tracking_number,
    items_count: order.order_items?.length || 0,
  }));

  return (
    <div className="p-6">
      <ShippingDashboard orders={orders} groupBy={groupBy} />
    </div>
  );
}
