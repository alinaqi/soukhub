'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface QuickAction {
  id: string;
  icon: string;
  label: string;
  description: string;
  action: () => void;
  keywords: string[];
}

interface CommandBarProps {
  userId: string;
}

export function CommandBar({ userId }: CommandBarProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Navigation actions
  const navigationActions: QuickAction[] = [
    {
      id: 'dashboard',
      icon: '📊',
      label: 'Go to Dashboard',
      description: 'View your dashboard overview',
      action: () => router.push('/dashboard'),
      keywords: ['home', 'main', 'overview'],
    },
    {
      id: 'orders',
      icon: '📦',
      label: 'Go to Orders',
      description: 'Manage your orders',
      action: () => router.push('/orders'),
      keywords: ['order', 'purchase', 'sales'],
    },
    {
      id: 'operations',
      icon: '⚡',
      label: 'Go to Operations',
      description: 'Daily operations pipeline',
      action: () => router.push('/operations'),
      keywords: ['ops', 'daily', 'pipeline'],
    },
    {
      id: 'packing',
      icon: '✅',
      label: 'Go to Packing Station',
      description: 'Pack orders for shipping',
      action: () => router.push('/packing'),
      keywords: ['pack', 'box', 'prepare'],
    },
    {
      id: 'shipping',
      icon: '🚚',
      label: 'Go to Shipping',
      description: 'Ship packed orders',
      action: () => router.push('/shipping'),
      keywords: ['ship', 'deliver', 'courier'],
    },
    {
      id: 'customers',
      icon: '👥',
      label: 'Go to Customers',
      description: 'View customer list and intelligence',
      action: () => router.push('/customers'),
      keywords: ['customer', 'buyer', 'client', 'vip'],
    },
    {
      id: 'suppliers',
      icon: '🤝',
      label: 'Go to Suppliers',
      description: 'Manage your suppliers',
      action: () => router.push('/suppliers'),
      keywords: ['supplier', 'vendor', 'source'],
    },
    {
      id: 'products',
      icon: '🏷️',
      label: 'Go to Products',
      description: 'Manage your product catalog',
      action: () => router.push('/products'),
      keywords: ['product', 'item', 'sku'],
    },
    {
      id: 'inventory',
      icon: '📋',
      label: 'Go to Inventory',
      description: 'Check stock levels',
      action: () => router.push('/inventory'),
      keywords: ['stock', 'quantity', 'level'],
    },
    {
      id: 'analytics',
      icon: '📈',
      label: 'Go to Analytics',
      description: 'View sales analytics and trends',
      action: () => router.push('/analytics'),
      keywords: ['report', 'stats', 'trend', 'sales'],
    },
    {
      id: 'import',
      icon: '📥',
      label: 'Import Data',
      description: 'Import orders from CSV/Excel',
      action: () => router.push('/import'),
      keywords: ['upload', 'csv', 'excel', 'file'],
    },
    {
      id: 'workflow',
      icon: '⚙️',
      label: 'Workflow Settings',
      description: 'Configure order routing rules',
      action: () => router.push('/settings/workflow'),
      keywords: ['settings', 'config', 'rule', 'routing'],
    },
    {
      id: 'team',
      icon: '🧑‍🤝‍🧑',
      label: 'Team Management',
      description: 'Manage team members and roles',
      action: () => router.push('/settings/team'),
      keywords: ['user', 'member', 'staff', 'packer'],
    },
  ];

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'sync-customers',
      icon: '🔄',
      label: 'Sync Customers from Orders',
      description: 'Extract customer data from existing orders',
      action: async () => {
        setIsLoading(true);
        try {
          await fetch('/api/customers/sync-from-orders', { method: 'POST' });
          setAiResponse('✅ Customers synced successfully!');
        } catch {
          setAiResponse('❌ Failed to sync customers');
        } finally {
          setIsLoading(false);
        }
      },
      keywords: ['sync', 'extract', 'customer'],
    },
    {
      id: 'add-product',
      icon: '➕',
      label: 'Add New Product',
      description: 'Quick add a product to your catalog',
      action: () => {
        router.push('/products');
        setTimeout(() => {
          document.querySelector<HTMLButtonElement>('[data-add-product]')?.click();
        }, 500);
      },
      keywords: ['new', 'create', 'add', 'product'],
    },
    {
      id: 'add-supplier',
      icon: '➕',
      label: 'Add New Supplier',
      description: 'Add a new supplier',
      action: () => {
        router.push('/suppliers');
        setTimeout(() => {
          document.querySelector<HTMLButtonElement>('[data-add-supplier]')?.click();
        }, 500);
      },
      keywords: ['new', 'create', 'add', 'supplier'],
    },
  ];

  const allActions = [...navigationActions, ...quickActions];

  // Filter actions based on query
  const filteredActions = query.trim()
    ? allActions.filter((action) => {
        const searchLower = query.toLowerCase();
        return (
          action.label.toLowerCase().includes(searchLower) ||
          action.description.toLowerCase().includes(searchLower) ||
          action.keywords.some((k) => k.includes(searchLower))
        );
      })
    : allActions.slice(0, 6); // Show first 6 when no query

  // Detect if query is a natural language question
  const isQuestion =
    query.length > 10 &&
    (query.includes('?') ||
      query.toLowerCase().startsWith('how') ||
      query.toLowerCase().startsWith('what') ||
      query.toLowerCase().startsWith('show') ||
      query.toLowerCase().startsWith('find') ||
      query.toLowerCase().startsWith('get') ||
      query.toLowerCase().startsWith('list') ||
      query.toLowerCase().startsWith('which') ||
      query.toLowerCase().startsWith('why') ||
      query.toLowerCase().startsWith('tell'));

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setAiResponse(null);
    setSelectedIndex(0);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredActions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isQuestion) {
        handleAIQuery();
      } else if (filteredActions[selectedIndex]) {
        executeAction(filteredActions[selectedIndex]);
      }
    }
  };

  const executeAction = (action: QuickAction) => {
    action.action();
    if (!action.id.startsWith('sync')) {
      handleClose();
    }
  };

  const handleAIQuery = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setAiResponse(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setAiResponse(data.response || data.message);
      } else {
        setAiResponse('Sorry, I could not process that request.');
      }
    } catch {
      setAiResponse('Failed to connect to AI. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Command Bar Modal */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-2xl px-4">
        <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <span className="text-xl">
              {isLoading ? (
                <span className="animate-spin inline-block">⟳</span>
              ) : (
                '🔍'
              )}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search, navigate, or ask AI anything..."
              className="flex-1 bg-transparent text-lg outline-none placeholder:text-muted-foreground"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="px-2 py-1 text-xs font-medium bg-muted border border-border rounded">
              ESC
            </kbd>
          </div>

          {/* AI Response */}
          {aiResponse && (
            <div className="p-4 border-b border-border bg-primary/5">
              <div className="flex items-start gap-3">
                <span className="text-xl">🤖</span>
                <div className="flex-1 prose prose-sm dark:prose-invert max-w-none">
                  <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions / Results */}
          <div ref={resultsRef} className="max-h-[400px] overflow-y-auto p-2">
            {isQuestion && !aiResponse ? (
              <div className="p-4 text-center">
                <button
                  onClick={handleAIQuery}
                  disabled={isLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  <span>🤖</span>
                  <span>{isLoading ? 'Thinking...' : 'Ask AI'}</span>
                </button>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter or click to ask AI
                </p>
              </div>
            ) : filteredActions.length > 0 ? (
              <>
                {!aiResponse && (
                  <div className="px-3 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {query ? 'Results' : 'Quick Actions'}
                  </div>
                )}
                {filteredActions.map((action, index) => (
                  <button
                    key={action.id}
                    onClick={() => executeAction(action)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-xl">{action.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{action.label}</div>
                      <div
                        className={`text-xs truncate ${
                          index === selectedIndex
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {action.description}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <kbd className="px-2 py-0.5 text-[10px] bg-primary-foreground/20 rounded">
                        ↵
                      </kbd>
                    )}
                  </button>
                ))}
              </>
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <p className="mb-2">No results found</p>
                <p className="text-sm">
                  Try asking a question or use different keywords
                </p>
              </div>
            )}
          </div>

          {/* Footer Hints */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">
                  ↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border border-border rounded">
                  ↵
                </kbd>
                Select
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span>💡</span>
              <span>Type a question to ask AI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
