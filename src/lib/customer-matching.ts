/**
 * Customer Matching Engine
 *
 * Automatically creates or matches customers from order data.
 * Matching priority:
 * 1. Email (exact match)
 * 2. Phone number (normalized match)
 * 3. Name + City combination (fuzzy)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTable } from '@/lib/supabase/tables';

export interface OrderCustomerData {
  email?: string | null;
  phone?: string | null;
  name: string;
  city?: string;
  address?: string;
}

export interface CustomerMatchResult {
  customer_id: string;
  is_new: boolean;
  match_type: 'email' | 'phone' | 'name_city' | 'new';
  confidence: number;
}

/**
 * Normalize phone number for matching
 * Removes spaces, dashes, and country codes
 */
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Remove country codes
  if (cleaned.startsWith('+971')) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith('00971')) {
    cleaned = cleaned.slice(5);
  } else if (cleaned.startsWith('971')) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Normalize name for matching
 * Lowercases and removes extra spaces
 */
function normalizeName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Find or create a customer from order data
 */
export async function findOrCreateCustomer(
  supabase: SupabaseClient,
  userId: string,
  orderData: OrderCustomerData,
  orderId?: string,
  orderTotal?: number
): Promise<CustomerMatchResult> {
  const { email, phone, name, city, address } = orderData;

  // 1. Try to match by email (highest confidence)
  if (email) {
    const { data: emailMatch } = await getTable(supabase, 'customers')
      .select('id')
      .eq('user_id', userId)
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (emailMatch) {
      // Update customer stats
      await updateCustomerStats(supabase, emailMatch.id, orderId, orderTotal);
      return {
        customer_id: emailMatch.id,
        is_new: false,
        match_type: 'email',
        confidence: 1.0,
      };
    }
  }

  // 2. Try to match by phone
  if (phone) {
    const normalizedPhone = normalizePhone(phone);

    // Get all customers with phone numbers
    const { data: phoneCustomers } = await getTable(supabase, 'customers')
      .select('id, phone')
      .eq('user_id', userId)
      .not('phone', 'is', null);

    if (phoneCustomers) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const customer of phoneCustomers as any[]) {
        if (customer.phone && normalizePhone(customer.phone) === normalizedPhone) {
          await updateCustomerStats(supabase, customer.id, orderId, orderTotal);
          return {
            customer_id: customer.id,
            is_new: false,
            match_type: 'phone',
            confidence: 0.95,
          };
        }
      }
    }
  }

  // 3. Try to match by name + city (lower confidence)
  if (name && city) {
    const normalizedName = normalizeName(name);

    const { data: nameMatches } = await getTable(supabase, 'customers')
      .select('id, name, addresses')
      .eq('user_id', userId)
      .ilike('name', `%${name}%`);

    if (nameMatches && nameMatches.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const customer of nameMatches as any[]) {
        const customerName = normalizeName(customer.name || '');

        // Check if names are similar enough
        if (customerName === normalizedName || customerName.includes(normalizedName)) {
          // Check if any address matches the city
          const addresses = customer.addresses || [];
          const cityMatch = addresses.some(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (addr: any) => addr.city?.toLowerCase() === city.toLowerCase()
          );

          if (cityMatch) {
            await updateCustomerStats(supabase, customer.id, orderId, orderTotal);
            return {
              customer_id: customer.id,
              is_new: false,
              match_type: 'name_city',
              confidence: 0.75,
            };
          }
        }
      }
    }
  }

  // 4. Create new customer
  const newAddress = city || address
    ? {
        type: 'shipping' as const,
        line1: address || '',
        city: city || '',
        country: 'UAE',
      }
    : null;

  const { data: newCustomer, error } = await getTable(supabase, 'customers')
    .insert({
      user_id: userId,
      name: name,
      email: email?.toLowerCase().trim() || null,
      phone: phone || null,
      total_orders: orderId ? 1 : 0,
      total_spent: orderTotal || 0,
      first_order_date: orderId ? new Date().toISOString() : null,
      last_order_date: orderId ? new Date().toISOString() : null,
      addresses: newAddress ? [newAddress] : [],
      tags: [],
      is_vip: false,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    throw new Error('Failed to create customer');
  }

  return {
    customer_id: newCustomer.id,
    is_new: true,
    match_type: 'new',
    confidence: 1.0,
  };
}

/**
 * Update customer statistics after an order
 */
async function updateCustomerStats(
  supabase: SupabaseClient,
  customerId: string,
  orderId?: string,
  orderTotal?: number
): Promise<void> {
  if (!orderId) return;

  const { data: customer } = await getTable(supabase, 'customers')
    .select('total_orders, total_spent, first_order_date')
    .eq('id', customerId)
    .single();

  if (!customer) return;

  const updates: Record<string, unknown> = {
    total_orders: (customer.total_orders || 0) + 1,
    total_spent: (customer.total_spent || 0) + (orderTotal || 0),
    last_order_date: new Date().toISOString(),
  };

  if (!customer.first_order_date) {
    updates.first_order_date = new Date().toISOString();
  }

  await getTable(supabase, 'customers').update(updates).eq('id', customerId);
}

/**
 * Process multiple orders and match/create customers
 */
export async function processOrderCustomers(
  supabase: SupabaseClient,
  userId: string,
  orders: Array<{
    id: string;
    customer_email?: string | null;
    customer_phone?: string | null;
    customer_name: string;
    shipping_city?: string;
    shipping_address?: string;
    total?: number;
  }>
): Promise<Map<string, CustomerMatchResult>> {
  const results = new Map<string, CustomerMatchResult>();

  for (const order of orders) {
    try {
      const result = await findOrCreateCustomer(
        supabase,
        userId,
        {
          email: order.customer_email,
          phone: order.customer_phone,
          name: order.customer_name,
          city: order.shipping_city,
          address: order.shipping_address,
        },
        order.id,
        order.total
      );
      results.set(order.id, result);
    } catch (error) {
      console.error(`Error processing customer for order ${order.id}:`, error);
    }
  }

  return results;
}

/**
 * Link an order to a customer
 */
export async function linkOrderToCustomer(
  supabase: SupabaseClient,
  orderId: string,
  customerId: string
): Promise<void> {
  await supabase.from('orders').update({ customer_id: customerId }).eq('id', orderId);
}
