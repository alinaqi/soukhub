import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

interface UpdateSupplierOrderRequest {
  status?: 'pending' | 'sent' | 'confirmed' | 'unavailable' | 'alternative_offered' | 'delivered_to_seller' | 'packed';
  expected_delivery?: string;
  alternative_product?: string;
  notes?: string;
  tracking_number?: string;
}

// GET /api/supplier-orders/[id] - Get a single supplier order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: supplierOrder, error } = await getTable(supabase, 'supplier_orders')
      .select(`
        *,
        supplier:suppliers (id, name, whatsapp_number),
        order:orders (
          id,
          marketplace_order_id,
          marketplace,
          customer_name,
          shipping_city,
          status,
          order_items (id, product_name, quantity, unit_price)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !supplierOrder) {
      return NextResponse.json({ error: 'Supplier order not found' }, { status: 404 });
    }

    return NextResponse.json({ supplier_order: supplierOrder });
  } catch (error) {
    console.error('Get supplier order error:', error);
    return NextResponse.json({ error: 'Failed to get supplier order' }, { status: 500 });
  }
}

// PATCH /api/supplier-orders/[id] - Update a supplier order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateSupplierOrderRequest = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await getTable(supabase, 'supplier_orders')
      .select('id, status, order_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Supplier order not found' }, { status: 404 });
    }

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

    if (body.status) {
      updates.status = body.status;

      // Add timestamp based on status
      if (body.status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      } else if (body.status === 'delivered_to_seller') {
        updates.delivered_at = new Date().toISOString();
      }
    }

    if (body.expected_delivery !== undefined) {
      updates.expected_delivery = body.expected_delivery;
    }

    if (body.alternative_product !== undefined) {
      updates.alternative_product = body.alternative_product;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (body.tracking_number !== undefined) {
      updates.tracking_number = body.tracking_number;
    }

    updates.updated_at = new Date().toISOString();

    const { data: updatedOrder, error: updateError } = await getTable(supabase, 'supplier_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update supplier order' }, { status: 500 });
    }

    // If status changed to unavailable, we might need to trigger alternative handling
    if (body.status === 'unavailable') {
      // Check if all supplier orders for this order are unavailable
      const { data: allSupplierOrders } = await getTable(supabase, 'supplier_orders')
        .select('id, status')
        .eq('order_id', existing.order_id);

      const allUnavailable = allSupplierOrders?.every(
        (so: { status: string }) => so.status === 'unavailable'
      );

      if (allUnavailable) {
        // Update main order status - needs human review for cancellation/alternative
        await supabase
          .from('orders')
          .update({
            status: 'processing',
            notes: 'All suppliers reported items unavailable - needs review',
          })
          .eq('id', existing.order_id);
      }
    }

    return NextResponse.json({
      success: true,
      supplier_order: updatedOrder,
    });
  } catch (error) {
    console.error('Update supplier order error:', error);
    return NextResponse.json({ error: 'Failed to update supplier order' }, { status: 500 });
  }
}
