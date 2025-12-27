import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  lastOrderDate: string;
}

// Common field names for product data in raw order exports
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

function normalizeCondition(condition: string | null): string {
  if (!condition) return 'new';
  const c = condition.toLowerCase();
  if (c.includes('new')) return 'new';
  if (c.includes('excellent') || c.includes('like new')) return 'excellent';
  if (c.includes('very good') || c.includes('very_good')) return 'very_good';
  if (c.includes('good')) return 'good';
  if (c.includes('fair') || c.includes('acceptable')) return 'fair';
  if (c.includes('renew') || c.includes('refurb')) return 'renewed';
  return 'new';
}

export async function POST(request: NextRequest) {
  try {
    const { userId, dryRun = false } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Fetch all orders with raw_data
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, marketplace, total, order_date, raw_data, status')
      .eq('user_id', userId)
      .not('status', 'eq', 'cancelled');

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        error: 'No orders found. Import some orders first.',
        products: [],
        stats: { totalOrders: 0, uniqueProducts: 0 }
      }, { status: 400 });
    }

    // Extract products from orders
    const productMap = new Map<string, ExtractedProduct>();

    for (const order of orders) {
      const rawData = order.raw_data as Record<string, unknown> | null;

      // Try to extract product info from raw_data
      let productName = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.name);
      const sku = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.sku);
      const brand = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.brand);
      const category = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.category);
      const priceStr = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.price);
      const quantityStr = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.quantity);
      const conditionStr = findFieldValue(rawData || {}, PRODUCT_FIELD_PATTERNS.condition);

      // If no product name found, try to create one from other fields
      if (!productName) {
        if (sku) {
          productName = `Product ${sku}`;
        } else if (brand) {
          productName = `${brand} Product`;
        } else {
          // Skip orders without identifiable products
          continue;
        }
      }

      const price = priceStr ? parseNumber(priceStr) : order.total;
      const quantity = quantityStr ? parseNumber(quantityStr) : 1;
      const condition = normalizeCondition(conditionStr);

      // Create a unique key for the product
      const productKey = sku || productName.toLowerCase().replace(/[^a-z0-9]/g, '_');

      if (productMap.has(productKey)) {
        // Update existing product stats
        const existing = productMap.get(productKey)!;
        existing.unitsSold += quantity;
        existing.revenue += price * quantity;
        if (!existing.marketplaces.includes(order.marketplace)) {
          existing.marketplaces.push(order.marketplace);
        }
        if (new Date(order.order_date) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.order_date;
          // Update price to most recent
          existing.price = price;
        }
      } else {
        // Create new product entry
        productMap.set(productKey, {
          name: productName,
          sku: sku,
          brand: brand,
          category: category,
          price: price,
          condition: condition,
          unitsSold: quantity,
          revenue: price * quantity,
          marketplaces: [order.marketplace],
          lastOrderDate: order.order_date,
        });
      }
    }

    const extractedProducts = Array.from(productMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold);

    // If dry run, just return the analysis
    if (dryRun) {
      return NextResponse.json({
        products: extractedProducts,
        stats: {
          totalOrders: orders.length,
          uniqueProducts: extractedProducts.length,
          totalUnitsSold: extractedProducts.reduce((sum, p) => sum + p.unitsSold, 0),
          totalRevenue: extractedProducts.reduce((sum, p) => sum + p.revenue, 0),
        },
      });
    }

    // Create products and inventory
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of extractedProducts) {
      try {
        // Check if product already exists
        const existingQuery = supabase
          .from('products')
          .select('id')
          .eq('user_id', userId);

        if (product.sku) {
          // Check by SKU in variants
          const { data: existingVariant } = await supabase
            .from('product_variants')
            .select('id, product_id')
            .eq('sku', product.sku)
            .single();

          if (existingVariant) {
            skipped++;
            continue;
          }
        } else {
          // Check by name
          const { data: existingProduct } = await existingQuery
            .eq('name', product.name)
            .single();

          if (existingProduct) {
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
          errors++;
          console.error('Product creation error:', productError);
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
          errors++;
          console.error('Variant creation error:', variantError);
          continue;
        }

        const variantData = newVariant as { id: string };

        // Create inventory entry with 0 quantity (user will need to set actual stock)
        // But we'll set reorder_point based on sales velocity
        const avgMonthlySales = product.unitsSold; // Simplified - could calculate based on date range
        const suggestedReorderPoint = Math.max(5, Math.ceil(avgMonthlySales * 0.5));

        await supabase
          .from('inventory')
          .insert({
            variant_id: variantData.id,
            quantity: 0, // User needs to input actual stock
            reserved: 0,
            reorder_point: suggestedReorderPoint,
          } as never);

        created++;
      } catch (err) {
        errors++;
        console.error('Error creating product:', err);
      }
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: userId,
      activity_type: 'inventory_updated',
      title: 'Inventory populated from orders',
      description: `Created ${created} products from ${orders.length} orders analysis`,
      metadata: {
        created,
        skipped,
        errors,
        totalProducts: extractedProducts.length,
      },
    } as never);

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors,
      products: extractedProducts,
      stats: {
        totalOrders: orders.length,
        uniqueProducts: extractedProducts.length,
        totalUnitsSold: extractedProducts.reduce((sum, p) => sum + p.unitsSold, 0),
        totalRevenue: extractedProducts.reduce((sum, p) => sum + p.revenue, 0),
      },
    });
  } catch (error) {
    console.error('Populate inventory error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
