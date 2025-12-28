'use client';

import { useState, useEffect } from 'react';
import type {
  ActionableInsight,
  WorkflowBottleneck,
  ProductPerformance,
  MarketTrend,
  ProductRecommendation,
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

// Market Trends Tab Component
function MarketTrendsTab({ trends }: { trends: MarketTrend[] }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  const getSearchVolumeLabel = (volume: MarketTrend['searchVolume']) => {
    switch (volume) {
      case 'very_high': return { label: 'Very High', color: 'bg-green-100 text-green-800' };
      case 'high': return { label: 'High', color: 'bg-blue-100 text-blue-800' };
      case 'medium': return { label: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
      case 'low': return { label: 'Low', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getDemandColor = (level: ProductRecommendation['demandLevel']) => {
    switch (level) {
      case 'high': return 'text-green-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-gray-600';
    }
  };

  const getCompetitionColor = (level: ProductRecommendation['competition']) => {
    switch (level) {
      case 'high': return 'text-red-700';
      case 'medium': return 'text-yellow-700';
      case 'low': return 'text-green-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with methodology toggle */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-blue-900 font-medium">🌍 UAE E-commerce Market Trends</p>
            <p className="text-sm text-blue-700 mt-1">
              Curated insights on trending products and categories in the UAE market.
            </p>
          </div>
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="text-xs text-blue-600 hover:text-blue-800 underline whitespace-nowrap ml-4"
          >
            {showMethodology ? 'Hide methodology' : 'How we get this data'}
          </button>
        </div>

        {showMethodology && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">📊 Data Methodology</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• <strong>Marketplace Analysis:</strong> Amazon.ae, Noon, Namshi bestseller rankings and category trends</li>
              <li>• <strong>Search Trends:</strong> Google Trends UAE data for product-specific queries</li>
              <li>• <strong>Industry Reports:</strong> Statista, Euromonitor, Dubai Chamber of Commerce publications</li>
              <li>• <strong>Social Listening:</strong> TikTok Shop, Instagram shopping trends in UAE/GCC</li>
              <li>• <strong>Import Data:</strong> UAE customs and trade data for category volumes</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2 italic">
              Note: Product recommendations are guidance only. Always validate with your own supplier research and market testing.
            </p>
          </div>
        )}
      </div>

      {/* Trend Cards */}
      {trends.map((trend, index) => {
        const isExpanded = expandedCategory === trend.category;
        const searchVolume = getSearchVolumeLabel(trend.searchVolume);

        return (
          <div
            key={index}
            className="border rounded-lg overflow-hidden"
          >
            {/* Trend Header - clickable */}
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : trend.category)}
              className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <h4 className="font-semibold text-gray-900">{trend.category}</h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    trend.trend === 'up'
                      ? 'bg-green-100 text-green-800'
                      : trend.trend === 'down'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {trend.trend === 'up' ? `↑ +${trend.trendPercentage || ''}%` : trend.trend === 'down' ? '↓ Declining' : '→ Stable'}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${searchVolume.color}`}>
                    🔍 {searchVolume.label}
                  </span>
                </div>
                <span className="text-gray-400 text-lg">{isExpanded ? '−' : '+'}</span>
              </div>
              <p className="text-sm text-gray-700">{trend.description}</p>
              {trend.seasonality && (
                <p className="text-xs text-gray-500 mt-2">
                  📅 <strong>Seasonality:</strong> {trend.seasonality}
                </p>
              )}
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t bg-gray-50 p-4">
                {/* Product Recommendations */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <span>💡</span> Recommended Products to Consider
                  </h5>
                  <div className="grid gap-3">
                    {trend.productRecommendations.map((product, pIndex) => (
                      <div
                        key={pIndex}
                        className="bg-white border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h6 className="font-medium text-gray-900">{product.name}</h6>
                          <div className="flex gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded ${getDemandColor(product.demandLevel)} bg-opacity-10`}>
                              Demand: {product.demandLevel}
                            </span>
                            <span className={`px-2 py-0.5 rounded ${getCompetitionColor(product.competition)} bg-opacity-10`}>
                              Competition: {product.competition}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                          <div>
                            <span className="text-gray-500">Price Range:</span>{' '}
                            <span className="font-medium text-gray-800">{product.priceRange}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Typical Margin:</span>{' '}
                            <span className="font-medium text-green-700">{product.margin}</span>
                          </div>
                        </div>
                        <div className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2 text-yellow-800">
                          <span className="font-medium">💡 Tip:</span> {product.tip}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Source & Methodology */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      <strong>Source:</strong>{' '}
                      {trend.sourceUrl ? (
                        <a href={trend.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {trend.source}
                        </a>
                      ) : (
                        trend.source
                      )}
                    </div>
                    <div>Updated: {trend.updatedAt}</div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    <strong>Methodology:</strong> {trend.methodology}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Footer */}
      <div className="border-t pt-4 mt-4">
        <p className="text-xs text-gray-500 text-center">
          Market trends updated daily. Product recommendations are guidance only — always validate before sourcing.
        </p>
      </div>
    </div>
  );
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
          <MarketTrendsTab trends={data.marketTrends} />
        )}
      </div>
    </div>
  );
}
