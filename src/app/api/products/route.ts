import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateSKU, generateProductName, getCategory } from '@/lib/product-data';

interface CreateProductRequest {
  category: string;
  brand: string;
  model?: string;
  attributes: Record<string, string>;
  condition: string;
  price: number;
  quantity?: number;
  sku?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateProductRequest = await request.json();
    const { category, brand, model = '', attributes, condition, price, quantity = 1, sku } = body;

    // Validate required fields
    if (!category || !brand || !condition || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate category exists
    const categoryConfig = getCategory(category);
    if (!categoryConfig) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate product name and SKU
    const productName = generateProductName(brand, model, attributes);
    const productSku = sku || generateSKU(category, brand, model, attributes);

    // Check if product with same name already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', productName)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'Product with this name already exists' },
        { status: 409 }
      );
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: productName,
        brand,
        category: categoryConfig.name,
        base_price: price,
        is_active: true,
      } as never)
      .select()
      .single();

    if (productError || !product) {
      console.error('Error creating product:', productError);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    const productId = (product as { id: string }).id;

    // Build variant name from model and key attributes
    const variantNameParts = [model, attributes.storage, attributes.color, attributes.size].filter(Boolean);
    const variantName = variantNameParts.join(' ') || 'Default';

    // Create variant with all attributes stored
    const { data: variant, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: productId,
        sku: productSku,
        name: variantName,
        color: attributes.color || null,
        storage: attributes.storage || null,
        condition,
        price,
        // Store additional attributes as metadata
        metadata: attributes,
      } as never)
      .select()
      .single();

    if (variantError || !variant) {
      console.error('Error creating variant:', variantError);
      // Cleanup: delete the product we just created
      await supabase.from('products').delete().eq('id', productId);
      return NextResponse.json(
        { error: 'Failed to create product variant' },
        { status: 500 }
      );
    }

    const variantId = (variant as { id: string }).id;

    // Create inventory entry
    const { error: inventoryError } = await supabase.from('inventory').insert({
      variant_id: variantId,
      quantity,
      reserved: 0,
      reorder_point: 3,
    } as never);

    if (inventoryError) {
      console.error('Error creating inventory:', inventoryError);
      // Continue anyway - inventory can be added later
    }

    // Log activity
    await supabase.from('activity_log').insert({
      user_id: user.id,
      activity_type: 'product_created',
      title: `Added ${productName}`,
      description: `${condition} condition, ${quantity} units at AED ${price}`,
      metadata: { product_id: productId, variant_id: variantId, category },
    } as never);

    return NextResponse.json({
      success: true,
      product: {
        id: productId,
        name: productName,
        brand,
        category,
        variant_id: variantId,
        sku: productSku,
        price,
        quantity,
        condition,
      },
    });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
