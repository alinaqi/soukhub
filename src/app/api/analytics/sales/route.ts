import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  getSalesSummary,
  getProductTrends,
  getDailySales,
} from '@/lib/sales-analytics';

// GET /api/analytics/sales - Get sales analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = (searchParams.get('period') as '7d' | '30d' | '90d') || '7d';
    const includeDaily = searchParams.get('daily') === 'true';
    const includeTrends = searchParams.get('trends') === 'true';

    // Get summary
    const summary = await getSalesSummary(supabase, user.id, period);

    // Optional: get daily data for charts
    let dailySales = null;
    if (includeDaily) {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      dailySales = await getDailySales(supabase, user.id, days);
    }

    // Optional: get product trends
    let trends = null;
    if (includeTrends) {
      trends = await getProductTrends(supabase, user.id);
    }

    return NextResponse.json({
      summary,
      daily_sales: dailySales,
      product_trends: trends,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json({ error: 'Failed to get analytics' }, { status: 500 });
  }
}
