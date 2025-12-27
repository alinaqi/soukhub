/**
 * Order Routing Engine
 *
 * Automatically routes orders to suppliers based on:
 * 1. Product's preferred supplier (if set)
 * 2. Brand → Supplier rules
 * 3. Priority for fallback suppliers
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTable } from '@/lib/supabase/tables';

export interface OrderItem {
  product_name: string;
  brand?: string;
  category?: string;
}

export interface Supplier {
  id: string;
  name: string;
  whatsapp_number: string;
  is_active: boolean;
  delivery_times: string[] | null;
}

export interface SupplierBrandRule {
  supplier_id: string;
  brand: string;
  category: string | null;
  priority: number;
}

export interface RoutingResult {
  order_id: string;
  supplier_id: string | null;
  supplier_name: string | null;
  routed: boolean;
  reason: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
}

/**
 * Extract brand from product name using common patterns
 */
export function extractBrandFromProductName(productName: string): string | null {
  const normalizedName = productName.toLowerCase();

  // Common phone brands
  const brands = [
    'apple', 'iphone', 'samsung', 'galaxy', 'google', 'pixel',
    'oneplus', 'xiaomi', 'redmi', 'poco', 'huawei', 'oppo', 'vivo',
    'nothing', 'sony', 'lg', 'motorola', 'nokia', 'realme',
    // Laptops
    'macbook', 'dell', 'hp', 'lenovo', 'thinkpad', 'asus', 'acer', 'msi', 'razer',
    // Audio
    'airpods', 'beats', 'bose', 'sennheiser', 'jbl', 'bang & olufsen',
    // Gaming
    'playstation', 'xbox', 'nintendo', 'switch', 'steam deck',
    // Watches
    'apple watch', 'garmin', 'fitbit',
  ];

  // Map product keywords to brands
  const brandMappings: Record<string, string> = {
    'iphone': 'Apple',
    'macbook': 'Apple',
    'airpods': 'Apple',
    'apple watch': 'Apple',
    'galaxy': 'Samsung',
    'pixel': 'Google',
    'thinkpad': 'Lenovo',
    'playstation': 'Sony',
    'ps5': 'Sony',
    'ps4': 'Sony',
    'xbox': 'Microsoft',
    'switch': 'Nintendo',
    'steam deck': 'Steam',
    'redmi': 'Xiaomi',
    'poco': 'Xiaomi',
  };

  // Check mappings first
  for (const [keyword, brand] of Object.entries(brandMappings)) {
    if (normalizedName.includes(keyword)) {
      return brand;
    }
  }

  // Check direct brand matches
  for (const brand of brands) {
    if (normalizedName.includes(brand)) {
      // Capitalize first letter
      return brand.charAt(0).toUpperCase() + brand.slice(1);
    }
  }

  return null;
}

/**
 * Find the best supplier for an order based on product brand/category
 */
export async function findSupplierForOrder(
  supabase: SupabaseClient,
  userId: string,
  orderItems: OrderItem[],
  preferredSupplierId?: string | null
): Promise<{ supplier: Supplier | null; confidence: 'high' | 'medium' | 'low' | 'none'; reason: string }> {

  // 1. Check preferred supplier first
  if (preferredSupplierId) {
    const { data: preferredSupplier } = await getTable(supabase, 'suppliers')
      .select('*')
      .eq('id', preferredSupplierId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (preferredSupplier) {
      return {
        supplier: preferredSupplier as Supplier,
        confidence: 'high',
        reason: 'Product preferred supplier',
      };
    }
  }

  // 2. Extract brands from order items
  const detectedBrands: string[] = [];
  for (const item of orderItems) {
    const brand = item.brand || extractBrandFromProductName(item.product_name);
    if (brand) {
      detectedBrands.push(brand);
    }
  }

  if (detectedBrands.length === 0) {
    return {
      supplier: null,
      confidence: 'none',
      reason: 'Could not detect brand from product name',
    };
  }

  // 3. Find supplier rules for detected brands
  const { data: rules } = await getTable(supabase, 'supplier_brand_rules')
    .select(`
      *,
      supplier:suppliers (*)
    `)
    .eq('user_id', userId)
    .in('brand', detectedBrands)
    .order('priority', { ascending: true });

  if (!rules || rules.length === 0) {
    return {
      supplier: null,
      confidence: 'none',
      reason: `No supplier configured for brand: ${detectedBrands.join(', ')}`,
    };
  }

  // 4. Find active supplier with highest priority (lowest number)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const rule of rules as any[]) {
    if (rule.supplier?.is_active) {
      return {
        supplier: rule.supplier as Supplier,
        confidence: 'high',
        reason: `Brand rule: ${rule.brand} → ${rule.supplier.name}`,
      };
    }
  }

  return {
    supplier: null,
    confidence: 'low',
    reason: 'All matched suppliers are inactive',
  };
}

/**
 * Route a single order to a supplier
 */
export async function routeOrder(
  supabase: SupabaseClient,
  userId: string,
  orderId: string
): Promise<RoutingResult> {
  // Get order with items
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (product_name)
    `)
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (orderError || !order) {
    return {
      order_id: orderId,
      supplier_id: null,
      supplier_name: null,
      routed: false,
      reason: 'Order not found',
      confidence: 'none',
    };
  }

  // Skip if already routed
  if (order.supplier_order_id) {
    return {
      order_id: orderId,
      supplier_id: null,
      supplier_name: null,
      routed: false,
      reason: 'Order already routed',
      confidence: 'none',
    };
  }

  // Get order items
  const orderItems: OrderItem[] = (order.order_items || []).map((item: { product_name: string }) => ({
    product_name: item.product_name,
  }));

  if (orderItems.length === 0) {
    return {
      order_id: orderId,
      supplier_id: null,
      supplier_name: null,
      routed: false,
      reason: 'Order has no items',
      confidence: 'none',
    };
  }

  // Find supplier
  const { supplier, confidence, reason } = await findSupplierForOrder(
    supabase,
    userId,
    orderItems
  );

  if (!supplier) {
    return {
      order_id: orderId,
      supplier_id: null,
      supplier_name: null,
      routed: false,
      reason,
      confidence,
    };
  }

  // Create supplier order
  const { data: supplierOrder, error: supplierOrderError } = await getTable(supabase, 'supplier_orders')
    .insert({
      user_id: userId,
      order_id: orderId,
      supplier_id: supplier.id,
      status: 'pending_send',
    })
    .select()
    .single();

  if (supplierOrderError || !supplierOrder) {
    return {
      order_id: orderId,
      supplier_id: null,
      supplier_name: null,
      routed: false,
      reason: 'Failed to create supplier order',
      confidence: 'none',
    };
  }

  // Update order with supplier_order_id
  await supabase
    .from('orders')
    .update({
      supplier_order_id: (supplierOrder as { id: string }).id,
      routed_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return {
    order_id: orderId,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    routed: true,
    reason,
    confidence,
  };
}

/**
 * Route multiple orders in batch
 */
export async function routeOrders(
  supabase: SupabaseClient,
  userId: string,
  orderIds: string[]
): Promise<RoutingResult[]> {
  const results: RoutingResult[] = [];

  for (const orderId of orderIds) {
    const result = await routeOrder(supabase, userId, orderId);
    results.push(result);
  }

  return results;
}

/**
 * Get unrouted orders that need supplier assignment
 */
export async function getUnroutedOrders(
  supabase: SupabaseClient,
  userId: string
): Promise<{ id: string; marketplace_order_id: string; order_date: string; product_names: string[] }[]> {
  // Orders that require supplier but don't have one assigned
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      marketplace_order_id,
      order_date,
      order_items (product_name)
    `)
    .eq('user_id', userId)
    .is('supplier_order_id', null)
    .neq('requires_supplier', false)
    .in('status', ['pending', 'confirmed', 'processing'])
    .order('order_date', { ascending: false })
    .limit(100);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (orders || []).map((o: any) => ({
    id: o.id,
    marketplace_order_id: o.marketplace_order_id,
    order_date: o.order_date,
    product_names: o.order_items?.map((i: { product_name: string }) => i.product_name) || [],
  }));
}
