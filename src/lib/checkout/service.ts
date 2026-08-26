import { createClient } from '@supabase/supabase-js';

/**
 * Buyer checkout v1 (Buy online — COD): creates a real order in the selling
 * store's ops pipeline. Cards land with Stripe in M2 (ADR 0012); the order
 * model is identical so that upgrade is additive.
 */
function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface CheckoutInput {
  product_id: string;
  quantity?: number;
  buyer: { name: string; phone: string; emirate: string; address: string };
  note?: string;
  user_id?: string | null;
}

export type CheckoutResult =
  | { ok: true; ref: string; total: number; product_name: string; store_slug: string | null }
  | { ok: false; status: number; error: string };

function orderRef(): string {
  const chars = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SH-${s}`;
}

export async function createBuyerOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const quantity = Math.min(Math.max(Math.trunc(input.quantity ?? 1), 1), 5);
  const name = input.buyer.name?.trim();
  const phone = (input.buyer.phone ?? '').replace(/[^\d+ ]/g, '').trim();
  const emirate = input.buyer.emirate?.trim();
  const address = input.buyer.address?.trim();
  if (!name || name.length < 2) return { ok: false, status: 400, error: 'name_required' };
  if (phone.replace(/\D/g, '').length < 8) return { ok: false, status: 400, error: 'phone_invalid' };
  if (!emirate) return { ok: false, status: 400, error: 'emirate_required' };
  if (!address || address.length < 5) return { ok: false, status: 400, error: 'address_required' };

  const db = svc();
  const { data: product } = await db
    .from('products')
    .select('id, name, base_price, org_id, user_id, is_published, slug, short_id')
    .eq('id', input.product_id)
    .eq('is_published', true)
    .maybeSingle();
  if (!product || product.base_price == null) {
    return { ok: false, status: 404, error: 'product_unavailable' };
  }
  const { data: org } = await db
    .from('organizations')
    .select('slug, is_published, owner_user_id')
    .eq('id', product.org_id)
    .single();
  if (!org?.is_published) return { ok: false, status: 404, error: 'product_unavailable' };

  const price = Number(product.base_price);
  const total = price * quantity;
  const ref = orderRef();

  const { data: order, error } = await db
    .from('orders')
    .insert({
      user_id: product.user_id ?? org.owner_user_id,
      org_id: product.org_id,
      marketplace: 'soukhub',
      marketplace_order_id: ref,
      status: 'pending',
      payment_method: 'cod',
      customer_name: name,
      customer_phone: phone.slice(0, 30),
      shipping_city: emirate,
      shipping_address: { address, emirate },
      subtotal: total,
      total,
      currency: 'AED',
      order_date: new Date().toISOString(),
      notes: input.note?.slice(0, 500) ?? null,
      raw_data: { source: 'soukhub_checkout', buyer_user_id: input.user_id ?? null },
    })
    .select('id')
    .single();
  if (error) return { ok: false, status: 500, error: error.message };

  const { error: itemError } = await db.from('order_items').insert({
    order_id: order.id,
    product_name: product.name,
    quantity,
    unit_price: price,
    total_price: total,
  });
  if (itemError) return { ok: false, status: 500, error: itemError.message };

  return { ok: true, ref, total, product_name: product.name, store_slug: org.slug };
}

/** Public order status lookup: reference + phone must both match. */
export async function lookupOrder(ref: string, phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (!ref?.startsWith('SH-') || digits.length < 8) return null;
  const { data } = await svc()
    .from('orders')
    .select('marketplace_order_id, status, total, currency, order_date, customer_phone, shipping_city')
    .eq('marketplace', 'soukhub')
    .eq('marketplace_order_id', ref.toUpperCase())
    .maybeSingle();
  if (!data) return null;
  const stored = (data.customer_phone ?? '').replace(/\D/g, '');
  if (!stored || !stored.endsWith(digits.slice(-8))) return null;
  return {
    ref: data.marketplace_order_id,
    status: data.status,
    total: Number(data.total),
    currency: data.currency,
    order_date: data.order_date,
    emirate: data.shipping_city,
  };
}
