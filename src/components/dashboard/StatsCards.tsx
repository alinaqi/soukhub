interface Stats {
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      icon: '📦',
      description: 'All time orders',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders.toLocaleString(),
      icon: '⏳',
      description: 'Need attention',
      highlight: stats.pendingOrders > 0,
    },
    {
      title: 'Revenue',
      value: `AED ${stats.totalRevenue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      icon: '💰',
      description: 'From delivered orders',
    },
    {
      title: 'Products',
      value: stats.totalProducts.toLocaleString(),
      icon: '🏷️',
      description: 'In your catalog',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`rounded-lg border bg-card p-6 ${
            card.highlight ? 'border-warning' : 'border-border'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-2xl">{card.icon}</span>
            {card.highlight && (
              <span className="px-2 py-1 text-xs font-medium bg-warning/10 text-warning rounded-full">
                Action needed
              </span>
            )}
          </div>
          <div className="text-2xl font-bold">{card.value}</div>
          <div className="text-sm text-muted-foreground">{card.title}</div>
          <div className="text-xs text-muted-foreground mt-1">{card.description}</div>
        </div>
      ))}
    </div>
  );
}
