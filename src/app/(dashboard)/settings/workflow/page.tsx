import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WorkflowWizard } from '@/components/workflow/WorkflowWizard';
import { getTable } from '@/lib/supabase/tables';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workflow Configuration',
};

export default async function WorkflowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch workflow config
  const { data: config } = await getTable(supabase, 'workflow_config')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch suppliers
  const { data: suppliers } = await getTable(supabase, 'suppliers')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .order('name');

  const defaultConfig = {
    fulfillment_model: 'supplier_fulfilled' as const,
    packing_location: null,
    delivery_schedule: {},
    auto_route_orders: true,
    auto_send_supplier_messages: false,
  };

  return (
    <div className="p-6">
      <WorkflowWizard
        config={config || defaultConfig}
        suppliers={suppliers || []}
        isDefault={!config}
      />
    </div>
  );
}
