import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import type { FulfillmentModel } from '@/types/database';

// GET /api/workflow - Get workflow configuration
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: config, error } = await getTable(supabase, 'workflow_config')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching workflow config:', error);
      return NextResponse.json({ error: 'Failed to fetch workflow config' }, { status: 500 });
    }

    // Return default config if none exists
    if (!config) {
      return NextResponse.json({
        config: {
          fulfillment_model: 'supplier_fulfilled',
          packing_location: null,
          delivery_schedule: {},
          auto_route_orders: true,
          auto_send_supplier_messages: false,
        },
        isDefault: true,
      });
    }

    return NextResponse.json({ config, isDefault: false });
  } catch (error) {
    console.error('Fetch workflow config error:', error);
    return NextResponse.json({ error: 'Failed to fetch workflow config' }, { status: 500 });
  }
}

interface WorkflowConfigRequest {
  fulfillment_model?: FulfillmentModel;
  packing_location?: string;
  delivery_schedule?: Record<string, string[]>;
  auto_route_orders?: boolean;
  auto_send_supplier_messages?: boolean;
}

// POST /api/workflow - Create or update workflow configuration
export async function POST(request: NextRequest) {
  try {
    const body: WorkflowConfigRequest = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if config exists
    const { data: existing } = await getTable(supabase, 'workflow_config')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const configData = {
      fulfillment_model: body.fulfillment_model || 'supplier_fulfilled',
      packing_location: body.packing_location || null,
      delivery_schedule: body.delivery_schedule || {},
      auto_route_orders: body.auto_route_orders ?? true,
      auto_send_supplier_messages: body.auto_send_supplier_messages ?? false,
    };

    let config;
    let error;

    if (existing) {
      // Update existing
      const result = await getTable(supabase, 'workflow_config')
        .update(configData)
        .eq('user_id', user.id)
        .select()
        .single();
      config = result.data;
      error = result.error;
    } else {
      // Create new
      const result = await getTable(supabase, 'workflow_config')
        .insert({
          user_id: user.id,
          ...configData,
        })
        .select()
        .single();
      config = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving workflow config:', error);
      return NextResponse.json({ error: 'Failed to save workflow config' }, { status: 500 });
    }

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('Save workflow config error:', error);
    return NextResponse.json({ error: 'Failed to save workflow config' }, { status: 500 });
  }
}
