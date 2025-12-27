import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

// POST /api/orders/route - Route an order to a supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, supplier_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          product_name,
          variant_id,
          quantity
        )
      `)
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if already routed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((order as any).supplier_order_id) {
      return NextResponse.json(
        { error: 'Order already routed to a supplier' },
        { status: 400 }
      );
    }

    let selectedSupplier = supplier_id;

    // If no supplier specified, try to auto-route
    if (!selectedSupplier) {
      // Get product brand from first item
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstItem = ((order as any).order_items as { variant_id: string | null }[])?.[0];
      let brand: string | null = null;

      if (firstItem?.variant_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: variant } = await (supabase as any)
          .from('product_variants')
          .select('product_id, products(brand, preferred_supplier_id)')
          .eq('id', firstItem.variant_id)
          .single();

        if (variant?.products) {
          const product = variant.products as { brand: string | null; preferred_supplier_id: string | null };
          brand = product.brand;

          // Check for preferred supplier on product
          if (product.preferred_supplier_id) {
            selectedSupplier = product.preferred_supplier_id;
          }
        }
      }

      // If no preferred supplier, look up brand rules
      if (!selectedSupplier && brand) {
        const { data: rule } = await getTable(supabase, 'supplier_brand_rules')
          .select('supplier_id')
          .eq('user_id', user.id)
          .eq('brand', brand)
          .order('priority', { ascending: true })
          .limit(1)
          .single();

        if (rule) {
          selectedSupplier = rule.supplier_id;
        }
      }

      // If still no supplier, get any active supplier
      if (!selectedSupplier) {
        const { data: anySupplier } = await getTable(supabase, 'suppliers')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (anySupplier) {
          selectedSupplier = anySupplier.id;
        }
      }
    }

    if (!selectedSupplier) {
      return NextResponse.json(
        { error: 'No supplier found for this order. Please add suppliers first.' },
        { status: 400 }
      );
    }

    // Verify supplier exists and belongs to user
    const { data: supplier } = await getTable(supabase, 'suppliers')
      .select('id, name, is_active')
      .eq('id', selectedSupplier)
      .eq('user_id', user.id)
      .single();

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    if (!supplier.is_active) {
      return NextResponse.json(
        { error: 'Selected supplier is not active' },
        { status: 400 }
      );
    }

    // Create supplier order
    const { data: supplierOrder, error: createError } = await getTable(supabase, 'supplier_orders')
      .insert({
        user_id: user.id,
        supplier_id: selectedSupplier,
        order_id: order_id,
        status: 'pending_send',
      })
      .select()
      .single();

    if (createError || !supplierOrder) {
      console.error('Error creating supplier order:', createError);
      return NextResponse.json(
        { error: 'Failed to route order' },
        { status: 500 }
      );
    }

    // Update order with supplier order reference
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('orders')
      .update({
        supplier_order_id: supplierOrder.id,
        routed_at: new Date().toISOString(),
        requires_supplier: true,
      })
      .eq('id', order_id);

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('activity_log').insert({
      user_id: user.id,
      activity_type: 'order_updated',
      title: `Order routed to ${supplier.name}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      description: `Order ${(order as any).marketplace_order_id} assigned to supplier`,
      metadata: { order_id, supplier_id: selectedSupplier, supplier_order_id: supplierOrder.id },
    });

    return NextResponse.json({
      success: true,
      supplier_order: supplierOrder,
      supplier_name: supplier.name,
    });
  } catch (error) {
    console.error('Route order error:', error);
    return NextResponse.json({ error: 'Failed to route order' }, { status: 500 });
  }
}

// GET /api/orders/route - Get routing status for orders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unroutedOnly = searchParams.get('unrouted') === 'true';

    let query = supabase
      .from('orders')
      .select(`
        id,
        marketplace_order_id,
        marketplace,
        status,
        customer_name,
        shipping_city,
        total,
        order_date,
        requires_supplier,
        supplier_order_id,
        order_items (product_name, quantity)
      `)
      .eq('user_id', user.id)
      .eq('requires_supplier', true)
      .in('status', ['pending', 'confirmed', 'processing'])
      .order('order_date', { ascending: false });

    if (unroutedOnly) {
      query = query.is('supplier_order_id', null);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
