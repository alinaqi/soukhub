import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface FieldMapping {
  sourceHeader: string;
  targetField: string;
  confidence: number;
  sampleValue?: string;
}

export interface MappingResult {
  dataType: 'orders' | 'inventory' | 'products';
  marketplace: string | null;
  mappings: FieldMapping[];
  unmappedHeaders: string[];
}

// Schema definitions for different data types
const SCHEMAS = {
  orders: {
    required: ['marketplace_order_id', 'order_date'],
    optional: [
      'customer_name',
      'customer_email',
      'customer_phone',
      'status',
      'subtotal',
      'shipping_cost',
      'tax',
      'discount',
      'total',
      'currency',
      'shipping_city',
      'shipping_country',
      'shipping_address',
      'fulfillment',
      'payment_method',
      'tracking_number',
      'carrier',
      'ship_date',
      'delivery_date',
      'notes',
      'product_name',
      'product_sku',
      'quantity',
      'unit_price',
    ],
    description: 'E-commerce order data from marketplaces like Amazon, Cartlow, Revibe',
  },
  inventory: {
    required: ['sku'],
    optional: [
      'product_name',
      'quantity',
      'reserved',
      'warehouse_location',
      'reorder_point',
      'cost',
      'price',
      'condition',
      'color',
      'storage',
      'brand',
      'category',
      'barcode',
      'weight_grams',
    ],
    description: 'Inventory/stock levels for products',
  },
  products: {
    required: ['name'],
    optional: [
      'sku',
      'brand',
      'category',
      'description',
      'base_price',
      'cost_price',
      'condition',
      'color',
      'storage',
      'barcode',
      'weight_grams',
      'is_active',
    ],
    description: 'Product catalog information',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { headers, sampleRows, dataType } = await request.json();

    if (!headers || !Array.isArray(headers) || headers.length === 0) {
      return NextResponse.json({ error: 'Headers array is required' }, { status: 400 });
    }

    // Build sample data context
    const sampleContext = sampleRows?.slice(0, 3).map((row: Record<string, string>, i: number) => {
      return `Row ${i + 1}: ${JSON.stringify(row)}`;
    }).join('\n') || 'No sample data provided';

    // Build schema context
    const schemaContext = Object.entries(SCHEMAS).map(([type, schema]) => {
      return `
## ${type.toUpperCase()} Schema
Description: ${schema.description}
Required fields: ${schema.required.join(', ')}
Optional fields: ${schema.optional.join(', ')}`;
    }).join('\n');

    const prompt = `You are a data mapping expert. Analyze these CSV/TSV headers and sample data to:

1. Determine the data type (orders, inventory, or products)
2. Identify the likely marketplace source (amazon, cartlow, revibe, noon, or null if unknown)
3. Map each header to the appropriate schema field

${schemaContext}

## Headers to Map
${headers.map((h: string, i: number) => `${i + 1}. "${h}"`).join('\n')}

## Sample Data
${sampleContext}

${dataType ? `The user specified this is ${dataType} data.` : ''}

Return a JSON object with this exact structure:
{
  "dataType": "orders" | "inventory" | "products",
  "marketplace": "amazon" | "cartlow" | "revibe" | "noon" | null,
  "mappings": [
    {
      "sourceHeader": "original header name",
      "targetField": "schema field name",
      "confidence": 0.0-1.0
    }
  ],
  "unmappedHeaders": ["headers that don't match any schema field"]
}

Mapping guidelines:
- Match headers to the most semantically similar field
- "order-id", "Order ID", "order_id", "OrderNumber" all map to "marketplace_order_id"
- "purchase-date", "Order Date", "Created At" all map to "order_date"
- "buyer-name", "Customer Name", "Name" all map to "customer_name"
- "item-price", "Total", "Cost", "Amount" map to "total" or "subtotal"
- "SKU", "sku", "Product SKU", "Article Number" all map to "sku"
- "Qty", "Quantity", "Count", "Units" all map to "quantity"
- Date/time fields should map to appropriate date fields
- Price/cost/amount fields should map to appropriate monetary fields
- Location fields (city, country, address) should map to shipping fields
- Status fields should map to "status"

Be generous with mappings - if there's a reasonable match, include it with appropriate confidence.
Only return the JSON object, no other text.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    if (!textBlock) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse the JSON response
    let mappingResult: MappingResult;
    try {
      // Clean up the response - remove markdown code blocks if present
      let jsonText = textBlock.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
      }
      mappingResult = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse AI response:', textBlock.text);
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: textBlock.text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...mappingResult,
      usage: response.usage,
    });
  } catch (error) {
    console.error('Header mapping error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An error occurred' },
      { status: 500 }
    );
  }
}
