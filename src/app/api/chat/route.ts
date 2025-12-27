import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Tool definitions for the AI
const tools: Anthropic.Tool[] = [
  {
    name: 'get_order_stats',
    description: 'Get statistics about orders including counts by status, marketplace, and revenue',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'search_orders',
    description: 'Search for orders by status, marketplace, customer name, or order ID',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        status: { type: 'string', description: 'Filter by order status (pending, shipped, delivered, returned, etc.)' },
        marketplace: { type: 'string', description: 'Filter by marketplace (amazon, cartlow, revibe)' },
        search: { type: 'string', description: 'Search by customer name or order ID' },
        limit: { type: 'number', description: 'Max number of orders to return', default: 10 },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'update_order_status',
    description: 'Update the status of an order',
    input_schema: {
      type: 'object' as const,
      properties: {
        order_id: { type: 'string', description: 'The order UUID' },
        new_status: {
          type: 'string',
          description: 'The new status',
          enum: ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
        },
      },
      required: ['order_id', 'new_status'],
    },
  },
  {
    name: 'get_order_details',
    description: 'Get detailed information about a specific order',
    input_schema: {
      type: 'object' as const,
      properties: {
        order_id: { type: 'string', description: 'The order UUID or marketplace order ID' },
        user_id: { type: 'string', description: 'The user ID' },
      },
      required: ['order_id', 'user_id'],
    },
  },
  {
    name: 'get_suggestions',
    description: 'Get AI-powered suggestions based on order data',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
      },
      required: ['user_id'],
    },
  },
];

// Tool implementations
async function getOrderStats(userId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select('status, marketplace, total')
    .eq('user_id', userId);

  if (!orders) return { error: 'No orders found' };

  const stats = {
    total: orders.length,
    byStatus: {} as Record<string, number>,
    byMarketplace: {} as Record<string, { count: number; revenue: number }>,
    totalRevenue: 0,
    pendingCount: 0,
    returnedCount: 0,
  };

  orders.forEach((order) => {
    // By status
    stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;

    // By marketplace
    if (!stats.byMarketplace[order.marketplace]) {
      stats.byMarketplace[order.marketplace] = { count: 0, revenue: 0 };
    }
    stats.byMarketplace[order.marketplace].count++;
    stats.byMarketplace[order.marketplace].revenue += order.total || 0;

    // Totals
    if (order.status === 'delivered') {
      stats.totalRevenue += order.total || 0;
    }
    if (['pending', 'confirmed', 'processing'].includes(order.status)) {
      stats.pendingCount++;
    }
    if (['returned', 'refunded'].includes(order.status)) {
      stats.returnedCount++;
    }
  });

  return stats;
}

async function searchOrders(userId: string, status?: string, marketplace?: string, search?: string, limit = 10) {
  let query = supabase
    .from('orders')
    .select('id, marketplace_order_id, marketplace, status, customer_name, total, order_date')
    .eq('user_id', userId)
    .order('order_date', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);
  if (marketplace) query = query.eq('marketplace', marketplace);
  if (search) {
    query = query.or(`marketplace_order_id.ilike.%${search}%,customer_name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { orders: data, count: data?.length || 0 };
}

async function updateOrderStatus(orderId: string, newStatus: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .select('id, marketplace_order_id, status')
    .single();

  if (error) return { error: error.message };
  return { success: true, order: data };
}

async function getOrderDetails(orderId: string, userId: string) {
  // Try UUID first, then marketplace_order_id
  let { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .or(`id.eq.${orderId},marketplace_order_id.ilike.%${orderId}%`)
    .limit(1)
    .single();

  if (error) return { error: 'Order not found' };
  return { order: data };
}

async function getSuggestions(userId: string) {
  const stats = await getOrderStats(userId);
  if ('error' in stats) return stats;

  const suggestions = [];

  // Pending orders suggestion
  if (stats.pendingCount > 10) {
    suggestions.push({
      type: 'action',
      priority: 'high',
      title: `${stats.pendingCount} orders need attention`,
      description: 'You have pending orders that should be processed. Would you like me to show them?',
      action: 'show_pending_orders',
    });
  }

  // Return rate analysis
  const returnRate = (stats.returnedCount / stats.total) * 100;
  if (returnRate > 5) {
    suggestions.push({
      type: 'warning',
      priority: 'medium',
      title: `Return rate is ${returnRate.toFixed(1)}%`,
      description: 'Consider reviewing product quality or descriptions to reduce returns.',
    });
  }

  // Marketplace performance
  const marketplaces = Object.entries(stats.byMarketplace);
  if (marketplaces.length > 0) {
    const top = marketplaces.sort((a, b) => b[1].revenue - a[1].revenue)[0];
    suggestions.push({
      type: 'insight',
      priority: 'low',
      title: `${top[0]} is your top performer`,
      description: `${top[0]} generated AED ${top[1].revenue.toLocaleString()} from ${top[1].count} orders.`,
    });
  }

  // Low activity suggestion
  if (stats.total < 100) {
    suggestions.push({
      type: 'tip',
      priority: 'low',
      title: 'Import more orders',
      description: 'Import orders from your marketplaces to get better insights and analytics.',
    });
  }

  return { suggestions, stats };
}

// Process tool calls
async function processToolCall(name: string, input: Record<string, unknown>) {
  switch (name) {
    case 'get_order_stats':
      return await getOrderStats(input.user_id as string);
    case 'search_orders':
      return await searchOrders(
        input.user_id as string,
        input.status as string | undefined,
        input.marketplace as string | undefined,
        input.search as string | undefined,
        input.limit as number | undefined
      );
    case 'update_order_status':
      return await updateOrderStatus(input.order_id as string, input.new_status as string);
    case 'get_order_details':
      return await getOrderDetails(input.order_id as string, input.user_id as string);
    case 'get_suggestions':
      return await getSuggestions(input.user_id as string);
    default:
      return { error: 'Unknown tool' };
  }
}

const SYSTEM_PROMPT = `You are SoukHub AI, an intelligent assistant for multi-channel marketplace sellers in the UAE and Middle East. You help sellers manage their orders across Amazon, Cartlow, and Revibe marketplaces.

Your capabilities:
1. **Order Management**: Search orders, view details, and update order statuses (mark as shipped, delivered, process refunds, etc.)
2. **Analytics**: Provide insights about sales performance, return rates, and marketplace comparisons
3. **Suggestions**: Proactively suggest actions to improve business operations

Key behaviors:
- Be concise and actionable in your responses
- When showing orders, format them as a clear list with key details
- When updating order status, confirm the action was successful
- Proactively suggest what the user might want to do next
- Use AED as the default currency
- Be helpful with refund processing - guide users through status changes

Status flow for orders:
- pending → confirmed → processing → ready_to_ship → shipped → out_for_delivery → delivered
- Orders can also be: cancelled, returned, refunded

When the user first messages you, introduce yourself briefly and ask how you can help. If appropriate, fetch their order stats to provide context.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Add user_id context to the conversation
    const systemWithContext = `${SYSTEM_PROMPT}\n\nCurrent user ID: ${userId}. Always use this user_id when calling tools.`;

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemWithContext,
      tools,
      messages,
    });

    // Process tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await processToolCall(toolUse.name, toolUse.input as Record<string, unknown>);
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Continue the conversation with tool results
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemWithContext,
        tools,
        messages: [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ],
      });
    }

    // Extract text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    return NextResponse.json({
      response: textBlock?.text || 'No response generated',
      usage: response.usage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
