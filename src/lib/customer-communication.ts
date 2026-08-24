/**
 * Customer Communication Templates
 *
 * Pre-built templates for common customer communications via Email and WhatsApp.
 * Supports variable substitution for personalization.
 */

export interface CommunicationTemplate {
  id: string;
  name: string;
  category: 'thank_you' | 'order_update' | 'promotion' | 'feedback' | 'reactivation' | 'custom';
  subject?: string; // For email only
  message: string;
  icon: string;
}

export interface CustomerInfo {
  name: string;
  firstName?: string;
  email?: string | null;
  phone?: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  isVip?: boolean;
  favoriteBrands?: string[];
}

/**
 * Customer communication templates
 */
export const CUSTOMER_TEMPLATES: CommunicationTemplate[] = [
  // Thank You Messages
  {
    id: 'thank_you_first_order',
    name: 'Welcome - First Order',
    category: 'thank_you',
    subject: 'Thank you for your first order! 🎉',
    message: `Hi {{firstName}}! 👋

Thank you for your first order with us! We're thrilled to have you as a customer.

Your order is being processed and we'll make sure it reaches you in perfect condition.

If you have any questions, just reply to this message!

Welcome to the family! 🙌`,
    icon: '🎉',
  },
  {
    id: 'thank_you_repeat',
    name: 'Thank You - Repeat Customer',
    category: 'thank_you',
    subject: 'Thanks for coming back! 💙',
    message: `Hi {{firstName}}! 👋

Thank you for your {{orderCount}}{{ordinalSuffix}} order with us! It means a lot that you keep coming back.

Your loyalty doesn't go unnoticed - we truly appreciate you!

As always, reach out if you need anything.

Best regards! 🙏`,
    icon: '🔄',
  },
  {
    id: 'thank_you_vip',
    name: 'VIP Appreciation',
    category: 'thank_you',
    subject: '⭐ A Special Thank You to Our VIP',
    message: `Dear {{firstName}},

I wanted to personally thank you for being one of our most valued VIP customers!

With {{orderCount}} orders, you've been an amazing supporter of our business. Your loyalty means everything to us.

As a VIP, you always get priority service. If you ever need anything - special items, quick responses, or anything else - I'm here for you.

Thank you for being part of our journey! ⭐

With gratitude,
The Team`,
    icon: '⭐',
  },

  // Order Updates
  {
    id: 'order_shipped',
    name: 'Order Shipped',
    category: 'order_update',
    subject: '📦 Your order is on its way!',
    message: `Hi {{firstName}}! 📦

Great news! Your order has been shipped and is on its way to you.

You can track your delivery and we'll update you once it's out for delivery.

Thanks for shopping with us! 🙏`,
    icon: '📦',
  },
  {
    id: 'order_delivered',
    name: 'Order Delivered',
    category: 'order_update',
    subject: '✅ Your order has been delivered!',
    message: `Hi {{firstName}}! ✅

Your order has been delivered! We hope everything arrived in perfect condition.

If you're happy with your purchase, we'd love to hear from you. And if there's anything not quite right, please let us know so we can make it right.

Thank you for shopping with us! 🙌`,
    icon: '✅',
  },

  // Feedback Requests
  {
    id: 'feedback_request',
    name: 'Request Feedback',
    category: 'feedback',
    subject: 'How was your experience? 🤔',
    message: `Hi {{firstName}}! 👋

How's your recent purchase working out? We'd love to hear your thoughts!

Your feedback helps us improve and serve you better. Just reply with your thoughts - good or bad, we're all ears!

Thanks for being a valued customer! 🙏`,
    icon: '💬',
  },
  {
    id: 'review_request',
    name: 'Request Review',
    category: 'feedback',
    subject: 'Would you leave us a review? ⭐',
    message: `Hi {{firstName}}!

If you're enjoying your purchase, would you consider leaving us a quick review? It really helps other customers find us and keeps our small business growing.

No pressure at all - we appreciate you either way!

Thank you for your support! 🙏`,
    icon: '⭐',
  },

  // Re-engagement
  {
    id: 'we_miss_you',
    name: 'We Miss You',
    category: 'reactivation',
    subject: 'We miss you! 👋',
    message: `Hi {{firstName}}! 👋

It's been a while since your last visit, and we wanted to check in. We miss having you around!

Is there anything we can help you with? Or maybe there's something you've been looking for?

We're always here if you need us. Hope to see you again soon! 💙`,
    icon: '💔',
  },
  {
    id: 'special_offer',
    name: 'Special Customer Offer',
    category: 'promotion',
    subject: '🎁 A Special Offer Just for You',
    message: `Hi {{firstName}}! 🎁

As a valued customer, we wanted to share something special with you!

Reply to this message and I'll share an exclusive offer just for you.

Looking forward to hearing from you! 🙌`,
    icon: '🎁',
  },

  // Custom
  {
    id: 'custom',
    name: 'Custom Message',
    category: 'custom',
    subject: '',
    message: '',
    icon: '✏️',
  },
];

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

/**
 * Render a template with customer data
 */
export function renderCustomerTemplate(
  template: CommunicationTemplate,
  customer: CustomerInfo
): { subject?: string; message: string } {
  const firstName = customer.firstName || customer.name.split(' ')[0];
  const brandMention = customer.favoriteBrands?.[0] || 'your favorites';

  const variables: Record<string, string> = {
    name: customer.name,
    firstName: firstName,
    orderCount: String(customer.totalOrders),
    ordinalSuffix: getOrdinalSuffix(customer.totalOrders),
    totalSpent: formatCurrency(customer.totalSpent),
    favoriteBrand: brandMention,
    lastOrderDate: customer.lastOrderDate
      ? new Date(customer.lastOrderDate).toLocaleDateString('en-AE', {
          day: 'numeric',
          month: 'short',
        })
      : 'recently',
  };

  let message = template.message;
  let subject = template.subject || '';

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    message = message.replace(placeholder, value);
    subject = subject.replace(placeholder, value);
  }

  return { subject: subject || undefined, message };
}

/**
 * Format currency for display
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Generate WhatsApp link with pre-filled message
 */
export function generateWhatsAppLink(phoneNumber: string, message: string): string {
  // Clean phone number - remove spaces, dashes, parentheses
  let cleaned = phoneNumber.replace(/[\s\-()]/g, '');

  // Handle UAE numbers that might not have country code
  if (cleaned.startsWith('05')) {
    cleaned = '971' + cleaned.slice(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (!cleaned.startsWith('971') && cleaned.length === 9) {
    // UAE mobile without leading 0 or country code
    cleaned = '971' + cleaned;
  }

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encodedMessage}`;
}

/**
 * Generate mailto link with pre-filled subject and body
 */
export function generateMailtoLink(email: string, subject: string, body: string): string {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: CommunicationTemplate['category']): CommunicationTemplate[] {
  return CUSTOMER_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get suggested templates for a customer based on their profile
 */
export function getSuggestedTemplates(customer: CustomerInfo): CommunicationTemplate[] {
  const templates: CommunicationTemplate[] = [];

  if (customer.totalOrders === 1) {
    // New customer - suggest first order thank you
    const firstOrder = CUSTOMER_TEMPLATES.find((t) => t.id === 'thank_you_first_order');
    if (firstOrder) templates.push(firstOrder);
  } else if (customer.isVip || customer.totalOrders >= 5) {
    // VIP customer
    const vip = CUSTOMER_TEMPLATES.find((t) => t.id === 'thank_you_vip');
    if (vip) templates.push(vip);
  } else if (customer.totalOrders >= 2) {
    // Repeat customer
    const repeat = CUSTOMER_TEMPLATES.find((t) => t.id === 'thank_you_repeat');
    if (repeat) templates.push(repeat);
  }

  // Check if inactive (no order in 60+ days)
  if (customer.lastOrderDate) {
    const daysSinceOrder = Math.floor(
      (Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceOrder > 60) {
      const missYou = CUSTOMER_TEMPLATES.find((t) => t.id === 'we_miss_you');
      if (missYou) templates.push(missYou);
    }
  }

  // Add feedback request for customers with 2+ orders
  if (customer.totalOrders >= 2) {
    const feedback = CUSTOMER_TEMPLATES.find((t) => t.id === 'feedback_request');
    if (feedback) templates.push(feedback);
  }

  return templates;
}
