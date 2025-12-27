/**
 * Email Sending Utilities
 *
 * Handles email communication with suppliers and customers.
 * Uses Resend API for email delivery (configurable).
 *
 * For development without Resend API key, generates mailto: links.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getTable } from '@/lib/supabase/tables';

export interface EmailTemplate {
  subject: string;
  body: string;
}

export interface SupplierOrderEmailData {
  supplier_name: string;
  supplier_email: string;
  orders: Array<{
    marketplace_order_id: string;
    items: Array<{
      product_name: string;
      quantity: number;
    }>;
    customer_city?: string;
    delivery_cutoff?: string;
  }>;
  seller_name?: string;
  seller_business?: string;
}

/**
 * Default email templates
 */
export const EMAIL_TEMPLATES = {
  supplier_order: {
    subject: 'Order Request - {{date}} - {{order_count}} items',
    body: `Hi {{supplier_name}},

Please confirm availability for the following items:

{{order_details}}

Please reply with availability status:
✅ "Yes" or "Available" if all items are available
❌ "No" or "Out of stock" if unavailable
🔄 Mention alternative if you have different stock

Need confirmation by: {{cutoff_time}}

Thanks,
{{seller_name}}
{{seller_business}}`,
  },

  supplier_batch: {
    subject: 'Batch Order Request - {{date}} - {{order_count}} orders',
    body: `Hi {{supplier_name}},

I have {{order_count}} orders requiring your products:

{{items_summary}}

Individual order details:
{{order_details}}

Please confirm availability for each order.

Thanks,
{{seller_name}}
{{seller_business}}`,
  },

  supplier_followup: {
    subject: 'Follow-up: Order Request - {{marketplace_order_id}}',
    body: `Hi {{supplier_name}},

Following up on my earlier request for:

{{order_details}}

Could you please confirm availability when you get a chance?

Thanks,
{{seller_name}}`,
  },
};

/**
 * Render email template with variables
 */
export function renderEmailTemplate(
  template: EmailTemplate,
  variables: Record<string, string | number | undefined>
): EmailTemplate {
  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    const replacement = String(value ?? '');
    subject = subject.replace(new RegExp(placeholder, 'g'), replacement);
    body = body.replace(new RegExp(placeholder, 'g'), replacement);
  }

  return { subject, body };
}

/**
 * Format order details for email
 */
export function formatOrderDetailsForEmail(
  orders: SupplierOrderEmailData['orders']
): string {
  return orders
    .map((order, index) => {
      const items = order.items
        .map((item) => `  • ${item.product_name} x${item.quantity}`)
        .join('\n');

      return `${index + 1}. Order #${order.marketplace_order_id}
${items}
   Delivery: ${order.customer_city || 'TBD'}`;
    })
    .join('\n\n');
}

/**
 * Format items summary for batch emails
 */
export function formatItemsSummary(
  orders: SupplierOrderEmailData['orders']
): string {
  const itemCounts = new Map<string, number>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = itemCounts.get(item.product_name) || 0;
      itemCounts.set(item.product_name, current + item.quantity);
    }
  }

  return Array.from(itemCounts.entries())
    .map(([name, qty]) => `• ${name} x${qty}`)
    .join('\n');
}

/**
 * Generate supplier order email
 */
export function generateSupplierOrderEmail(
  data: SupplierOrderEmailData
): EmailTemplate {
  const isBatch = data.orders.length > 1;
  const template = isBatch
    ? EMAIL_TEMPLATES.supplier_batch
    : EMAIL_TEMPLATES.supplier_order;

  const orderDetails = formatOrderDetailsForEmail(data.orders);
  const itemsSummary = isBatch ? formatItemsSummary(data.orders) : '';

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return renderEmailTemplate(template, {
    supplier_name: data.supplier_name,
    date: today,
    order_count: data.orders.length,
    order_details: orderDetails,
    items_summary: itemsSummary,
    cutoff_time: data.orders[0]?.delivery_cutoff || 'End of day',
    seller_name: data.seller_name || 'Seller',
    seller_business: data.seller_business || '',
    marketplace_order_id: data.orders[0]?.marketplace_order_id || '',
  });
}

/**
 * Generate mailto link for email
 * Used when no email API is configured
 */
export function generateMailtoLink(
  to: string,
  template: EmailTemplate
): string {
  const subject = encodeURIComponent(template.subject);
  const body = encodeURIComponent(template.body);
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

/**
 * Send email via Resend API
 * Falls back to mailto link if no API key
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
  from?: string
): Promise<{ success: boolean; method: 'api' | 'mailto'; link?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // No API key - return mailto link
    const link = generateMailtoLink(to, template);
    return { success: true, method: 'mailto', link };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: from || process.env.RESEND_FROM_EMAIL || 'orders@soukhub.app',
        to: [to],
        subject: template.subject,
        text: template.body,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resend API error:', error);
      // Fall back to mailto
      const link = generateMailtoLink(to, template);
      return { success: true, method: 'mailto', link, error: 'API failed, using mailto' };
    }

    return { success: true, method: 'api' };
  } catch (error) {
    console.error('Email send error:', error);
    // Fall back to mailto
    const link = generateMailtoLink(to, template);
    return { success: true, method: 'mailto', link, error: 'API failed, using mailto' };
  }
}

/**
 * Log email to database
 */
export async function logEmail(
  supabase: SupabaseClient,
  userId: string,
  data: {
    supplier_id?: string;
    supplier_order_id?: string;
    to_email: string;
    subject: string;
    body: string;
    status: 'sent' | 'pending' | 'failed';
    method: 'api' | 'mailto';
  }
): Promise<{ id: string } | null> {
  const { data: log, error } = await getTable(supabase, 'email_logs')
    .insert({
      user_id: userId,
      supplier_id: data.supplier_id || null,
      supplier_order_id: data.supplier_order_id || null,
      to_email: data.to_email,
      subject: data.subject,
      body: data.body,
      status: data.status,
      method: data.method,
      sent_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error logging email:', error);
    return null;
  }

  return log;
}
