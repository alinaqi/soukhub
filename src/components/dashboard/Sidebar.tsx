'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Profile } from '@/types/supabase';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/operations', label: 'Operations', icon: '⚡' },
  { href: '/orders', label: 'Orders', icon: '📦' },
  { href: '/packing', label: 'Packing', icon: '📦' },
  { href: '/shipping', label: 'Shipping', icon: '🚚' },
  { href: '/inventory', label: 'Inventory', icon: '📋' },
  { href: '/suppliers', label: 'Suppliers', icon: '🤝' },
  { href: '/products', label: 'Products', icon: '🏷️' },
  { href: '/analytics', label: 'Analytics', icon: '📈' },
  { href: '/import', label: 'Import Data', icon: '📥' },
  { href: '/settings/workflow', label: 'Workflow', icon: '⚙️' },
  { href: '/settings/team', label: 'Team', icon: '👥' },
];

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">SoukHub</h1>
        <p className="text-sm text-muted-foreground truncate">{profile.business_name}</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
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
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="rounded-lg bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🤖</span>
            <span className="font-medium text-sm">AI Assistant</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Click the chat button in the bottom right to get insights and manage your orders with AI
          </p>
        </div>
      </div>
    </aside>
  );
}
