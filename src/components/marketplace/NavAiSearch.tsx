'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

/** Compact search in the sticky nav — always reachable while scrolling. Hands
 * the query to the SoukHub AI agent, like the hero search. */
export function NavAiSearch() {
  const t = useTranslations('common');
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('soukhub:ask', { detail: { question: query } }));
  };

  return (
    <form onSubmit={submit} role="search" className="relative hidden flex-1 sm:block sm:max-w-md">
      <Search
        className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('search')}
        className="w-full rounded-lg border border-border bg-card py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}
