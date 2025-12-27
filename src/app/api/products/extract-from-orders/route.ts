import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface OrderItemWithOrder {
  id: string;
  product_name: string;
  marketplace_sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  condition: string | null;
  created_at: string;
  orders: {
    id: string;
    marketplace: string;
    order_date: string;
    user_id: string;
  };
}

interface ExtractedProduct {
  name: string;
  sku: string | null;
  price: number;
  condition: string;
  unitsSold: number;
  revenue: number;
  marketplaces: string[];
  lastOrderDate: string;
}

interface ExtractResult {
  success?: boolean;
  created?: number;
  skipped?: number;
  errors?: number;
  products: ExtractedProduct[];
  stats: {
    totalOrders: number;
    uniqueProducts: number;
    totalUnitsSold: number;
    totalRevenue: number;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all order items for user's orders, grouped by product
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select(
        `
        id,
        product_name,
        marketplace_sku,
        quantity,
        unit_price,
        total_price,
        condition,
        created_at,
        orders!inner (
          id,
          marketplace,
          order_date,
          user_id
        )
      `
      )
      .eq('orders.user_id', user.id);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      );
    }

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({
        products: [],
        stats: {
          totalOrders: 0,
          uniqueProducts: 0,
          totalUnitsSold: 0,
          totalRevenue: 0,
        },
        error: 'No order items found. Import some orders first.',
      } as ExtractResult);
    }

    // Cast to our expected type
    const typedOrderItems = orderItems as unknown as OrderItemWithOrder[];

    // Group by product name + SKU to aggregate
    const productMap = new Map<
      string,
      {
        name: string;
        sku: string | null;
        prices: number[];
        condition: string;
        unitsSold: number;
        revenue: number;
        marketplaces: Set<string>;
        lastOrderDate: string;
      }
    >();

    // Get unique order count
    const orderIds = new Set<string>();

    for (const item of typedOrderItems) {
      const order = item.orders;
      orderIds.add(order.id);

      // Create a key from product name + SKU
      const key = `${item.product_name}|${item.marketplace_sku || ''}`;

      if (!productMap.has(key)) {
        productMap.set(key, {
          name: item.product_name,
          sku: item.marketplace_sku,
          prices: [],
          condition: item.condition || 'new',
          unitsSold: 0,
          revenue: 0,
          marketplaces: new Set(),
          lastOrderDate: order.order_date || item.created_at,
        });
      }

      const product = productMap.get(key)!;
      product.prices.push(item.unit_price);
      product.unitsSold += item.quantity;
      product.revenue += item.total_price;
      product.marketplaces.add(order.marketplace);

      // Update last order date if newer
      const orderDate = order.order_date || item.created_at;
      if (orderDate > product.lastOrderDate) {
        product.lastOrderDate = orderDate;
      }
    }

    // Convert to array and calculate average prices
    const extractedProducts: ExtractedProduct[] = Array.from(
      productMap.values()
    )
      .map((p) => ({
        name: p.name,
        sku: p.sku,
        price: p.prices.reduce((a, b) => a + b, 0) / p.prices.length,
        condition: p.condition,
        unitsSold: p.unitsSold,
        revenue: p.revenue,
        marketplaces: Array.from(p.marketplaces),
        lastOrderDate: p.lastOrderDate,
      }))
      .sort((a, b) => b.revenue - a.revenue); // Sort by revenue descending

    const stats = {
      totalOrders: orderIds.size,
      uniqueProducts: extractedProducts.length,
      totalUnitsSold: extractedProducts.reduce((sum, p) => sum + p.unitsSold, 0),
      totalRevenue: extractedProducts.reduce((sum, p) => sum + p.revenue, 0),
    };

    // If dry run, just return the preview
    if (dryRun) {
      return NextResponse.json({
        products: extractedProducts,
        stats,
      } as ExtractResult);
    }

    // Actually create the products
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of extractedProducts) {
      try {
        // Check if product already exists (by name for this user)
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', product.name)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Create the product
        const { data: newProduct, error: productError } = await supabase
          .from('products')
          .insert({
            user_id: user.id,
            name: product.name,
            base_price: product.price,
            is_active: true,
          } as never)
          .select()
          .single();

        if (productError || !newProduct) {
          console.error('Error creating product:', productError);
          errors++;
          continue;
        }

        const productId = (newProduct as { id: string }).id;

        // Create a default variant
        const { data: newVariant, error: variantError } = await supabase
          .from('product_variants')
          .insert({
            product_id: productId,
            sku: product.sku || `SKU-${productId.slice(0, 8)}`,
            condition: product.condition,
            price: product.price,
          } as never)
          .select()
          .single();

        if (variantError || !newVariant) {
          console.error('Error creating variant:', variantError);
          errors++;
          continue;
        }

        const variantId = (newVariant as { id: string }).id;

        // Create inventory entry with 0 stock
        await supabase.from('inventory').insert({
          variant_id: variantId,
          quantity: 0,
          reserved: 0,
          reorder_point: 5,
        } as never);

        created++;
      } catch (err) {
        console.error('Error processing product:', err);
        errors++;
      }
    }

    // Log the activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: 'products_extracted',
      title: `Extracted ${created} products from orders`,
      description: `Created ${created} products, skipped ${skipped} existing, ${errors} errors`,
      metadata: { created, skipped, errors },
    } as never);

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors,
      products: extractedProducts,
      stats,
    } as ExtractResult);
  } catch (error) {
    console.error('Extract products error:', error);
    return NextResponse.json(
      { error: 'Failed to extract products' },
      { status: 500 }
    );
  }
}
