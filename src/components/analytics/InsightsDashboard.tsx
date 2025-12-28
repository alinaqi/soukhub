'use client';

import { useState, useEffect } from 'react';
import type {
  ActionableInsight,
  WorkflowBottleneck,
  ProductPerformance,
  MarketTrend,
} from '@/lib/actionable-insights';

interface InsightsData {
  insights: ActionableInsight[];
  bottlenecks: WorkflowBottleneck[];
  productPerformance: {
    topPerformers: ProductPerformance[];
    underperformers: ProductPerformance[];
    opportunities: ProductPerformance[];
  };
  marketTrends: MarketTrend[];
  generatedAt: string;
}

export function InsightsDashboard() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'insights' | 'workflow' | 'products' | 'market'>('insights');

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/insights');
      if (!response.ok) throw new Error('Failed to fetch insights');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-muted rounded-lg h-32"></div>
        <div className="animate-pulse bg-muted rounded-lg h-64"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Failed to load insights</p>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchInsights}
          className="mt-2 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const getInsightIcon = (type: ActionableInsight['type']) => {
    switch (type) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'opportunity': return '💡';
      case 'success': return '✅';
    }
  };

  const getInsightColor = (type: ActionableInsight['type']) => {
    switch (type) {
      case 'critical': return 'border-red-300 bg-red-50 text-red-900';
      case 'warning': return 'border-yellow-300 bg-yellow-50 text-yellow-900';
      case 'opportunity': return 'border-blue-300 bg-blue-50 text-blue-900';
      case 'success': return 'border-green-300 bg-green-50 text-green-900';
    }
  };

  const getTrendIcon = (trend: ProductPerformance['trend']) => {
    switch (trend) {
      case 'hot': return '🔥';
      case 'rising': return '📈';
      case 'stable': return '➡️';
      case 'declining': return '📉';
      case 'dead': return '💀';
    }
  };

  const tabs = [
    { id: 'insights', label: 'Action Items', icon: '🎯', count: data.insights.filter(i => i.type === 'critical' || i.type === 'warning').length },
    { id: 'workflow', label: 'Workflow', icon: '⚙️', count: data.bottlenecks.filter(b => b.avgHours > 24).length },
    { id: 'products', label: 'Products', icon: '📦', count: data.productPerformance.topPerformers.length },
    { id: 'market', label: 'Market Trends', icon: '🌍', count: data.marketTrends.length },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Actionable Insights</h2>
          <p className="text-sm text-gray-600">
            Last updated: {new Date(data.generatedAt).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={fetchInsights}
          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-muted transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id
                  ? 'bg-primary-foreground/20'
                  : 'bg-muted'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {/* Action Items Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            {data.insights.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                <p className="text-4xl mb-2">🎉</p>
                <p className="font-medium text-gray-800">All good!</p>
                <p className="text-sm">No critical actions needed right now.</p>
              </div>
            ) : (
              data.insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getInsightIcon(insight.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/50">
                          {insight.category}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{insight.description}</p>
                      {insight.metric && (
                        <p className="text-sm font-medium mt-2">{insight.metric}</p>
                      )}
                      {insight.action && (
                        <div className="mt-3 p-2 bg-white/70 rounded text-sm border border-current/10">
                          <span className="font-medium">💡 Action: </span>
                          {insight.action}
                        </div>
                      )}
                      {insight.impact && (
                        <p className="text-xs opacity-75 mt-2">
                          Impact: {insight.impact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Workflow Tab */}
        {activeTab === 'workflow' && (
          <div className="space-y-6">
            <div className="grid gap-4">
              {data.bottlenecks.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="text-4xl mb-2">⚡</p>
                  <p className="font-medium text-gray-800">Workflow is smooth!</p>
                  <p className="text-sm">No bottlenecks detected in your order processing.</p>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold">Order Processing Stages</h3>
                  {data.bottlenecks.map((bottleneck, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${
                        bottleneck.avgHours > 48
                          ? 'border-red-300 bg-red-50 text-red-900'
                          : bottleneck.avgHours > 24
                          ? 'border-yellow-300 bg-yellow-50 text-yellow-900'
                          : 'border-gray-200 bg-gray-50 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{bottleneck.stage}</h4>
                        <div className="text-right">
                          <span className="text-lg font-bold">
                            {bottleneck.avgHours}h
                          </span>
                          <span className="text-sm opacity-75 ml-1">avg</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <span>{bottleneck.orderCount} orders</span>
                        {/* Progress bar visualization */}
                        <div className="flex-1 h-2 bg-white/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              bottleneck.avgHours > 48 ? 'bg-red-500' :
                              bottleneck.avgHours > 24 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${Math.min((bottleneck.avgHours / 72) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-sm opacity-80">{bottleneck.recommendation}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Top Performers */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span>🏆</span> Top Performers
              </h3>
              {data.productPerformance.topPerformers.length === 0 ? (
                <p className="text-sm text-gray-600">No hot products yet. Keep selling!</p>
              ) : (
                <div className="grid gap-2">
                  {data.productPerformance.topPerformers.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-green-50 border-green-200 text-green-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getTrendIcon(product.trend)}</span>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.recommendation && (
                            <p className="text-xs opacity-75">{product.recommendation}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">AED {product.revenue.toLocaleString()}</p>
                        <p className="text-xs opacity-75">
                          {product.unitsSold} units • {product.velocity}/day
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Underperformers */}
            {data.productPerformance.underperformers.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>📉</span> Need Attention
                </h3>
                <div className="grid gap-2">
                  {data.productPerformance.underperformers.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50 border-yellow-200 text-yellow-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getTrendIcon(product.trend)}</span>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.recommendation && (
                            <p className="text-xs opacity-75">{product.recommendation}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">AED {product.revenue.toLocaleString()}</p>
                        <p className="text-xs opacity-75">
                          {product.unitsSold} units total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities */}
            {data.productPerformance.opportunities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span> Optimization Opportunities
                </h3>
                <div className="grid gap-2">
                  {data.productPerformance.opportunities.slice(0, 5).map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 border-blue-200 text-blue-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">💡</span>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          {product.profitMargin !== undefined && (
                            <p className="text-xs opacity-75">
                              {product.profitMargin}% margin - consider renegotiating with supplier
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">AED {product.revenue.toLocaleString()}</p>
                        <p className="text-xs opacity-75">
                          {product.unitsSold} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Market Trends Tab */}
        {activeTab === 'market' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-900">
                <span className="font-medium">🌍 UAE E-commerce Market Trends</span>
                <br />
                <span className="text-blue-700">
                  General market trends and insights for the UAE region.
                </span>
              </p>
            </div>

            {data.marketTrends.map((trend, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{trend.category}</h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    trend.trend === 'up'
                      ? 'bg-green-100 text-green-800'
                      : trend.trend === 'down'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trend.trend === 'up' ? '↑ Growing' : trend.trend === 'down' ? '↓ Declining' : '→ Stable'}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{trend.description}</p>
                <p className="text-xs text-gray-500 mt-2">Source: {trend.source}</p>
              </div>
            ))}

            <div className="border-t pt-4 mt-4">
              <p className="text-xs text-gray-500 text-center">
                Market trends are updated periodically. Check back for latest insights.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
