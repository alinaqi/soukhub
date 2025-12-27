import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCustomerStats, createReferralCode } from '@/lib/customer-intelligence';

// GET /api/customers/[id]/stats - Get customer intelligence
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getCustomerStats(supabase, user.id, id);

    if (!stats) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Get customer stats error:', error);
    return NextResponse.json({ error: 'Failed to get stats' }, { status: 500 });
  }
}

interface CreateReferralRequest {
  discount_percent?: number;
  expires_in_days?: number;
}

// POST /api/customers/[id]/stats - Create referral code
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: CreateReferralRequest = await request.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const referral = await createReferralCode(
      supabase,
      user.id,
      id,
      body.discount_percent || 10,
      body.expires_in_days || 30
    );

    if (!referral) {
      return NextResponse.json({ error: 'Failed to create referral code' }, { status: 500 });
    }

    return NextResponse.json({ success: true, referral });
  } catch (error) {
    console.error('Create referral error:', error);
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
  }
}
