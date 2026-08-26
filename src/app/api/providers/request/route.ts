import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

/** POST /api/providers/request — buyer wants a device from a specific shop,
 * delivered by a local courier. Public: guests welcome. */
export async function POST(request: NextRequest) {
  try {
    const { provider_id, item_wanted, name, contact_phone, delivery_address } =
      await request.json();
    if (typeof provider_id !== 'string' || !provider_id) {
      return NextResponse.json({ error: 'provider_id is required' }, { status: 400 });
    }
    if (typeof item_wanted !== 'string' || item_wanted.trim().length < 3) {
      return NextResponse.json({ error: 'item_wanted is required' }, { status: 400 });
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
    const { data: provider } = await svc
      .from('providers')
      .select('id')
      .eq('id', provider_id)
      .eq('is_active', true)
      .maybeSingle();
    if (!provider) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

    const auth = await createServerSupabase();
    const {
      data: { user },
    } = await auth.auth.getUser();

    const { error } = await svc.from('provider_requests').insert({
      provider_id,
      user_id: user?.id ?? null,
      name: typeof name === 'string' ? name.slice(0, 80) : null,
      contact_phone: phone.slice(0, 30),
      item_wanted: item_wanted.slice(0, 300),
      delivery_address:
        typeof delivery_address === 'string' ? delivery_address.slice(0, 400) : null,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('provider request failed:', error);
    return NextResponse.json({ error: 'request_failed' }, { status: 500 });
  }
}
