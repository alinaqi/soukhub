import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper to get typed table access for new tables
function getTable(supabase: SupabaseClient, table: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from(table);
}

// Validate UAE phone number format
function validateUAEPhone(phone: string): boolean {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');
  // UAE format: +971 5X XXX XXXX or 05X XXX XXXX
  const uaeRegex = /^(\+971|00971|0)?5[0-9]{8}$/;
  return uaeRegex.test(cleaned);
}

// Format phone number to standard format
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+971')) return cleaned;
  if (cleaned.startsWith('00971')) return '+' + cleaned.slice(2);
  if (cleaned.startsWith('0')) return '+971' + cleaned.slice(1);
  return '+971' + cleaned;
}

// GET /api/suppliers - List all suppliers
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get suppliers with their brand rules
    const { data: suppliers, error } = await getTable(supabase, 'suppliers')
      .select(`
        *,
        supplier_brand_rules (brand, category, priority)
      `)
      .eq('user_id', user.id)
      .order('name');

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
    }

    // Get pending order counts per supplier
    const { data: orderCounts } = await getTable(supabase, 'supplier_orders')
      .select('supplier_id')
      .eq('user_id', user.id)
      .in('status', ['pending_send', 'sent']);

    const countMap: Record<string, number> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderCounts?.forEach((o: any) => {
      countMap[o.supplier_id] = (countMap[o.supplier_id] || 0) + 1;
    });

    // Format response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = suppliers?.map((s: any) => ({
      ...s,
      brands: [...new Set(s.supplier_brand_rules?.map((r: { brand: string }) => r.brand) || [])],
      pending_orders_count: countMap[s.id] || 0,
    }));

    return NextResponse.json({ suppliers: formatted });
  } catch (error) {
    console.error('Fetch suppliers error:', error);
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 });
  }
}

interface CreateSupplierRequest {
  name: string;
  whatsapp_number: string;
  secondary_whatsapp?: string;
  email?: string;
  secondary_email?: string;
  preferred_contact?: 'whatsapp' | 'email' | 'both';
  delivery_times?: string[];
  notes?: string;
  brands?: string[];
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const body: CreateSupplierRequest = await request.json();
    const {
      name,
      whatsapp_number,
      secondary_whatsapp,
      email,
      secondary_email,
      preferred_contact = 'whatsapp',
      delivery_times = [],
      notes,
      brands = [],
    } = body;

    // Validate required fields
    if (!name || !whatsapp_number) {
      return NextResponse.json(
        { error: 'Name and WhatsApp number are required' },
        { status: 400 }
      );
    }

    // Validate phone numbers
    if (!validateUAEPhone(whatsapp_number)) {
      return NextResponse.json(
        { error: 'Invalid UAE WhatsApp number format. Use +971 5X XXX XXXX' },
        { status: 400 }
      );
    }

    if (secondary_whatsapp && !validateUAEPhone(secondary_whatsapp)) {
      return NextResponse.json(
        { error: 'Invalid secondary WhatsApp number format' },
        { status: 400 }
      );
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check for duplicate WhatsApp number
    const { data: existing } = await getTable(supabase, 'suppliers')
      .select('id')
      .eq('user_id', user.id)
      .eq('whatsapp_number', formatPhoneNumber(whatsapp_number))
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'A supplier with this WhatsApp number already exists' },
        { status: 409 }
      );
    }

    // Create supplier
    const { data: supplier, error: supplierError } = await getTable(supabase, 'suppliers')
      .insert({
        user_id: user.id,
        name,
        whatsapp_number: formatPhoneNumber(whatsapp_number),
        secondary_whatsapp: secondary_whatsapp ? formatPhoneNumber(secondary_whatsapp) : null,
        email: email || null,
        secondary_email: secondary_email || null,
        preferred_contact,
        delivery_times,
        notes: notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (supplierError || !supplier) {
      console.error('Error creating supplier:', supplierError);
      return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
    }

    // Create brand rules if brands provided
    if (brands.length > 0) {
      const brandRules = brands.map((brand, index) => ({
        user_id: user.id,
        supplier_id: supplier.id,
        brand,
        priority: index + 1,
      }));

      const { error: rulesError } = await getTable(supabase, 'supplier_brand_rules')
        .insert(brandRules);

      if (rulesError) {
        console.error('Error creating brand rules:', rulesError);
        // Don't fail the whole request, just log
      }
    }

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('activity_log').insert({
      user_id: user.id,
      activity_type: 'listing_created', // Using existing enum
      title: `Added supplier: ${name}`,
      description: `WhatsApp: ${formatPhoneNumber(whatsapp_number)}`,
      metadata: { supplier_id: supplier.id, brands },
    });

    return NextResponse.json({
      success: true,
      supplier: {
        ...supplier,
        brands,
        pending_orders_count: 0,
      },
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
