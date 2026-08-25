import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Created lazily so this module can be evaluated at build time without env vars
let _supabase: SupabaseClient | undefined;
const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    _supabase ??= createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    return Reflect.get(_supabase, prop, _supabase);
  },
});

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
  {
    name: 'populate_inventory_from_orders',
    description: 'Analyze orders to extract products being sold and populate inventory. Returns a preview of products found with sales data. Use dry_run=true to preview without creating, dry_run=false to actually create products and inventory.',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        dry_run: { type: 'boolean', description: 'If true, just preview products without creating. If false, create products and inventory entries.', default: true },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'get_product_sales_analytics',
    description: 'Analyze product sales data from order items. Returns top-selling products, revenue by product, quantity sold, and sales trends. Use this to answer questions like "which product has most sales", "top selling products", "best performing items".',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        limit: { type: 'number', description: 'Number of top products to return', default: 10 },
        date_from: { type: 'string', description: 'Start date filter (YYYY-MM-DD format)' },
        date_to: { type: 'string', description: 'End date filter (YYYY-MM-DD format)' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'query_orders_data',
    description: 'Execute a custom query on orders data. Use this for complex analytics questions that other tools cannot answer. Returns aggregated order and order item data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        query_type: {
          type: 'string',
          description: 'Type of query to run',
          enum: ['sales_by_date', 'sales_by_marketplace', 'customer_order_frequency', 'product_performance', 'revenue_trends'],
        },
        date_from: { type: 'string', description: 'Start date filter (YYYY-MM-DD format)' },
        date_to: { type: 'string', description: 'End date filter (YYYY-MM-DD format)' },
        group_by: { type: 'string', description: 'Group results by: day, week, month', enum: ['day', 'week', 'month'] },
      },
      required: ['user_id', 'query_type'],
    },
  },
  {
    name: 'route_orders_to_supplier',
    description: 'Route orders to their designated suppliers based on brand/product rules. This creates supplier orders and prepares them for WhatsApp messaging. Use this when user wants to "forward to supplier", "send to supplier", "route orders", etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        order_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of order IDs to route to suppliers',
        },
      },
      required: ['user_id', 'order_ids'],
    },
  },
  {
    name: 'get_unrouted_orders',
    description: 'Get orders that have not been routed to a supplier yet. These are pending/confirmed/processing orders without a supplier assignment.',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
      },
      required: ['user_id'],
    },
  },
  {
    name: 'send_whatsapp_to_supplier',
    description: 'Generate and send WhatsApp messages to suppliers for routed orders. Returns WhatsApp links that can be clicked to open WhatsApp with the pre-filled message. Use this after routing orders to actually notify suppliers.',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        supplier_order_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of supplier order IDs to send messages for',
        },
      },
      required: ['user_id', 'supplier_order_ids'],
    },
  },
  {
    name: 'mark_orders_for_packing',
    description: 'Mark orders as ready for packing by updating their status to "processing" or "ready_to_ship". Use this when user wants to prepare orders for the packing station.',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        order_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of order IDs to mark for packing',
        },
        target_status: {
          type: 'string',
          enum: ['processing', 'ready_to_ship'],
          description: 'Target status - use "processing" for orders that need to be packed, "ready_to_ship" for orders already packed',
        },
      },
      required: ['user_id', 'order_ids', 'target_status'],
    },
  },
  {
    name: 'bulk_update_order_status',
    description: 'Update the status of multiple orders at once. Useful for batch operations like marking all pending orders as confirmed, or all packed orders as shipped.',
    input_schema: {
      type: 'object' as const,
      properties: {
        user_id: { type: 'string', description: 'The user ID' },
        order_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of order IDs to update',
        },
        new_status: {
          type: 'string',
          enum: ['pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned', 'refunded'],
          description: 'The new status to apply to all orders',
        },
      },
      required: ['user_id', 'order_ids', 'new_status'],
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
  const { data, error } = await supabase
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

// Product field patterns for extraction from raw order data
const PRODUCT_FIELD_PATTERNS = {
  name: ['product', 'item', 'title', 'name', 'description', 'product_name', 'item_name', 'product-name'],
  sku: ['sku', 'asin', 'product_id', 'item_id', 'article', 'barcode', 'upc', 'ean', 'product-id', 'seller-sku'],
  brand: ['brand', 'manufacturer', 'maker', 'vendor'],
  category: ['category', 'type', 'department', 'classification', 'product_type', 'product-type'],
  price: ['price', 'amount', 'cost', 'total', 'unit_price', 'item_price', 'selling_price', 'item-price'],
  quantity: ['quantity', 'qty', 'units', 'count', 'quantity-purchased'],
  condition: ['condition', 'quality', 'grade', 'state'],
};

function findFieldValue(rawData: Record<string, unknown>, patterns: string[]): string | null {
  if (!rawData) return null;
  for (const key of Object.keys(rawData)) {
    const keyLower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    for (const pattern of patterns) {
      const patternLower = pattern.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (keyLower.includes(patternLower) || patternLower.includes(keyLower)) {
        const value = rawData[key];
        if (value !== null && value !== undefined && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
    }
  }
  return null;
}

function parseNumber(value: string | number | null): number {
  if (value === null) return 0;
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  return parseFloat(cleaned) || 0;
}

async function populateInventoryFromOrders(userId: string, dryRun = true) {
  // Fetch all orders with raw_data
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('id, marketplace, total, order_date, raw_data, status')
    .eq('user_id', userId)
    .not('status', 'eq', 'cancelled');

  if (ordersError) {
    return { error: ordersError.message };
  }

  if (!orders || orders.length === 0) {
    return {
      error: 'No orders found. Import some orders first.',
      products: [],
      stats: { totalOrders: 0, uniqueProducts: 0 },
    };
  }

  interface ExtractedProduct {
    name: string;
    sku: string | null;
    brand: string | null;
    category: string | null;
    price: number;
    condition: string;
    unitsSold: number;
    revenue: number;
    marketplaces: string[];
  }

  const productMap = new Map<string, ExtractedProduct>();

  for (const order of orders) {
    const rawData = order.raw_data as Record<string, unknown> | null;

    let productName = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.name);
    const sku = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.sku);
    const brand = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.brand);
    const category = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.category);
    const priceStr = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.price);
    const quantityStr = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.quantity);
    const conditionStr = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.condition);

    if (!productName) {
      if (sku) {
        productName = `Product ${sku}`;
      } else if (brand) {
        productName = `${brand} Product`;
      } else {
        continue;
      }
    }

    const price = priceStr ? parseNumber(priceStr) : order.total;
    const quantity = quantityStr ? parseNumber(quantityStr) : 1;
    const condition = conditionStr?.toLowerCase().includes('new') ? 'new' : 'used';
    const productKey = sku || productName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    if (productMap.has(productKey)) {
      const existing = productMap.get(productKey)!;
      existing.unitsSold += quantity;
      existing.revenue += price * quantity;
      if (!existing.marketplaces.includes(order.marketplace)) {
        existing.marketplaces.push(order.marketplace);
      }
    } else {
      productMap.set(productKey, {
        name: productName,
        sku,
        brand,
        category,
        price,
        condition,
        unitsSold: quantity,
        revenue: price * quantity,
        marketplaces: [order.marketplace],
      });
    }
  }

  const extractedProducts = Array.from(productMap.values())
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 20); // Limit for chat response

  const stats = {
    totalOrders: orders.length,
    uniqueProducts: productMap.size,
    totalUnitsSold: Array.from(productMap.values()).reduce((sum, p) => sum + p.unitsSold, 0),
    totalRevenue: Array.from(productMap.values()).reduce((sum, p) => sum + p.revenue, 0),
  };

  if (dryRun) {
    return {
      preview: true,
      products: extractedProducts,
      stats,
      message: `Found ${stats.uniqueProducts} unique products from ${stats.totalOrders} orders. Total units sold: ${stats.totalUnitsSold}. Say "create these products" to add them to inventory.`,
    };
  }

  // Create products and inventory
  let created = 0;
  let skipped = 0;

  for (const product of extractedProducts) {
    try {
      // Check if product already exists
      if (product.sku) {
        const { data: existingVariant } = await supabase
          .from('product_variants')
          .select('id')
          .eq('sku', product.sku)
          .single();

        if (existingVariant) {
          skipped++;
          continue;
        }
      }

      // Create product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert({
          user_id: userId,
          name: product.name,
          brand: product.brand,
          category: product.category,
          base_price: product.price,
          is_active: true,
        } as never)
        .select('id')
        .single();

      if (productError || !newProduct) {
        continue;
      }

      const productData = newProduct as { id: string };

      // Create variant
      const { data: newVariant, error: variantError } = await supabase
        .from('product_variants')
        .insert({
          product_id: productData.id,
          sku: product.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: product.name,
          condition: product.condition,
          price: product.price,
          is_active: true,
        } as never)
        .select('id')
        .single();

      if (variantError || !newVariant) {
        continue;
      }

      const variantData = newVariant as { id: string };

      // Create inventory entry
      await supabase.from('inventory').insert({
        variant_id: variantData.id,
        quantity: 0,
        reserved: 0,
        reorder_point: Math.max(5, Math.ceil(product.unitsSold * 0.5)),
      } as never);

      created++;
    } catch {
      continue;
    }
  }

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: userId,
    activity_type: 'inventory_updated',
    title: 'Inventory populated from orders via AI',
    description: `Created ${created} products from ${orders.length} orders analysis`,
    metadata: { created, skipped },
  } as never);

  return {
    success: true,
    created,
    skipped,
    stats,
    message: `Created ${created} new products and inventory entries. ${skipped} products were skipped (already exist).`,
  };
}

// Get product sales analytics from order items
async function getProductSalesAnalytics(
  userId: string,
  limit: number = 10,
  dateFrom?: string,
  dateTo?: string
) {
  // Build the query for orders with order_items
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_date,
      total,
      marketplace,
      order_items (
        product_name,
        quantity,
        unit_price
      )
    `)
    .eq('user_id', userId);

  if (dateFrom) {
    query = query.gte('order_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('order_date', dateTo);
  }

  const { data: orders, error } = await query;

  if (error || !orders) {
    return { error: 'Failed to fetch order data' };
  }

  // Aggregate product sales data
  const productMap = new Map<string, {
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
  }>();

  for (const order of orders) {
    const items = (order as { order_items?: Array<{ product_name: string; quantity: number; unit_price: number }> }).order_items || [];
    for (const item of items) {
      const key = item.product_name?.toLowerCase().trim() || 'unknown';
      const existing = productMap.get(key) || {
        name: item.product_name || 'Unknown',
        totalQuantity: 0,
        totalRevenue: 0,
        orderCount: 0,
      };
      existing.totalQuantity += item.quantity || 1;
      existing.totalRevenue += (item.unit_price || 0) * (item.quantity || 1);
      existing.orderCount += 1;
      productMap.set(key, existing);
    }
  }

  // Convert to sorted array
  const products = Array.from(productMap.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);

  const totalProducts = productMap.size;
  const totalRevenue = products.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalUnits = products.reduce((sum, p) => sum + p.totalQuantity, 0);

  return {
    success: true,
    summary: {
      totalProducts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalUnits,
      ordersAnalyzed: orders.length,
    },
    topProducts: products.map((p, index) => ({
      rank: index + 1,
      name: p.name,
      unitsSold: p.totalQuantity,
      revenue: Math.round(p.totalRevenue * 100) / 100,
      orders: p.orderCount,
    })),
  };
}

// Query orders data with various analytics
async function queryOrdersData(
  userId: string,
  queryType: string,
  dateFrom?: string,
  dateTo?: string,
  groupBy?: string
) {
  let query = supabase
    .from('orders')
    .select(`
      id,
      order_date,
      total,
      marketplace,
      status,
      customer_name,
      order_items (
        product_name,
        quantity,
        unit_price
      )
    `)
    .eq('user_id', userId);

  if (dateFrom) {
    query = query.gte('order_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('order_date', dateTo);
  }

  const { data: orders, error } = await query;

  if (error || !orders) {
    return { error: 'Failed to fetch order data' };
  }

  switch (queryType) {
    case 'sales_by_date': {
      const salesByDate = new Map<string, { orders: number; revenue: number }>();
      for (const order of orders) {
        const date = new Date(order.order_date).toISOString().split('T')[0];
        const existing = salesByDate.get(date) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += order.total || 0;
        salesByDate.set(date, existing);
      }
      return {
        success: true,
        data: Array.from(salesByDate.entries())
          .map(([date, stats]) => ({ date, ...stats }))
          .sort((a, b) => b.date.localeCompare(a.date)),
      };
    }

    case 'sales_by_marketplace': {
      const salesByMarketplace = new Map<string, { orders: number; revenue: number }>();
      for (const order of orders) {
        const marketplace = order.marketplace || 'unknown';
        const existing = salesByMarketplace.get(marketplace) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += order.total || 0;
        salesByMarketplace.set(marketplace, existing);
      }
      return {
        success: true,
        data: Array.from(salesByMarketplace.entries())
          .map(([marketplace, stats]) => ({ marketplace, ...stats }))
          .sort((a, b) => b.revenue - a.revenue),
      };
    }

    case 'customer_order_frequency': {
      const customerOrders = new Map<string, number>();
      for (const order of orders) {
        const customer = order.customer_name || 'unknown';
        customerOrders.set(customer, (customerOrders.get(customer) || 0) + 1);
      }
      const sortedCustomers = Array.from(customerOrders.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20);
      return {
        success: true,
        data: sortedCustomers.map(([name, orderCount]) => ({ customer: name, orders: orderCount })),
      };
    }

    case 'product_performance': {
      const productStats = new Map<string, { units: number; revenue: number; orders: number }>();
      for (const order of orders) {
        const items = (order as { order_items?: Array<{ product_name: string; quantity: number; unit_price: number }> }).order_items || [];
        for (const item of items) {
          const name = item.product_name || 'unknown';
          const existing = productStats.get(name) || { units: 0, revenue: 0, orders: 0 };
          existing.units += item.quantity || 1;
          existing.revenue += (item.unit_price || 0) * (item.quantity || 1);
          existing.orders += 1;
          productStats.set(name, existing);
        }
      }
      return {
        success: true,
        data: Array.from(productStats.entries())
          .map(([name, stats]) => ({ product: name, ...stats }))
          .sort((a, b) => b.units - a.units)
          .slice(0, 20),
      };
    }

    case 'revenue_trends': {
      const revenueByPeriod = new Map<string, number>();
      for (const order of orders) {
        const date = new Date(order.order_date);
        let period: string;
        if (groupBy === 'month') {
          period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        } else if (groupBy === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split('T')[0];
        } else {
          period = date.toISOString().split('T')[0];
        }
        revenueByPeriod.set(period, (revenueByPeriod.get(period) || 0) + (order.total || 0));
      }
      return {
        success: true,
        data: Array.from(revenueByPeriod.entries())
          .map(([period, revenue]) => ({ period, revenue: Math.round(revenue * 100) / 100 }))
          .sort((a, b) => a.period.localeCompare(b.period)),
      };
    }

    default:
      return { error: 'Unknown query type' };
  }
}

// Route orders to suppliers
async function routeOrdersToSupplier(userId: string, orderIds: string[]) {
  if (!orderIds || orderIds.length === 0) {
    return { error: 'No order IDs provided' };
  }

  const results = [];
  const supplierOrderIds: string[] = [];

  for (const orderId of orderIds) {
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
      results.push({
        order_id: orderId,
        routed: false,
        reason: 'Order not found',
      });
      continue;
    }

    // Skip if already routed
    if (order.supplier_order_id) {
      results.push({
        order_id: orderId,
        marketplace_order_id: order.marketplace_order_id,
        routed: false,
        reason: 'Already routed to supplier',
        supplier_order_id: order.supplier_order_id,
      });
      supplierOrderIds.push(order.supplier_order_id);
      continue;
    }

    // Try to find a matching supplier based on brand rules
    const orderItems = order.order_items || [];
    if (orderItems.length === 0) {
      results.push({
        order_id: orderId,
        marketplace_order_id: order.marketplace_order_id,
        routed: false,
        reason: 'Order has no items',
      });
      continue;
    }

    // Extract brand from product name
    const productName = orderItems[0]?.product_name || '';
    const brandPatterns: Record<string, string> = {
      'iphone': 'Apple', 'macbook': 'Apple', 'airpods': 'Apple',
      'galaxy': 'Samsung', 'samsung': 'Samsung',
      'pixel': 'Google', 'google': 'Google',
      'xiaomi': 'Xiaomi', 'redmi': 'Xiaomi', 'poco': 'Xiaomi',
      'oneplus': 'OnePlus', 'huawei': 'Huawei', 'oppo': 'Oppo',
    };

    let detectedBrand: string | null = null;
    const productLower = productName.toLowerCase();
    for (const [keyword, brand] of Object.entries(brandPatterns)) {
      if (productLower.includes(keyword)) {
        detectedBrand = brand;
        break;
      }
    }

    // Find supplier based on brand rule
    let supplierId: string | null = null;
    let supplierName: string | null = null;

    if (detectedBrand) {
      const { data: brandRules } = await supabase
        .from('supplier_brand_rules')
        .select(`
          supplier_id,
          suppliers (id, name, is_active)
        `)
        .eq('user_id', userId)
        .eq('brand', detectedBrand)
        .order('priority', { ascending: true })
        .limit(1);

      if (brandRules && brandRules.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const brandRule = brandRules[0] as any;
        const supplierInfo = brandRule.suppliers;
        if (supplierInfo?.is_active) {
          supplierId = brandRule.supplier_id;
          supplierName = supplierInfo.name;
        }
      }
    }

    // If no brand rule found, try to get any active supplier
    if (!supplierId) {
      const { data: defaultSupplier } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (defaultSupplier) {
        supplierId = defaultSupplier.id;
        supplierName = defaultSupplier.name;
      }
    }

    if (!supplierId) {
      results.push({
        order_id: orderId,
        marketplace_order_id: order.marketplace_order_id,
        routed: false,
        reason: 'No active supplier found. Please add a supplier first.',
      });
      continue;
    }

    // Create supplier order
    const { data: supplierOrder, error: soError } = await supabase
      .from('supplier_orders')
      .insert({
        user_id: userId,
        order_id: orderId,
        supplier_id: supplierId,
        status: 'pending_send',
      })
      .select('id')
      .single();

    if (soError || !supplierOrder) {
      results.push({
        order_id: orderId,
        marketplace_order_id: order.marketplace_order_id,
        routed: false,
        reason: 'Failed to create supplier order',
      });
      continue;
    }

    // Update order with supplier_order_id
    await supabase
      .from('orders')
      .update({
        supplier_order_id: supplierOrder.id,
        routed_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    supplierOrderIds.push(supplierOrder.id);
    results.push({
      order_id: orderId,
      marketplace_order_id: order.marketplace_order_id,
      routed: true,
      supplier_name: supplierName,
      supplier_order_id: supplierOrder.id,
      reason: detectedBrand ? `Matched brand: ${detectedBrand}` : 'Routed to default supplier',
    });
  }

  const routedCount = results.filter(r => r.routed).length;

  return {
    success: routedCount > 0,
    summary: {
      total: orderIds.length,
      routed: routedCount,
      failed: orderIds.length - routedCount,
    },
    results,
    supplier_order_ids: supplierOrderIds,
    next_step: routedCount > 0
      ? 'Orders have been routed to suppliers. Would you like me to send WhatsApp messages to notify the suppliers?'
      : undefined,
  };
}

// Get unrouted orders
async function getUnroutedOrdersList(userId: string) {
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      marketplace_order_id,
      marketplace,
      customer_name,
      order_date,
      total,
      status,
      order_items (product_name, quantity)
    `)
    .eq('user_id', userId)
    .is('supplier_order_id', null)
    .in('status', ['pending', 'confirmed', 'processing'])
    .order('order_date', { ascending: false })
    .limit(50);

  if (!orders || orders.length === 0) {
    return {
      count: 0,
      orders: [],
      message: 'All orders have been routed to suppliers.',
    };
  }

  return {
    count: orders.length,
    orders: orders.map(o => ({
      id: o.id,
      marketplace_order_id: o.marketplace_order_id,
      marketplace: o.marketplace,
      customer_name: o.customer_name,
      order_date: o.order_date,
      total: o.total,
      status: o.status,
      products: (o.order_items as { product_name: string; quantity: number }[] || [])
        .map(i => `${i.product_name} (x${i.quantity})`)
        .join(', '),
    })),
    message: `Found ${orders.length} orders that need to be routed to suppliers.`,
  };
}

// Send WhatsApp to suppliers
async function sendWhatsAppToSupplier(userId: string, supplierOrderIds: string[]) {
  if (!supplierOrderIds || supplierOrderIds.length === 0) {
    return { error: 'No supplier order IDs provided' };
  }

  // Fetch supplier orders with details
  const { data: supplierOrders } = await supabase
    .from('supplier_orders')
    .select(`
      id,
      order_id,
      supplier_id,
      supplier:suppliers (id, name, whatsapp_number)
    `)
    .in('id', supplierOrderIds)
    .eq('user_id', userId);

  if (!supplierOrders || supplierOrders.length === 0) {
    return { error: 'Supplier orders not found' };
  }

  // Get order details
  const orderIds = supplierOrders.map(so => so.order_id);
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      id,
      marketplace_order_id,
      marketplace,
      customer_name,
      shipping_city,
      order_items (product_name, quantity)
    `)
    .in('id', orderIds);

  if (!orders || orders.length === 0) {
    return { error: 'Orders not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderMap = new Map(orders.map((o: any) => [o.id, o]));
  const results = [];

  // Group by supplier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supplierGroups = new Map<string, { supplier: any; orders: any[] }>();

  for (const so of supplierOrders) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supplierData = (so as any).supplier;
    const supplier = supplierData as { id: string; name: string; whatsapp_number: string } | null;
    if (!supplier) continue;

    const supplierId = supplier.id;
    if (!supplierGroups.has(supplierId)) {
      supplierGroups.set(supplierId, { supplier, orders: [] });
    }

    const order = orderMap.get(so.order_id);
    if (order) {
      supplierGroups.get(supplierId)!.orders.push({
        ...order,
        supplier_order_id: so.id,
      });
    }
  }

  for (const [supplierId, { supplier, orders: supplierOrdersList }] of supplierGroups) {
    // Generate message
    const orderDetails = supplierOrdersList.map(o => {
      const items = (o.order_items || [])
        .map((i: { product_name: string; quantity: number }) => `• ${i.product_name} (x${i.quantity})`)
        .join('\n');
      return `Order: ${o.marketplace_order_id}\nCustomer: ${o.customer_name}\nCity: ${o.shipping_city || 'N/A'}\nItems:\n${items}`;
    }).join('\n\n---\n\n');

    const message = `السلام عليكم ${supplier.name},

New order${supplierOrdersList.length > 1 ? 's' : ''} to fulfill:

${orderDetails}

Please confirm availability. شكراً`;

    // Create WhatsApp link
    const encodedMessage = encodeURIComponent(message);
    const phoneNumber = supplier.whatsapp_number.replace(/[^0-9]/g, '');
    const whatsappLink = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

    // Update supplier order status
    const soIds = supplierOrdersList.map((o: { supplier_order_id: string }) => o.supplier_order_id);
    await supabase
      .from('supplier_orders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_via: 'whatsapp',
      })
      .in('id', soIds);

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      activity_type: 'whatsapp_sent',
      title: `WhatsApp sent to ${supplier.name}`,
      description: `Sent ${supplierOrdersList.length} order(s) to supplier via WhatsApp`,
      metadata: {
        supplier_id: supplierId,
        supplier_order_ids: soIds,
      },
    });

    results.push({
      supplier_id: supplierId,
      supplier_name: supplier.name,
      order_count: supplierOrdersList.length,
      whatsapp_link: whatsappLink,
      phone: supplier.whatsapp_number,
    });
  }

  return {
    success: true,
    message: `Generated WhatsApp messages for ${results.length} supplier(s). Click the links below to send:`,
    results,
  };
}

// Mark orders for packing
async function markOrdersForPacking(
  userId: string,
  orderIds: string[],
  targetStatus: 'processing' | 'ready_to_ship'
) {
  if (!orderIds || orderIds.length === 0) {
    return { error: 'No order IDs provided' };
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: targetStatus })
    .eq('user_id', userId)
    .in('id', orderIds)
    .select('id, marketplace_order_id, status');

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: userId,
    activity_type: 'order_status_changed',
    title: `${orderIds.length} orders marked for packing`,
    description: `Orders moved to ${targetStatus} status`,
    metadata: { order_ids: orderIds, new_status: targetStatus },
  });

  return {
    success: true,
    updated: data?.length || 0,
    status: targetStatus,
    message: `${data?.length || 0} orders have been marked as "${targetStatus}". They are now visible in the packing station.`,
  };
}

// Bulk update order status
async function bulkUpdateOrderStatus(
  userId: string,
  orderIds: string[],
  newStatus: string
) {
  if (!orderIds || orderIds.length === 0) {
    return { error: 'No order IDs provided' };
  }

  const { data, error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('user_id', userId)
    .in('id', orderIds)
    .select('id, marketplace_order_id, status');

  if (error) {
    return { error: error.message };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    user_id: userId,
    activity_type: 'order_status_changed',
    title: `${orderIds.length} orders updated to ${newStatus}`,
    description: `Bulk status update via AI assistant`,
    metadata: { order_ids: orderIds, new_status: newStatus },
  });

  return {
    success: true,
    updated: data?.length || 0,
    new_status: newStatus,
    orders: data,
    message: `Successfully updated ${data?.length || 0} orders to "${newStatus}".`,
  };
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
    case 'populate_inventory_from_orders':
      return await populateInventoryFromOrders(
        input.user_id as string,
        input.dry_run !== false
      );
    case 'get_product_sales_analytics':
      return await getProductSalesAnalytics(
        input.user_id as string,
        input.limit as number | undefined,
        input.date_from as string | undefined,
        input.date_to as string | undefined
      );
    case 'query_orders_data':
      return await queryOrdersData(
        input.user_id as string,
        input.query_type as string,
        input.date_from as string | undefined,
        input.date_to as string | undefined,
        input.group_by as string | undefined
      );
    case 'route_orders_to_supplier':
      return await routeOrdersToSupplier(
        input.user_id as string,
        input.order_ids as string[]
      );
    case 'get_unrouted_orders':
      return await getUnroutedOrdersList(input.user_id as string);
    case 'send_whatsapp_to_supplier':
      return await sendWhatsAppToSupplier(
        input.user_id as string,
        input.supplier_order_ids as string[]
      );
    case 'mark_orders_for_packing':
      return await markOrdersForPacking(
        input.user_id as string,
        input.order_ids as string[],
        input.target_status as 'processing' | 'ready_to_ship'
      );
    case 'bulk_update_order_status':
      return await bulkUpdateOrderStatus(
        input.user_id as string,
        input.order_ids as string[],
        input.new_status as string
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
3. **Supplier Routing**: Route orders to suppliers and send WhatsApp notifications
4. **Packing Station**: Mark orders as ready for packing or ready to ship
5. **Analytics**: Provide insights about sales performance, return rates, and marketplace comparisons
6. **Bulk Actions**: Update multiple orders at once (mark all pending as shipped, etc.)

Key behaviors:
- Be concise and actionable in your responses
- Format responses using markdown for better readability (use **bold**, tables, bullet points)
- When showing orders, format them as a markdown table with columns: Order ID, Customer, Status, Products, Total
- When showing inventory, include SKU, product name, available quantity, and status
- When updating order status or inventory, confirm the action was successful
- Proactively suggest what the user might want to do next
- Use AED as the default currency
- When listing orders or inventory items that need action, always include IDs so users can take action

Common user requests and how to handle them:
- "How many orders are pending?" → Use get_order_stats or search_orders with status=pending
- "Forward orders to supplier" → First get unrouted orders, then route them, then offer to send WhatsApp
- "Mark orders for packing" → Use mark_orders_for_packing with target_status=processing
- "Send to supplier via WhatsApp" → Route orders first if needed, then use send_whatsapp_to_supplier

Status flow for orders:
- pending → confirmed → processing → ready_to_ship → shipped → out_for_delivery → delivered
- Orders can also be: cancelled, returned, refunded

When routing to suppliers:
1. First use get_unrouted_orders to find orders without suppliers
2. Then use route_orders_to_supplier to assign suppliers based on brand rules
3. Finally use send_whatsapp_to_supplier to notify suppliers (returns clickable links)

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
    // Identity comes from the session cookie ONLY (TODO-047) — a client-supplied
    // userId in the body is ignored so no caller can read another tenant's data.
    const authClient = await createServerSupabase();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = user.id;

    const { messages } = await request.json();

    // Add user_id context to the conversation
    const systemWithContext = `${SYSTEM_PROMPT}\n\nCurrent user ID: ${userId}. Always use this user_id when calling tools.`;

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
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
          // Force the session identity into every tool call — the model's
          // user_id argument is never trusted.
          const result = await processToolCall(toolUse.name, {
            ...(toolUse.input as Record<string, unknown>),
            user_id: userId,
          });

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
        model: 'claude-sonnet-5',
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
