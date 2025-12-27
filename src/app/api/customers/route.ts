import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

// GET /api/customers - List all customers
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
    const search = searchParams.get('search');
    const vipOnly = searchParams.get('vip') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = getTable(supabase, 'customers')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('last_order_date', { ascending: false, nullsFirst: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (vipOnly) {
      query = query.eq('is_vip', true);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: customers, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Mark repeat customers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = customers?.map((c: any) => ({
      ...c,
      is_repeat: c.total_orders > 1,
    }));

    return NextResponse.json({
      customers: formatted,
      total: count,
      hasMore: count ? offset + limit < count : false,
    });
  } catch (error) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
  is_vip?: boolean;
}

// POST /api/customers - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body: CreateCustomerRequest = await request.json();
    const { name, email, phone, notes, tags = [], is_vip = false } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'At least email or phone is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for existing customer
    let existingQuery = getTable(supabase, 'customers')
      .select('id, name')
      .eq('user_id', user.id);

    if (email) {
      existingQuery = existingQuery.eq('email', email);
    }
    if (phone) {
      existingQuery = existingQuery.or(`phone.eq.${phone}`);
    }

    const { data: existing } = await existingQuery.maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `Customer "${existing.name}" already exists with this contact info` },
        { status: 409 }
      );
    }

    const { data: customer, error } = await getTable(supabase, 'customers')
      .insert({
        user_id: user.id,
        name,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        tags,
        is_vip,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
