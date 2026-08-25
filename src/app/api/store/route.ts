import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStoreForUser, updateStoreForUser, type StorePatch } from '@/lib/marketplace/store-service';

async function sessionUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** GET /api/store — the caller's store (provisioned on first access). */
export async function GET() {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const store = await getStoreForUser(userId);
    return NextResponse.json({ store });
  } catch (error) {
    console.error('store fetch failed:', error);
    return NextResponse.json({ error: 'Failed to load store' }, { status: 500 });
  }
}

/** PATCH /api/store — update name/slug/bio/logo/publish state. */
export async function PATCH(request: NextRequest) {
  const userId = await sessionUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = (await request.json()) as StorePatch;
    const allowed: (keyof StorePatch)[] = [
      'name', 'name_ar', 'slug', 'logo_url', 'bio', 'bio_ar', 'is_published',
    ];
    const patch = Object.fromEntries(
      Object.entries(body).filter(([k]) => allowed.includes(k as keyof StorePatch))
    ) as StorePatch;

    const result = await updateStoreForUser(userId, patch);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ store: result.store });
  } catch (error) {
    console.error('store update failed:', error);
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
  }
}
