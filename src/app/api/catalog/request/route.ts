import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/catalog/request — buyer wants a catalog item THROUGH SoukHub
 * (ADR 0016 amendment: sales complete on-platform; the operator confirms
 * availability and fulfilment over WhatsApp). Public: guests welcome.
 */
export async function POST(request: NextRequest) {
  try {
    const { catalog_product_id, name, contact_phone, note } = await request.json();
    if (typeof catalog_product_id !== 'string' || !catalog_product_id) {
      return NextResponse.json({ error: 'catalog_product_id is required' }, { status: 400 });
    }
    const phone = typeof contact_phone === 'string' ? contact_phone.replace(/[^\d+ ]/g, '').trim() : '';
    if (phone.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'A valid WhatsApp number is required' }, { status: 400 });
    }

    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Item must exist and be active
    const { data: item } = await svc
      .from('catalog_products')
      .select('id, title')
      .eq('id', catalog_product_id)
      .eq('is_active', true)
      .maybeSingle();
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const auth = await createServerSupabase();
    const {
      data: { user },
    } = await auth.auth.getUser();

    const { error } = await svc.from('catalog_requests').insert({
      catalog_product_id,
      user_id: user?.id ?? null,
      name: typeof name === 'string' ? name.slice(0, 80) : null,
      contact_phone: phone.slice(0, 30),
      note: typeof note === 'string' ? note.slice(0, 500) : null,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('catalog request failed:', error);
    return NextResponse.json({ error: 'request_failed' }, { status: 500 });
  }
}
