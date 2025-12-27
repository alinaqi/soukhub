import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getTable } from '@/lib/supabase/tables';

// Validate UAE phone number format
function validateUAEPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
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

// GET /api/suppliers/[id] - Get a single supplier
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

    const { data: supplier, error } = await getTable(supabase, 'suppliers')
      .select(`
        *,
        supplier_brand_rules (brand, category, priority)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Get pending order counts
    const { count } = await getTable(supabase, 'supplier_orders')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)
      .in('status', ['pending_send', 'sent']);

    return NextResponse.json({
      supplier: {
        ...supplier,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        brands: supplier.supplier_brand_rules?.map((r: any) => r.brand) || [],
        pending_orders_count: count || 0,
      },
    });
  } catch (error) {
    console.error('Fetch supplier error:', error);
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 });
  }
}

interface UpdateSupplierRequest {
  name?: string;
  whatsapp_number?: string;
  secondary_whatsapp?: string;
  email?: string;
  secondary_email?: string;
  preferred_contact?: 'whatsapp' | 'email' | 'both';
  delivery_times?: string[];
  notes?: string;
  is_active?: boolean;
  brands?: string[];
}

// PATCH /api/suppliers/[id] - Update a supplier
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateSupplierRequest = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await getTable(supabase, 'suppliers')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    // Validate phone numbers if provided
    if (body.whatsapp_number && !validateUAEPhone(body.whatsapp_number)) {
      return NextResponse.json(
        { error: 'Invalid UAE WhatsApp number format' },
        { status: 400 }
      );
    }

    if (body.secondary_whatsapp && !validateUAEPhone(body.secondary_whatsapp)) {
      return NextResponse.json(
        { error: 'Invalid secondary WhatsApp number format' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.whatsapp_number !== undefined) updates.whatsapp_number = formatPhoneNumber(body.whatsapp_number);
    if (body.secondary_whatsapp !== undefined) updates.secondary_whatsapp = body.secondary_whatsapp ? formatPhoneNumber(body.secondary_whatsapp) : null;
    if (body.email !== undefined) updates.email = body.email || null;
    if (body.secondary_email !== undefined) updates.secondary_email = body.secondary_email || null;
    if (body.preferred_contact !== undefined) updates.preferred_contact = body.preferred_contact;
    if (body.delivery_times !== undefined) updates.delivery_times = body.delivery_times;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    // Update supplier
    const { data: supplier, error } = await getTable(supabase, 'suppliers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating supplier:', error);
      return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
    }

    // Update brand rules if provided
    if (body.brands !== undefined) {
      // Delete existing rules
      await getTable(supabase, 'supplier_brand_rules')
        .delete()
        .eq('supplier_id', id);

      // Insert new rules
      if (body.brands.length > 0) {
        const brandRules = body.brands.map((brand, index) => ({
          user_id: user.id,
          supplier_id: id,
          brand,
          priority: index + 1,
        }));

        await getTable(supabase, 'supplier_brand_rules').insert(brandRules);
      }
    }

    return NextResponse.json({
      success: true,
      supplier: {
        ...supplier,
        brands: body.brands || [],
      },
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 });
  }
}

// DELETE /api/suppliers/[id] - Deactivate a supplier (soft delete)
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

    // Check for pending orders
    const { count: pendingCount } = await getTable(supabase, 'supplier_orders')
      .select('*', { count: 'exact', head: true })
      .eq('supplier_id', id)
      .in('status', ['pending_send', 'sent', 'confirmed']);

    if (pendingCount && pendingCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot deactivate supplier with ${pendingCount} pending orders. Complete or reassign them first.`,
        },
        { status: 400 }
      );
    }

    // Soft delete by setting is_active = false
    const { error } = await getTable(supabase, 'suppliers')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deactivating supplier:', error);
      return NextResponse.json({ error: 'Failed to deactivate supplier' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json({ error: 'Failed to deactivate supplier' }, { status: 500 });
  }
}
