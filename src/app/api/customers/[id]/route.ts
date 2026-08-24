import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

// GET /api/customers/[id] - Get a single customer with order history
export async function GET(
  _request: NextRequest,
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

    // Get customer
    const { data: customer, error } = await getTable(supabase, 'customers')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Get recent orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        marketplace_order_id,
        marketplace,
        status,
        total,
        order_date,
        order_items (product_name, quantity, unit_price)
      `)
      .eq('customer_id', id)
      .order('order_date', { ascending: false })
      .limit(10);

    // Get favorite products (most ordered)
    const productCounts: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orders?.forEach((order: any) => {
      (order.order_items as { product_name: string }[])?.forEach((item) => {
        productCounts[item.product_name] = (productCounts[item.product_name] || 0) + 1;
      });
    });

    const favoriteProducts = Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      customer: {
        ...customer,
        is_repeat: customer.total_orders > 1,
        favorite_products: favoriteProducts,
      },
      orders: orders || [],
    });
  } catch (error) {
    console.error('Fetch customer error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
  }
}

interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
  is_vip?: boolean;
  preferred_contact_method?: string;
}

// PATCH /api/customers/[id] - Update a customer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateCustomerRequest = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.email !== undefined) updates.email = body.email || null;
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.is_vip !== undefined) updates.is_vip = body.is_vip;
    if (body.preferred_contact_method !== undefined) updates.preferred_contact_method = body.preferred_contact_method;

    const { data: customer, error } = await getTable(supabase, 'customers')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE /api/customers/[id] - Delete a customer (only if no orders)
export async function DELETE(
  _request: NextRequest,
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

    // Check if customer has orders
    const { data: customer } = await getTable(supabase, 'customers')
      .select('total_orders')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    if (customer.total_orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete customer with order history' },
        { status: 400 }
      );
    }

    const { error } = await getTable(supabase, 'customers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
