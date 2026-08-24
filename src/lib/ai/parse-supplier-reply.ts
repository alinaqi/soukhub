/**
 * AI-Powered Supplier Reply Parser
 *
 * Uses Claude to understand supplier WhatsApp replies and extract:
 * - Availability status (confirmed, unavailable, alternative)
 * - Which specific orders are affected
 * - Alternative products offered
 * - Expected delivery time
 *
 * Handles English, Arabic, and mixed language replies.
 */

import Anthropic from '@anthropic-ai/sdk';

export interface OrderContext {
  order_id: string;
  supplier_order_id: string;
  marketplace_order_id: string;
  product_name: string;
  quantity: number;
}

export interface SupplierContext {
  name: string;
  phone: string;
}

export type OrderStatus = 'confirmed' | 'unavailable' | 'alternative_offered' | 'unclear';

export interface ParsedOrderStatus {
  order_id: string;
  supplier_order_id: string;
  status: OrderStatus;
  alternative_product?: string;
  expected_delivery?: string;
  notes?: string;
}

export interface SupplierReplyParsed {
  understood: boolean;
  overall_intent: 'all_confirmed' | 'all_unavailable' | 'partial' | 'alternative' | 'unclear' | 'question';
  orders: ParsedOrderStatus[];
  confidence: number;
  reasoning: string;
  requires_manual_review: boolean;
  raw_reply: string;
}

const SYSTEM_PROMPT = `You are an AI assistant that parses supplier WhatsApp replies about product availability.

Your task is to understand the supplier's response and determine the status of each order.

CONTEXT:
- Suppliers are responding to order requests for mobile phones and electronics
- Replies may be in English, Arabic, or a mix of both
- Replies are often very brief (just "yes", "ok", "موجود", etc.)

COMMON PATTERNS:

Positive (Available):
- "Yes", "OK", "Available", "Ready", "I have it", "In stock"
- "موجود" (available), "عندي" (I have), "جاهز" (ready)
- "✅", "👍", thumbs up emoji
- Numbers like "1,2,3 yes" meaning orders 1,2,3 are available

Negative (Unavailable):
- "No", "Out", "Not available", "No stock", "Finished"
- "مو موجود" (not available), "خلص" (finished), "ما عندي" (I don't have)
- "❌", "🚫"
- "Only X available" when X is less than requested

Alternative Offered:
- "No black, have white", "256 out, 128 available"
- "Can give you [different model]"
- "Have [alternative] instead"
- Mentioning different color, storage, or model

Partial:
- "First two yes, third no"
- "1 and 3 ok, 2 no"
- Selective confirmation of some items

Questions (needs clarification):
- "Which color?", "What storage?", "When do you need it?"
- Asking for more details

RESPONSE FORMAT:
Return a JSON object with:
{
  "understood": boolean,
  "overall_intent": "all_confirmed" | "all_unavailable" | "partial" | "alternative" | "unclear" | "question",
  "orders": [
    {
      "order_id": "string",
      "supplier_order_id": "string",
      "status": "confirmed" | "unavailable" | "alternative_offered" | "unclear",
      "alternative_product": "string or null",
      "expected_delivery": "string or null",
      "notes": "string or null"
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your interpretation",
  "requires_manual_review": boolean
}

CONFIDENCE GUIDELINES:
- 0.9-1.0: Clear, unambiguous response (e.g., "Yes all available")
- 0.7-0.9: Fairly clear with minor ambiguity
- 0.5-0.7: Some ambiguity, might need review
- <0.5: Very unclear, definitely needs review

Set requires_manual_review to true if confidence < 0.8 or if the response is ambiguous.`;

/**
 * Parse a supplier's reply using Claude AI
 */
export async function parseSupplierReply(
  message: string,
  orders: OrderContext[],
  supplier: SupplierContext
): Promise<SupplierReplyParsed> {
  // Check for API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set, using rule-based parsing');
    return parseWithRules(message, orders);
  }

  try {
    const client = new Anthropic({ apiKey });

    const ordersDescription = orders
      .map((o, i) => `${i + 1}. Order ${o.marketplace_order_id}: ${o.product_name} x${o.quantity}`)
      .join('\n');

    const userPrompt = `Supplier "${supplier.name}" replied to this order request:

ORDERS REQUESTED:
${ordersDescription}

SUPPLIER'S REPLY:
"${message}"

Parse this reply and determine the status of each order. Return only the JSON response.`;

    const response = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    // Extract text from response
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI');
    }

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]) as SupplierReplyParsed;
    parsed.raw_reply = message;

    // Ensure all orders are represented
    const parsedOrderIds = new Set(parsed.orders.map((o) => o.order_id));
    for (const order of orders) {
      if (!parsedOrderIds.has(order.order_id)) {
        parsed.orders.push({
          order_id: order.order_id,
          supplier_order_id: order.supplier_order_id,
          status: 'unclear',
          notes: 'Not mentioned in reply',
        });
        parsed.requires_manual_review = true;
      }
    }

    return parsed;
  } catch (error) {
    console.error('AI parsing failed, falling back to rules:', error);
    return parseWithRules(message, orders);
  }
}

/**
 * Rule-based parsing fallback when AI is not available
 */
function parseWithRules(message: string, orders: OrderContext[]): SupplierReplyParsed {
  const lowerMessage = message.toLowerCase().trim();

  // Positive patterns
  const positivePatterns = [
    /^(yes|ok|okay|available|ready|have|in stock|got it)$/i,
    /^(yes|ok)\s*(all|both)?$/i,
    /موجود/,
    /عندي/,
    /جاهز/,
    /^✅+$/,
    /^👍+$/,
  ];

  // Negative patterns
  const negativePatterns = [
    /^(no|out|unavailable|not available|no stock|finished|sold out)$/i,
    /مو\s*موجود/,
    /ما\s*عندي/,
    /خلص/,
    /^❌+$/,
    /^🚫+$/,
  ];

  // Check for clear positive
  for (const pattern of positivePatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        understood: true,
        overall_intent: 'all_confirmed',
        orders: orders.map((o) => ({
          order_id: o.order_id,
          supplier_order_id: o.supplier_order_id,
          status: 'confirmed',
        })),
        confidence: 0.85,
        reasoning: 'Clear positive response detected',
        requires_manual_review: false,
        raw_reply: message,
      };
    }
  }

  // Check for clear negative
  for (const pattern of negativePatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        understood: true,
        overall_intent: 'all_unavailable',
        orders: orders.map((o) => ({
          order_id: o.order_id,
          supplier_order_id: o.supplier_order_id,
          status: 'unavailable',
        })),
        confidence: 0.85,
        reasoning: 'Clear negative response detected',
        requires_manual_review: false,
        raw_reply: message,
      };
    }
  }

  // Check for alternative mentions
  const alternativePatterns = [
    /instead/i,
    /have\s+(\w+)\s+(not|no)\s+(\w+)/i,
    /only\s+have/i,
    /can\s+give/i,
    /بدل/,
  ];

  for (const pattern of alternativePatterns) {
    if (pattern.test(lowerMessage)) {
      return {
        understood: true,
        overall_intent: 'alternative',
        orders: orders.map((o) => ({
          order_id: o.order_id,
          supplier_order_id: o.supplier_order_id,
          status: 'alternative_offered',
          alternative_product: 'See original message',
        })),
        confidence: 0.6,
        reasoning: 'Alternative product mentioned - needs review',
        requires_manual_review: true,
        raw_reply: message,
      };
    }
  }

  // Default: unclear, needs review
  return {
    understood: false,
    overall_intent: 'unclear',
    orders: orders.map((o) => ({
      order_id: o.order_id,
      supplier_order_id: o.supplier_order_id,
      status: 'unclear',
    })),
    confidence: 0.3,
    reasoning: 'Could not determine intent from message',
    requires_manual_review: true,
    raw_reply: message,
  };
}

/**
 * Determine if we should auto-update based on parse result
 */
export function shouldAutoUpdate(parsed: SupplierReplyParsed): boolean {
  return parsed.understood && parsed.confidence >= 0.8 && !parsed.requires_manual_review;
}
