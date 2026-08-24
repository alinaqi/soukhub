/**
 * WhatsApp Messaging Utilities
 *
 * Provides utilities for WhatsApp messaging:
 * - Message template rendering
 * - WhatsApp link generation (wa.me)
 * - Message logging
 *
 * Note: Full WhatsApp Web integration would require whatsapp-web.js
 * running on the server. This implementation uses wa.me links
 * for immediate functionality.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTable } from '@/lib/supabase/tables';

export interface OrderItemForMessage {
  product_name: string;
  quantity: number;
}

export interface OrderForMessage {
  id: string;
  marketplace_order_id: string;
  marketplace: string;
  customer_name: string;
  shipping_city: string;
  items: OrderItemForMessage[];
}

export interface SupplierForMessage {
  id: string;
  name: string;
  whatsapp_number: string;
}

/**
 * Default message templates
 */
export const DEFAULT_TEMPLATES = {
  supplier_order: `Hi {{supplier_name}},

I have a new order that needs the following items:

{{items_list}}

Customer: {{customer_name}}
City: {{shipping_city}}
Order ID: {{marketplace_order_id}}

Please confirm availability. Thanks!`,

  supplier_batch: `Hi {{supplier_name}},

I have {{order_count}} orders that need the following items:

{{items_summary}}

Please confirm availability and expected delivery time. Thanks!`,

  supplier_confirmation: `Hi {{supplier_name}},

Thank you for confirming the order.

Order ID: {{marketplace_order_id}}
Expected delivery: {{expected_delivery}}

Please let me know when it's ready. Thanks!`,

  thank_you: `Hi {{customer_name}},

Thank you for your order! Your {{product_name}} is on its way.

Order ID: {{marketplace_order_id}}
Tracking: {{tracking_number}}

If you love your purchase, we'd appreciate a review!`,
};

/**
 * Render a message template with variables
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined>
): string {
  let result = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), String(value ?? ''));
  }

  return result;
}

/**
 * Format items list for message
 */
export function formatItemsList(items: OrderItemForMessage[]): string {
  return items.map((item) => `• ${item.product_name} x${item.quantity}`).join('\n');
}

/**
 * Generate a supplier order message
 */
export function generateSupplierOrderMessage(
  supplier: SupplierForMessage,
  order: OrderForMessage,
  template?: string
): string {
  const messageTemplate = template || DEFAULT_TEMPLATES.supplier_order;

  return renderTemplate(messageTemplate, {
    supplier_name: supplier.name,
    marketplace_order_id: order.marketplace_order_id,
    marketplace: order.marketplace,
    customer_name: order.customer_name,
    shipping_city: order.shipping_city,
    items_list: formatItemsList(order.items),
  });
}

/**
 * Generate a batch order message for a supplier
 */
export function generateBatchOrderMessage(
  supplier: SupplierForMessage,
  orders: OrderForMessage[],
  template?: string
): string {
  const messageTemplate = template || DEFAULT_TEMPLATES.supplier_batch;

  // Aggregate items across all orders
  const itemCounts = new Map<string, number>();
  for (const order of orders) {
    for (const item of order.items) {
      const current = itemCounts.get(item.product_name) || 0;
      itemCounts.set(item.product_name, current + item.quantity);
    }
  }

  const itemsSummary = Array.from(itemCounts.entries())
    .map(([name, qty]) => `• ${name} x${qty}`)
    .join('\n');

  return renderTemplate(messageTemplate, {
    supplier_name: supplier.name,
    order_count: orders.length,
    items_summary: itemsSummary,
  });
}

/**
 * Generate WhatsApp link (wa.me)
 * This opens WhatsApp with pre-filled message
 */
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Clean phone number - remove spaces, dashes, and ensure international format
  let cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  // Ensure it starts with country code (no + for wa.me)
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('0')) {
    // Assume UAE if starts with 0
    cleaned = '971' + cleaned.slice(1);
  } else if (!cleaned.startsWith('971')) {
    cleaned = '971' + cleaned;
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encodedMessage}`;
}

/**
 * Log a WhatsApp message to the database
 */
export async function logWhatsAppMessage(
  supabase: SupabaseClient,
  userId: string,
  data: {
    supplier_order_id?: string;
    supplier_id?: string;
    phone_number: string;
    message_content: string;
    direction: 'outgoing' | 'incoming';
    status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  }
): Promise<{ id: string } | null> {
  const { data: message, error } = await getTable(supabase, 'whatsapp_messages')
    .insert({
      user_id: userId,
      supplier_order_id: data.supplier_order_id || null,
      supplier_id: data.supplier_id || null,
      phone_number: data.phone_number,
      message_content: data.message_content,
      direction: data.direction,
      status: data.status || 'pending',
      sent_at: data.direction === 'outgoing' ? new Date().toISOString() : null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error logging WhatsApp message:', error);
    return null;
  }

  return message;
}

/**
 * Get message templates for a user
 */
export async function getMessageTemplates(
  supabase: SupabaseClient,
  userId: string
): Promise<Array<{ id: string; name: string; template_type: string; content: string; is_default: boolean }>> {
  const { data: templates } = await getTable(supabase, 'message_templates')
    .select('id, name, template_type, content, is_default')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  return templates || [];
}

/**
 * Create default message templates for a user
 */
export async function createDefaultTemplates(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const templates = [
    {
      user_id: userId,
      name: 'Supplier Order',
      template_type: 'supplier_order',
      content: DEFAULT_TEMPLATES.supplier_order,
      is_default: true,
    },
    {
      user_id: userId,
      name: 'Supplier Batch Order',
      template_type: 'supplier_batch',
      content: DEFAULT_TEMPLATES.supplier_batch,
      is_default: true,
    },
    {
      user_id: userId,
      name: 'Thank You Message',
      template_type: 'thank_you',
      content: DEFAULT_TEMPLATES.thank_you,
      is_default: true,
    },
  ];

  await getTable(supabase, 'message_templates').insert(templates);
}
