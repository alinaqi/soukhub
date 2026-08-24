/**
 * Unavailable Product Handling
 *
 * Manages the flow when suppliers report products as unavailable:
 * 1. Find alternative suppliers
 * 2. Track alternative offers
 * 3. Generate customer messaging options
 * 4. Handle cancellations
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTable } from '@/lib/supabase/tables';

export interface UnavailableOrderContext {
  supplier_order_id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  marketplace_order_id: string;
  customer_name: string;
  original_supplier_id: string;
  original_supplier_name: string;
  alternative_product?: string;
}

export interface AlternativeSupplier {
  id: string;
  name: string;
  whatsapp_number: string;
  avg_rating?: number;
  last_order_date?: string;
  products_supplied?: string[];
}

export interface AlternativeOption {
  type: 'alternative_supplier' | 'alternative_product' | 'partial_fulfillment' | 'cancel';
  label: string;
  description: string;
  action_data?: Record<string, unknown>;
}

export interface CustomerMessageOption {
  type: 'waiting' | 'alternative' | 'cancel' | 'partial';
  subject: string;
  message: string;
}

/**
 * Find alternative suppliers who might have the product
 */
export async function findAlternativeSuppliers(
  supabase: SupabaseClient,
  userId: string,
  productName: string,
  excludeSupplierId: string
): Promise<AlternativeSupplier[]> {
  // Get all active suppliers except the original one
  const { data: suppliers } = await getTable(supabase, 'suppliers')
    .select('id, name, whatsapp_number')
    .eq('user_id', userId)
    .neq('id', excludeSupplierId)
    .eq('status', 'active');

  if (!suppliers || suppliers.length === 0) {
    return [];
  }

  // Check which suppliers have previously supplied similar products
  const productKeywords = productName.toLowerCase().split(' ').filter((w) => w.length > 2);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rankedSuppliers: Array<AlternativeSupplier & { score: number }> = [];

  for (const supplier of suppliers) {
    // Get recent orders from this supplier
    const { data: recentOrders } = await getTable(supabase, 'supplier_orders')
      .select(`
        id,
        status,
        created_at,
        orders:order_id (
          order_items (product_name)
        )
      `)
      .eq('supplier_id', supplier.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(50);

    // Calculate score based on product similarity
    let score = 0;
    const productsSupplied = new Set<string>();

    if (recentOrders) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const order of recentOrders as any[]) {
        const items = order.orders?.order_items || [];
        for (const item of items) {
          productsSupplied.add(item.product_name);
          const itemLower = item.product_name.toLowerCase();
          for (const keyword of productKeywords) {
            if (itemLower.includes(keyword)) {
              score += 10;
            }
          }
        }
      }
    }

    rankedSuppliers.push({
      id: supplier.id,
      name: supplier.name,
      whatsapp_number: supplier.whatsapp_number,
      products_supplied: Array.from(productsSupplied).slice(0, 5),
      score,
    });
  }

  // Sort by score and return top matches
  return rankedSuppliers.sort((a, b) => b.score - a.score).slice(0, 5);
}

/**
 * Get available options for handling an unavailable order
 */
export function getAlternativeOptions(
  context: UnavailableOrderContext,
  alternativeSuppliers: AlternativeSupplier[]
): AlternativeOption[] {
  const options: AlternativeOption[] = [];

  // Option 1: Try alternative suppliers
  if (alternativeSuppliers.length > 0) {
    options.push({
      type: 'alternative_supplier',
      label: 'Try Another Supplier',
      description: `${alternativeSuppliers.length} other supplier(s) might have this product`,
      action_data: {
        suppliers: alternativeSuppliers.map((s) => ({ id: s.id, name: s.name })),
      },
    });
  }

  // Option 2: Offer alternative product (if supplier suggested one)
  if (context.alternative_product) {
    options.push({
      type: 'alternative_product',
      label: 'Offer Alternative',
      description: `Supplier offered: ${context.alternative_product}`,
      action_data: {
        alternative: context.alternative_product,
      },
    });
  }

  // Option 3: Cancel this item
  options.push({
    type: 'cancel',
    label: 'Cancel & Refund',
    description: 'Cancel this item and process refund',
    action_data: {},
  });

  return options;
}

/**
 * Generate customer message options for unavailable product
 */
export function generateCustomerMessages(
  context: UnavailableOrderContext
): CustomerMessageOption[] {
  const messages: CustomerMessageOption[] = [];

  // Waiting message - buying time to find alternative
  messages.push({
    type: 'waiting',
    subject: 'Order Update',
    message: `Hi ${context.customer_name},

Thank you for your order (${context.marketplace_order_id}).

We're currently confirming availability for "${context.product_name}" and will update you within 24 hours.

We appreciate your patience!`,
  });

  // Alternative product message
  if (context.alternative_product) {
    messages.push({
      type: 'alternative',
      subject: 'Alternative Available',
      message: `Hi ${context.customer_name},

Regarding your order (${context.marketplace_order_id}) for "${context.product_name}":

Unfortunately, the exact item is currently unavailable. However, we have an alternative that might interest you:

${context.alternative_product}

Would you like to proceed with this alternative, or would you prefer a full refund?

Please reply to let us know your preference.`,
    });
  }

  // Cancellation message
  messages.push({
    type: 'cancel',
    subject: 'Order Cancellation',
    message: `Hi ${context.customer_name},

We regret to inform you that "${context.product_name}" from your order (${context.marketplace_order_id}) is currently out of stock.

We have processed a full refund for this item. The amount will be credited to your original payment method within 3-5 business days.

We apologize for any inconvenience and hope to serve you again soon.`,
  });

  return messages;
}

/**
 * Create a new supplier order for an alternative supplier
 */
export async function createAlternativeSupplierOrder(
  supabase: SupabaseClient,
  userId: string,
  originalSupplierOrderId: string,
  newSupplierId: string
): Promise<{ success: boolean; new_supplier_order_id?: string; error?: string }> {
  // Get the original supplier order
  const { data: originalOrder } = await getTable(supabase, 'supplier_orders')
    .select('*')
    .eq('id', originalSupplierOrderId)
    .single();

  if (!originalOrder) {
    return { success: false, error: 'Original supplier order not found' };
  }

  // Mark original as cancelled
  await getTable(supabase, 'supplier_orders')
    .update({
      status: 'cancelled',
      notes: `Reassigned to alternative supplier`,
    })
    .eq('id', originalSupplierOrderId);

  // Create new supplier order
  const { data: newOrder, error } = await getTable(supabase, 'supplier_orders')
    .insert({
      user_id: userId,
      order_id: originalOrder.order_id,
      supplier_id: newSupplierId,
      status: 'pending',
      notes: `Reassigned from supplier order ${originalSupplierOrderId}`,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, new_supplier_order_id: newOrder.id };
}

/**
 * Mark order item as cancelled due to unavailability
 */
export async function cancelUnavailableOrder(
  supabase: SupabaseClient,
  supplierOrderId: string,
  orderId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  // Update supplier order
  await getTable(supabase, 'supplier_orders')
    .update({
      status: 'cancelled',
      notes: reason,
    })
    .eq('id', supplierOrderId);

  // Check if this was the only/last supplier order for this order
  const { data: remainingOrders } = await getTable(supabase, 'supplier_orders')
    .select('id')
    .eq('order_id', orderId)
    .neq('id', supplierOrderId)
    .not('status', 'eq', 'cancelled');

  // If no remaining active supplier orders, cancel the main order
  if (!remainingOrders || remainingOrders.length === 0) {
    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        notes: `Cancelled: ${reason}`,
      })
      .eq('id', orderId);
  }

  return { success: true };
}
