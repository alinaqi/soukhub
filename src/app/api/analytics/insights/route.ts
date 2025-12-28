import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  generateActionableInsights,
  analyzeWorkflowBottlenecks,
  analyzeProductPerformance,
  getUAEMarketTrends,
} from '@/lib/actionable-insights';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all insights in parallel
    const [insights, bottlenecks, productPerformance, marketTrends] = await Promise.all([
      generateActionableInsights(supabase, user.id),
      analyzeWorkflowBottlenecks(supabase, user.id),
      analyzeProductPerformance(supabase, user.id),
      getUAEMarketTrends(),
    ]);

    return NextResponse.json({
      insights,
      bottlenecks,
      productPerformance,
      marketTrends,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}
