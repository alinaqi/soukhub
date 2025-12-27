import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';
import {
  findAlternativeSuppliers,
  getAlternativeOptions,
  generateCustomerMessages,
  createAlternativeSupplierOrder,
  cancelUnavailableOrder,
  UnavailableOrderContext,
} from '@/lib/unavailable-handling';

// GET /api/supplier-orders/[id]/unavailable - Get options for handling unavailable order
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

    // Get supplier order with full context
    const { data: supplierOrder, error } = await getTable(supabase, 'supplier_orders')
      .select(`
        id,
        order_id,
        supplier_id,
        status,
        alternative_product,
        supplier:suppliers (id, name),
        order:orders (
          id,
          marketplace_order_id,
          customer_name,
          order_items (product_name, quantity)
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !supplierOrder) {
      return NextResponse.json({ error: 'Supplier order not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const so = supplierOrder as any;
    const items = so.order?.order_items || [];
    const productName = items.map((i: { product_name: string }) => i.product_name).join(', ');
    const totalQuantity = items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);

    const context: UnavailableOrderContext = {
      supplier_order_id: so.id,
      order_id: so.order_id,
      product_name: productName,
      quantity: totalQuantity,
      marketplace_order_id: so.order?.marketplace_order_id || '',
      customer_name: so.order?.customer_name || '',
      original_supplier_id: so.supplier_id,
      original_supplier_name: so.supplier?.name || '',
      alternative_product: so.alternative_product,
    };

    // Find alternative suppliers
    const alternativeSuppliers = await findAlternativeSuppliers(
      supabase,
      user.id,
      productName,
      so.supplier_id
    );

    // Get handling options
    const options = getAlternativeOptions(context, alternativeSuppliers);

    // Generate customer messages
    const customerMessages = generateCustomerMessages(context);

    return NextResponse.json({
      context,
      alternative_suppliers: alternativeSuppliers,
      options,
      customer_messages: customerMessages,
    });
  } catch (error) {
    console.error('Get unavailable options error:', error);
    return NextResponse.json({ error: 'Failed to get options' }, { status: 500 });
  }
}

interface HandleUnavailableRequest {
  action: 'try_alternative_supplier' | 'accept_alternative_product' | 'cancel';
  alternative_supplier_id?: string;
  notes?: string;
}

// POST /api/supplier-orders/[id]/unavailable - Execute an action for unavailable order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: HandleUnavailableRequest = await request.json();
    const { action, alternative_supplier_id, notes } = body;

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: supplierOrder } = await getTable(supabase, 'supplier_orders')
      .select('id, order_id, supplier_id, alternative_product')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!supplierOrder) {
      return NextResponse.json({ error: 'Supplier order not found' }, { status: 404 });
    }

    switch (action) {
      case 'try_alternative_supplier': {
        if (!alternative_supplier_id) {
          return NextResponse.json(
            { error: 'alternative_supplier_id is required' },
            { status: 400 }
          );
        }

        const result = await createAlternativeSupplierOrder(
          supabase,
          user.id,
          id,
          alternative_supplier_id
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          action: 'alternative_supplier',
          new_supplier_order_id: result.new_supplier_order_id,
          message: 'Created new supplier order. Ready to contact alternative supplier.',
        });
      }

      case 'accept_alternative_product': {
        // Update supplier order to reflect accepted alternative
        await getTable(supabase, 'supplier_orders')
          .update({
            status: 'confirmed',
            notes: notes || `Accepted alternative: ${supplierOrder.alternative_product}`,
            confirmed_at: new Date().toISOString(),
          })
          .eq('id', id);

        return NextResponse.json({
          success: true,
          action: 'accepted_alternative',
          message: 'Alternative product accepted. Order will proceed.',
        });
      }

      case 'cancel': {
        const result = await cancelUnavailableOrder(
          supabase,
          id,
          supplierOrder.order_id,
          notes || 'Product unavailable - cancelled by user'
        );

        if (!result.success) {
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          action: 'cancelled',
          message: 'Order cancelled. Remember to process refund if needed.',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Handle unavailable error:', error);
    return NextResponse.json({ error: 'Failed to handle unavailable order' }, { status: 500 });
  }
}
