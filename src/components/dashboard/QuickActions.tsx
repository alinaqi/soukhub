import Link from 'next/link';

export function QuickActions() {
  const actions = [
    {
      icon: '📥',
      title: 'Import Orders',
      description: 'Upload CSV/TSV from marketplaces',
      href: '/import',
      color: 'bg-blue-500/10 text-blue-600',
    },
    {
      icon: '📦',
      title: 'View All Orders',
      description: 'Manage and track orders',
      href: '/orders',
      color: 'bg-green-500/10 text-green-600',
    },
    {
      icon: '🏷️',
      title: 'Manage Products',
      description: 'View your product catalog',
      href: '/products',
      color: 'bg-purple-500/10 text-purple-600',
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'View sales insights',
      href: '/analytics',
      color: 'bg-orange-500/10 text-orange-600',
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <span>⚡</span>
          Quick Actions
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
              <span className="text-lg">{action.icon}</span>
            </div>
            <div className="min-w-0">
              <div className="font-medium text-sm">{action.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {action.description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
