import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { assessDevice } from '@/lib/tradein/assess';
import { findComparables, findExchangeCandidates } from '@/lib/tradein/comparables';
import { valueDevice, exchangeOptions } from '@/lib/tradein/pricing';

export const maxDuration = 60;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

interface EvaluateBody {
  images?: { media_type?: string; data?: string }[];
  notes?: string;
  contact_phone?: string;
}

/**
 * POST /api/trade-in/evaluate (ADR 0016) — public: guests can get a valuation.
 * Photos → AI assessment → market comparables → value + exchange offers.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EvaluateBody;
    const images = (body.images ?? []).slice(0, MAX_IMAGES);
    if (images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }
    const validated: { media_type: (typeof ALLOWED_TYPES)[number]; data: string }[] = [];
    for (const img of images) {
      if (!ALLOWED_TYPES.includes(img.media_type as (typeof ALLOWED_TYPES)[number])) {
        return NextResponse.json({ error: 'Images must be JPEG, PNG or WebP' }, { status: 400 });
      }
      if (typeof img.data !== 'string' || img.data.length * 0.75 > MAX_IMAGE_BYTES) {
        return NextResponse.json({ error: 'Each image must be under 4MB' }, { status: 400 });
      }
      validated.push({ media_type: img.media_type as (typeof ALLOWED_TYPES)[number], data: img.data });
    }

    const assessment = await assessDevice({ images: validated, notes: body.notes });

    if (!assessment.identified || assessment.confidence < 0.3) {
      return NextResponse.json({ assessment, valuation: null, exchange_options: [] });
    }

    const [comparables, candidates] = await Promise.all([
      findComparables(assessment),
      findExchangeCandidates(assessment),
    ]);
    const valuation = valueDevice(assessment, comparables);
    const options = valuation
      ? exchangeOptions(valuation.trade_in_value, candidates).map((o) => {
          const c = candidates.find((x) => x.id === o.id)!;
          return { ...c, top_up: o.top_up };
        })
      : [];

    // Persist the request (service role; user attached when logged in)
    const auth = await createServerSupabase();
    const {
      data: { user },
    } = await auth.auth.getUser();
    const svc = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
    await svc.from('trade_in_requests').insert({
      user_id: user?.id ?? null,
      contact_phone: body.contact_phone?.slice(0, 30) ?? null,
      notes: body.notes?.slice(0, 1000) ?? null,
      ai_assessment: assessment as unknown as Record<string, unknown>,
      estimated_value: valuation?.trade_in_value ?? null,
      status: 'evaluated',
    });

    return NextResponse.json({ assessment, valuation, exchange_options: options });
  } catch (error) {
    console.error('trade-in evaluation failed:', error);
    return NextResponse.json({ error: 'evaluation_failed' }, { status: 502 });
  }
}
