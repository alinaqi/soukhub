import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { CATEGORIES, getConditions, getCategory } from '@/lib/product-data';

const anthropic = new Anthropic();

interface ParsedProduct {
  category: string;
  brand: string;
  model?: string;
  attributes: Record<string, string>;
  condition: string;
  price: number;
}

export async function POST(request: NextRequest) {
  try {
    const { text, categoryHint } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Please provide a product description' },
        { status: 400 }
      );
    }

    // Build category info for the AI
    const categoryInfo = CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      brands: cat.brands.slice(0, 5).join(', '),
      attributes: cat.attributes.map(a => a.key).join(', '),
    }));

    // If category is provided, get more specific info
    let specificCategoryInfo = '';
    if (categoryHint) {
      const category = getCategory(categoryHint);
      if (category) {
        const conditions = getConditions(categoryHint);
        specificCategoryInfo = `
The user is adding to category: ${category.name}
Available brands: ${category.brands.join(', ')}
Required attributes: ${category.attributes.filter(a => a.required).map(a => `${a.key} (options: ${a.options?.join(', ') || 'free text'})`).join('; ')}
Optional attributes: ${category.attributes.filter(a => !a.required).map(a => `${a.key} (options: ${a.options?.join(', ') || 'free text'})`).join('; ')}
Condition values: ${conditions.map(c => c.value).join(', ')}`;
      }
    }

    const systemPrompt = `You are a product data extractor for a multi-category marketplace.

${categoryHint ? specificCategoryInfo : `Available categories and their details:
${categoryInfo.map(c => `- ${c.id}: ${c.name} (brands: ${c.brands}..., attributes: ${c.attributes})`).join('\n')}`}

Extract product information from the user's description. Return a JSON object with:
- category: The category ID (${CATEGORIES.map(c => c.id).join(', ')})
- brand: The brand name
- model: The specific model (if applicable, empty string if not)
- attributes: An object with category-specific attributes like storage, color, size, etc.
- condition: The condition value (new, excellent, very_good, good, fair, or category-specific like deadstock, vnds)
- price: Numeric value only (no currency symbol)

Return ONLY a valid JSON object. No explanation, no markdown, just the JSON.
If a field cannot be determined, make a reasonable assumption based on context.
For electronics, default to "good" condition if unclear.
For clothing/shoes, "new" often means new with tags.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Parse this product: "${text}"`,
        },
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    // Parse the JSON response
    let parsed: ParsedProduct;
    try {
      // Remove any markdown code blocks if present
      let jsonText = content.text.trim();
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      parsed = JSON.parse(jsonText);
    } catch {
      console.error('Failed to parse AI response:', content.text);
      return NextResponse.json(
        { error: 'Could not parse product description. Please try again.' },
        { status: 400 }
      );
    }

    // Validate category
    if (!parsed.category || !getCategory(parsed.category)) {
      // Try to detect category from parsed data
      parsed.category = categoryHint || 'phones';
    }

    // Validate required fields
    if (!parsed.brand || !parsed.condition || !parsed.price) {
      return NextResponse.json(
        { error: 'Could not extract all required fields. Please provide more details.' },
        { status: 400 }
      );
    }

    // Ensure attributes is an object
    if (!parsed.attributes || typeof parsed.attributes !== 'object') {
      parsed.attributes = {};
    }

    // Normalize condition if needed
    const validConditions = getConditions(parsed.category).map(c => c.value);
    if (!validConditions.includes(parsed.condition)) {
      parsed.condition = 'good'; // Default
    }

    // Ensure price is a number
    if (typeof parsed.price === 'string') {
      parsed.price = parseFloat((parsed.price as string).replace(/[^0-9.]/g, ''));
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Parse product error:', error);
    return NextResponse.json(
      { error: 'Failed to parse product description' },
      { status: 500 }
    );
  }
}
