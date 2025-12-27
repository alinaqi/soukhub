'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Profile } from '@/types/supabase';

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: string }[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '📊' },
      { href: '/operations', label: 'Operations', icon: '⚡' },
    ],
  },
  {
    label: 'Fulfillment',
    items: [
      { href: '/orders', label: 'Orders', icon: '📦' },
      { href: '/packing', label: 'Packing', icon: '✅' },
      { href: '/shipping', label: 'Shipping', icon: '🚚' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/products', label: 'Products', icon: '🏷️' },
      { href: '/inventory', label: 'Inventory', icon: '📋' },
    ],
  },
  {
    label: 'People',
    items: [
      { href: '/customers', label: 'Customers', icon: '👥' },
      { href: '/suppliers', label: 'Suppliers', icon: '🤝' },
      { href: '/communications', label: 'Communications', icon: '💬' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/analytics', label: 'Analytics', icon: '📈' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { href: '/import', label: 'Import Data', icon: '📥' },
      { href: '/settings/workflow', label: 'Workflow', icon: '⚙️' },
      { href: '/settings/team', label: 'Team', icon: '🧑‍🤝‍🧑' },
    ],
  },
];

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🏪</span>
          <div>
            <h1 className="text-lg font-bold">SoukHub</h1>
            <p className="text-xs text-muted-foreground truncate max-w-[160px]">
              {profile.business_name}
            </p>
          </div>
        </Link>
      </div>

      {/* Command Bar Trigger */}
      <div className="px-3 py-2">
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border transition-colors"
        >
          <span>🔍</span>
          <span className="flex-1 text-left">Search or ask AI...</span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-background border border-border rounded">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Quick Stats */}
      <div className="p-3 border-t border-border">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-lg font-bold">--</div>
            <div className="text-[10px] text-muted-foreground">Today&apos;s Orders</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2">
            <div className="text-lg font-bold">--</div>
            <div className="text-[10px] text-muted-foreground">To Ship</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
