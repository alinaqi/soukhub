import Link from 'next/link';
import type { MarketplaceConnection } from '@/types/supabase';

interface MarketplaceBreakdownProps {
  connections: MarketplaceConnection[];
}

const MARKETPLACE_INFO: Record<string, { icon: string; color: string }> = {
  amazon: { icon: '📦', color: 'bg-orange-500' },
  cartlow: { icon: '🛒', color: 'bg-green-500' },
  revibe: { icon: '📱', color: 'bg-blue-500' },
  noon: { icon: '🌙', color: 'bg-yellow-500' },
  other: { icon: '🏪', color: 'bg-gray-500' },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Connected', color: 'text-green-600' },
  pending: { label: 'Setup Required', color: 'text-yellow-600' },
  error: { label: 'Error', color: 'text-red-600' },
  disconnected: { label: 'Disconnected', color: 'text-gray-600' },
};

export function MarketplaceBreakdown({ connections }: MarketplaceBreakdownProps) {
  if (connections.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Your Marketplaces</h3>
        <div className="text-center py-4">
          <span className="text-4xl mb-4 block">🏪</span>
          <p className="text-sm text-muted-foreground mb-4">
            No marketplaces connected yet
          </p>
          <Link
            href="/onboarding"
            className="text-sm text-primary hover:underline"
          >
            Add marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Your Marketplaces</h3>
      <div className="space-y-4">
        {connections.map((connection) => {
          const info = MARKETPLACE_INFO[connection.marketplace] || MARKETPLACE_INFO.other;
          const status = STATUS_LABELS[connection.status] || STATUS_LABELS.pending;

          return (
            <div
              key={connection.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div
                className={`w-10 h-10 rounded-lg ${info.color} flex items-center justify-center text-xl`}
              >
                {info.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{connection.display_name}</div>
                <div className={`text-xs ${status.color}`}>{status.label}</div>
              </div>
              {connection.status === 'pending' && (
                <button className="text-xs text-primary hover:underline">
                  Setup
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <Link
          href="/import"
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-border p-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
        >
          <span>📥</span>
          Import orders from file
        </Link>
      </div>
    </div>
  );
}
