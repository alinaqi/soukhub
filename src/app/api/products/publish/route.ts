import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { setProductPublished } from '@/lib/marketplace/store-service';

/** POST /api/products/publish — {product_id, is_published} for the caller's store. */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { product_id, is_published } = await request.json();
    if (typeof product_id !== 'string' || typeof is_published !== 'boolean') {
      return NextResponse.json(
        { error: 'product_id (string) and is_published (boolean) are required' },
        { status: 400 }
      );
    }
    const result = await setProductPublished(user.id, product_id, is_published);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('publish failed:', error);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}
