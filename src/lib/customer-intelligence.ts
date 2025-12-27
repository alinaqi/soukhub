/**
 * Customer Intelligence
 *
 * Analyzes customer data to identify:
 * - Repeat customers
 * - VIP customers
 * - Customer preferences
 * - Purchase patterns
 *
 * Generates personalized messages and referral codes.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTable } from '@/lib/supabase/tables';

export interface CustomerStats {
  customer_id: string;
  name: string;
  email?: string;
  phone?: string;
  total_orders: number;
  total_spent: number;
  first_order_date: string;
  last_order_date: string;
  average_order_value: number;
  favorite_brands: string[];
  is_repeat: boolean;
  is_vip: boolean;
  days_since_last_order: number;
}

export interface RepeatCustomerRules {
  orders_for_repeat: number; // e.g., 2+ orders = repeat
  spent_for_vip: number; // e.g., 5000+ AED = VIP
  active_days: number; // e.g., ordered in last 90 days = active
}

export const DEFAULT_RULES: RepeatCustomerRules = {
  orders_for_repeat: 2,
  spent_for_vip: 5000,
  active_days: 90,
};

/**
 * Get customer stats for an order
 */
export async function getCustomerStatsForOrder(
  supabase: SupabaseClient,
  userId: string,
  orderId: string
): Promise<CustomerStats | null> {
  // Get order with customer info
  const { data: order } = await supabase
    .from('orders')
    .select('id, customer_id, customer_name, customer_email, customer_phone')
    .eq('id', orderId)
    .single();

  if (!order?.customer_id) {
    return null;
  }

  return getCustomerStats(supabase, userId, order.customer_id);
}

/**
 * Get comprehensive customer stats
 */
export async function getCustomerStats(
  supabase: SupabaseClient,
  userId: string,
  customerId: string,
  rules: RepeatCustomerRules = DEFAULT_RULES
): Promise<CustomerStats | null> {
  // Get customer
  const { data: customer } = await getTable(supabase, 'customers')
    .select('*')
    .eq('id', customerId)
    .eq('user_id', userId)
    .single();

  if (!customer) {
    return null;
  }

  // Get all orders for this customer
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      total,
      created_at,
      order_items (product_name)
    `)
    .eq('customer_id', customerId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (!orders || orders.length === 0) {
    return null;
  }

  // Calculate stats
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = totalSpent / totalOrders;

  // Get favorite brands from product names
  const brandCounts = new Map<string, number>();
  for (const order of orders) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const item of (order as any).order_items || []) {
      // Extract brand from product name (first word usually)
      const brand = item.product_name?.split(' ')[0] || 'Unknown';
      brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
    }
  }

  const favoriteBrands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([brand]) => brand);

  const firstOrderDate = orders[orders.length - 1].created_at;
  const lastOrderDate = orders[0].created_at;
  const daysSinceLastOrder = Math.floor(
    (Date.now() - new Date(lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const isRepeat = totalOrders >= rules.orders_for_repeat;
  const isVip = totalSpent >= rules.spent_for_vip;

  return {
    customer_id: customerId,
    name: customer.name || 'Unknown',
    email: customer.email,
    phone: customer.phone,
    total_orders: totalOrders,
    total_spent: totalSpent,
    first_order_date: firstOrderDate,
    last_order_date: lastOrderDate,
    average_order_value: Math.round(avgOrderValue * 100) / 100,
    favorite_brands: favoriteBrands,
    is_repeat: isRepeat,
    is_vip: isVip,
    days_since_last_order: daysSinceLastOrder,
  };
}

/**
 * Generate thank-you note for customer
 */
export function generateThankYouNote(
  stats: CustomerStats,
  productName: string,
  orderId: string,
  sellerName?: string
): string {
  const greeting = `Hi ${stats.name}!`;

  let body: string;

  if (stats.is_vip) {
    body = `Thank you for being one of our most valued customers! This is your ${ordinal(stats.total_orders)} order with us, and we truly appreciate your continued trust.

Your ${productName} is on its way!
Order: #${orderId}

As a VIP customer, you're always our priority. If you ever need anything, just reach out!`;
  } else if (stats.is_repeat) {
    body = `Great to see you again! This is your ${ordinal(stats.total_orders)} order with us - thank you for coming back!

Your ${productName} is on its way!
Order: #${orderId}

We hope you love it as much as your previous purchases!`;
  } else {
    body = `Thank you for your first order with us! We're excited to have you as a customer.

Your ${productName} is on its way!
Order: #${orderId}

If you love your purchase, we'd really appreciate a review. It helps us a lot!`;
  }

  const signature = sellerName
    ? `\n\nBest regards,\n${sellerName}`
    : '\n\nBest regards,\nYour Seller';

  return `${greeting}\n\n${body}${signature}`;
}

/**
 * Generate referral code for customer
 */
export function generateReferralCode(customerName: string): string {
  // Use first name + random suffix
  const firstName = customerName.split(' ')[0].toUpperCase().slice(0, 6);
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${firstName}${suffix}`;
}

/**
 * Create referral code in database
 */
export async function createReferralCode(
  supabase: SupabaseClient,
  userId: string,
  customerId: string,
  discountPercent: number = 10,
  expiresInDays: number = 30
): Promise<{ code: string; id: string } | null> {
  // Get customer name
  const { data: customer } = await getTable(supabase, 'customers')
    .select('name')
    .eq('id', customerId)
    .single();

  if (!customer) {
    return null;
  }

  const code = generateReferralCode(customer.name);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { data: referral, error } = await getTable(supabase, 'referral_codes')
    .insert({
      user_id: userId,
      customer_id: customerId,
      code,
      discount_percent: discountPercent,
      max_uses: 5,
      times_used: 0,
      expires_at: expiresAt.toISOString(),
    })
    .select('id, code')
    .single();

  if (error) {
    console.error('Error creating referral code:', error);
    return null;
  }

  return referral;
}

/**
 * Get customer segment
 */
export function getCustomerSegment(
  stats: CustomerStats
): 'new' | 'returning' | 'loyal' | 'vip' | 'at_risk' | 'churned' {
  if (stats.is_vip) return 'vip';
  if (stats.days_since_last_order > 180) return 'churned';
  if (stats.days_since_last_order > 90) return 'at_risk';
  if (stats.total_orders >= 5) return 'loyal';
  if (stats.total_orders >= 2) return 'returning';
  return 'new';
}

/**
 * Helper: Convert number to ordinal
 */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Get all repeat customers
 */
export async function getRepeatCustomers(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 50
): Promise<CustomerStats[]> {
  // Get customers with order counts
  const { data: customers } = await getTable(supabase, 'customers')
    .select('id, name, email, phone, total_orders, total_spent, first_order_date, last_order_date')
    .eq('user_id', userId)
    .gte('total_orders', 2)
    .order('total_spent', { ascending: false })
    .limit(limit);

  if (!customers) {
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return customers.map((c: any) => {
    const daysSinceLastOrder = c.last_order_date
      ? Math.floor((Date.now() - new Date(c.last_order_date).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      customer_id: c.id,
      name: c.name || 'Unknown',
      email: c.email,
      phone: c.phone,
      total_orders: c.total_orders || 0,
      total_spent: c.total_spent || 0,
      first_order_date: c.first_order_date,
      last_order_date: c.last_order_date,
      average_order_value: c.total_orders ? (c.total_spent / c.total_orders) : 0,
      favorite_brands: [],
      is_repeat: (c.total_orders || 0) >= 2,
      is_vip: (c.total_spent || 0) >= 5000,
      days_since_last_order: daysSinceLastOrder,
    };
  });
}
