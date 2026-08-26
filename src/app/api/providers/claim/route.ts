import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { claimProvider } from '@/lib/marketplace/claim-service';

/** POST /api/providers/claim — a listed shop owner claims their directory
 * entry and gets a ready-to-manage seller account. Auth required
 * (middleware 401s guests); identity comes from the session, never the body. */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'auth_required' }, { status: 401 });

    const { provider_id } = await request.json();
    if (typeof provider_id !== 'string' || !provider_id) {
      return NextResponse.json({ error: 'provider_id is required' }, { status: 400 });
    }

    const result = await claimProvider(user.id, provider_id);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      ok: true,
      store_path: result.store_path,
      prefilled: result.prefilled,
      store_name: result.store.name,
    });
  } catch (error) {
    console.error('provider claim failed:', error);
    return NextResponse.json({ error: 'claim_failed' }, { status: 500 });
  }
}
