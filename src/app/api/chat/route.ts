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
    name: 'get_inventory_stats',
    description: 'Get inventory statistics including total SKUs, units, low stock alerts, and out of stock items',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'search_inventory',
    description: 'Search inventory by SKU, product name, or filter by stock status (low_stock, out_of_stock, in_stock)',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        search: { type: 'string', description: 'Search by SKU or product name' },
        status: { type: 'string', description: 'Filter by stock status: low_stock, out_of_stock, in_stock' },
        limit: { type: 'number', description: 'Max number of items to return', default: 10 },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'update_inventory',
    description: 'Update inventory quantity for a product variant by SKU',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        sku: { type: 'string', description: 'The product SKU' },
        adjustment_type: { type: 'string', description: 'Type of adjustment: add, remove, or set', enum: ['add', 'remove', 'set'] },
        quantity: { type: 'number', description: 'The quantity to add, remove, or set to' },
        reason: { type: 'string', description: 'Reason for the adjustment' },
      },
      required: ['user_id', 'sku', 'adjustment_type', 'quantity'],
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

async function getInventoryStats(userId: string) {
  const { data: inventory } = await supabase
    .from('inventory')
    .select(`
      quantity,
      reserved,
      reorder_point,
      product_variants!inner (
        sku,
        products!inner (
          user_id
        )
      )
    `)
    .eq('product_variants.products.user_id', userId);

  if (!inventory) return { error: 'No inventory found' };

  const stats = {
    totalSKUs: inventory.length,
    totalUnits: inventory.reduce((sum, i) => sum + i.quantity, 0),
    totalReserved: inventory.reduce((sum, i) => sum + i.reserved, 0),
    lowStockCount: 0,
    outOfStockCount: 0,
    lowStockItems: [] as Array<{ sku: string; available: number; reorderPoint: number }>,
    outOfStockItems: [] as Array<{ sku: string }>,
  };

  inventory.forEach((item) => {
    const available = item.quantity - item.reserved;
    const variant = item.product_variants as unknown as { sku: string };

    if (available <= 0) {
      stats.outOfStockCount++;
      stats.outOfStockItems.push({ sku: variant.sku });
    } else if (available <= item.reorder_point) {
      stats.lowStockCount++;
      stats.lowStockItems.push({
        sku: variant.sku,
        available,
        reorderPoint: item.reorder_point,
      });
    }
  });

  // Limit the arrays to top 10
  stats.lowStockItems = stats.lowStockItems.slice(0, 10);
  stats.outOfStockItems = stats.outOfStockItems.slice(0, 10);

  return stats;
}

async function searchInventory(userId: string, search?: string, status?: string, limit = 10) {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      id,
      quantity,
      reserved,
      reorder_point,
      warehouse_location,
      product_variants!inner (
        sku,
        name,
        color,
        storage,
        condition,
        products!inner (
          name,
          brand,
          user_id
        )
      )
    `)
    .eq('product_variants.products.user_id', userId)
    .limit(50);

  if (error) return { error: error.message };
  if (!data) return { items: [], count: 0 };

  let filtered = data.map(item => {
    const variant = item.product_variants as unknown as {
      sku: string;
      name: string | null;
      color: string | null;
      storage: string | null;
      condition: string;
      products: { name: string; brand: string | null };
    };
    const available = item.quantity - item.reserved;

    return {
      id: item.id,
      sku: variant.sku,
      productName: variant.products.name,
      brand: variant.products.brand,
      variant: [variant.color, variant.storage, variant.condition].filter(Boolean).join(' / '),
      available,
      reserved: item.reserved,
      total: item.quantity,
      reorderPoint: item.reorder_point,
      location: item.warehouse_location,
      status: available <= 0 ? 'out_of_stock' : available <= item.reorder_point ? 'low_stock' : 'in_stock',
    };
  });

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(item =>
      item.sku.toLowerCase().includes(searchLower) ||
      item.productName.toLowerCase().includes(searchLower) ||
      item.brand?.toLowerCase().includes(searchLower)
    );
  }

  // Apply status filter
  if (status) {
    filtered = filtered.filter(item => item.status === status);
  }

  return { items: filtered.slice(0, limit), count: filtered.length };
}

async function updateInventory(
  userId: string,
  sku: string,
  adjustmentType: 'add' | 'remove' | 'set',
  quantity: number,
  reason?: string
) {
  // Find the inventory item by SKU
  const { data: inventoryItem, error: findError } = await supabase
    .from('inventory')
    .select(`
      id,
      quantity,
      variant_id,
      product_variants!inner (
        sku,
        products!inner (
          user_id
        )
      )
    `)
    .eq('product_variants.sku', sku)
    .eq('product_variants.products.user_id', userId)
    .single();

  if (findError || !inventoryItem) {
    return { error: `SKU "${sku}" not found in inventory` };
  }

  const currentQty = inventoryItem.quantity;
  let newQty = currentQty;

  if (adjustmentType === 'add') {
    newQty = currentQty + quantity;
  } else if (adjustmentType === 'remove') {
    newQty = Math.max(0, currentQty - quantity);
  } else {
    newQty = quantity;
  }

  const { error: updateError } = await supabase
    .from('inventory')
    .update({ quantity: newQty })
    .eq('id', inventoryItem.id);

  if (updateError) {
    return { error: updateError.message };
  }

  // Log the activity
  await supabase.from('activity_log').insert({
    user_id: userId,
    activity_type: 'inventory_updated',
    title: `Stock ${adjustmentType}: ${sku}`,
    description: reason || `${adjustmentType} ${quantity} units via AI assistant`,
    metadata: {
      sku,
      previous_qty: currentQty,
      new_qty: newQty,
      adjustment_type: adjustmentType,
      adjustment_qty: quantity,
    },
  } as never);

  return {
    success: true,
    sku,
    previousQuantity: currentQty,
    newQuantity: newQty,
    adjustmentType,
    adjustmentQuantity: quantity,
  };
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
    case 'get_inventory_stats':
      return await getInventoryStats(input.user_id as string);
    case 'search_inventory':
      return await searchInventory(
        input.user_id as string,
        input.search as string | undefined,
        input.status as string | undefined,
        input.limit as number | undefined
      );
    case 'update_inventory':
      return await updateInventory(
        input.user_id as string,
        input.sku as string,
        input.adjustment_type as 'add' | 'remove' | 'set',
        input.quantity as number,
        input.reason as string | undefined
      );
    default:
      return { error: 'Unknown tool' };
  }
}

interface ActionButton {
  id: string;
  label: string;
  type: 'update_order' | 'bulk_update' | 'navigate';
  data: Record<string, unknown>;
}

const SYSTEM_PROMPT = `You are SoukHub AI, an intelligent assistant for multi-channel marketplace sellers in the UAE and Middle East. You help sellers manage their orders and inventory across Amazon, Cartlow, and Revibe marketplaces.

Your capabilities:
1. **Order Management**: Search orders, view details, and update order statuses (mark as shipped, delivered, process refunds, etc.)
2. **Inventory Management**: Check stock levels, find low stock items, adjust inventory quantities
3. **Analytics**: Provide insights about sales performance, return rates, and marketplace comparisons
4. **Suggestions**: Proactively suggest actions to improve business operations

Key behaviors:
- Be concise and actionable in your responses
- Format responses using markdown for better readability (use **bold**, bullet points, etc.)
- When showing orders, format them as a markdown table or list with key details
- When showing inventory, include SKU, product name, available quantity, and status
- When updating order status or inventory, confirm the action was successful
- Proactively suggest what the user might want to do next
- Use AED as the default currency
- Be helpful with refund processing - guide users through status changes
- When listing orders or inventory items that need action, always include IDs/SKUs so users can take action

Status flow for orders:
- pending → confirmed → processing → ready_to_ship → shipped → out_for_delivery → delivered
- Orders can also be: cancelled, returned, refunded

Inventory status:
- in_stock: Available quantity > reorder point
- low_stock: Available quantity > 0 but <= reorder point
- out_of_stock: Available quantity <= 0

When the user first messages you, introduce yourself briefly and ask how you can help. If appropriate, fetch their order stats to provide context.`;

// Generate action buttons based on the response and context
function generateActions(
  responseText: string,
  toolResults: Array<{ name: string; result: Record<string, unknown> }>
): ActionButton[] {
  const actions: ActionButton[] = [];

  for (const { name, result } of toolResults) {
    if (name === 'search_orders' && 'orders' in result) {
      const orders = result.orders as Array<{ id: string; status: string; marketplace_order_id: string }>;

      if (orders.length > 0) {
        // Check for pending orders that can be marked as shipped
        const pendingOrders = orders.filter(o => ['pending', 'confirmed', 'processing', 'ready_to_ship'].includes(o.status));
        if (pendingOrders.length > 0) {
          actions.push({
            id: 'bulk-ship-' + Date.now(),
            label: `Mark ${pendingOrders.length} as Shipped`,
            type: 'bulk_update',
            data: {
              orderIds: pendingOrders.map(o => o.id),
              updates: { status: 'shipped' },
            },
          });
        }

        // Check for shipped orders that can be delivered
        const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'out_for_delivery');
        if (shippedOrders.length > 0) {
          actions.push({
            id: 'bulk-deliver-' + Date.now(),
            label: `Mark ${shippedOrders.length} as Delivered`,
            type: 'bulk_update',
            data: {
              orderIds: shippedOrders.map(o => o.id),
              updates: { status: 'delivered' },
            },
          });
        }

        // Check for orders that might need refund
        const deliveredOrders = orders.filter(o => o.status === 'delivered');
        if (deliveredOrders.length > 0 && responseText.toLowerCase().includes('refund')) {
          actions.push({
            id: 'bulk-refund-' + Date.now(),
            label: `Refund ${deliveredOrders.length} Orders`,
            type: 'bulk_update',
            data: {
              orderIds: deliveredOrders.map(o => o.id),
              updates: { status: 'refunded' },
            },
          });
        }
      }
    }

    if (name === 'get_order_details' && 'order' in result) {
      const order = result.order as { id: string; status: string };
      const status = order.status;

      // Add contextual action for single order
      if (['pending', 'confirmed', 'processing', 'ready_to_ship'].includes(status)) {
        actions.push({
          id: 'ship-' + order.id,
          label: 'Mark as Shipped',
          type: 'update_order',
          data: { orderId: order.id, updates: { status: 'shipped' } },
        });
      }
      if (status === 'shipped' || status === 'out_for_delivery') {
        actions.push({
          id: 'deliver-' + order.id,
          label: 'Mark as Delivered',
          type: 'update_order',
          data: { orderId: order.id, updates: { status: 'delivered' } },
        });
      }
      if (status === 'delivered') {
        actions.push({
          id: 'refund-' + order.id,
          label: 'Process Refund',
          type: 'update_order',
          data: { orderId: order.id, updates: { status: 'refunded' } },
        });
        actions.push({
          id: 'return-' + order.id,
          label: 'Process Return',
          type: 'update_order',
          data: { orderId: order.id, updates: { status: 'returned' } },
        });
      }
      if (!['cancelled', 'returned', 'refunded'].includes(status)) {
        actions.push({
          id: 'cancel-' + order.id,
          label: 'Cancel Order',
          type: 'update_order',
          data: { orderId: order.id, updates: { status: 'cancelled' } },
        });
      }
    }
  }

  // Navigation actions
  if (responseText.toLowerCase().includes('import') || responseText.toLowerCase().includes('add more orders')) {
    actions.push({
      id: 'nav-import',
      label: 'Import Orders',
      type: 'navigate',
      data: { url: '/import' },
    });
  }

  return actions.slice(0, 6); // Limit to 6 actions max
}

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

    // Track all tool results for generating actions
    const allToolResults: Array<{ name: string; result: Record<string, unknown> }> = [];

    // Process tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await processToolCall(toolUse.name, toolUse.input as Record<string, unknown>);

          // Track for action generation
          allToolResults.push({ name: toolUse.name, result: result as Record<string, unknown> });

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

    const responseText = textBlock?.text || 'No response generated';

    // Generate action buttons based on the response and tool results
    const actions = generateActions(responseText, allToolResults);

    return NextResponse.json({
      response: responseText,
      actions,
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
