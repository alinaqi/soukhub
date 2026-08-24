'use client';

import { useState } from 'react';
import type { Order } from '@/types/supabase';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { InsightsDashboard } from './InsightsDashboard';

interface AnalyticsPageClientProps {
  orders: Order[];
}

export function AnalyticsPageClient({ orders }: AnalyticsPageClientProps) {
  const [activeView, setActiveView] = useState<'insights' | 'analytics'>('insights');

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setActiveView('insights')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'insights'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🎯 Insights & Actions
        </button>
        <button
          onClick={() => setActiveView('analytics')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeView === 'analytics'
              ? 'bg-background shadow text-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📊 Analytics & Charts
        </button>
      </div>

      {/* Content */}
      {activeView === 'insights' ? (
        <InsightsDashboard />
      ) : (
        <AnalyticsDashboard orders={orders} />
      )}
    </div>
  );
}
