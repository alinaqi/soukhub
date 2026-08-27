'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';

/** Compact search in the sticky nav — reveals only once the hero search
 * (#hero-search) scrolls out of view, so it isn't redundant at the top.
 * Hands the query to the SoukHub AI agent, like the hero search. */
export function NavAiSearch() {
  const t = useTranslations('common');
  const [query, setQuery] = useState('');
  // Visible by default: if there's no hero search on the page, always show it.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const hero = document.getElementById('hero-search');
    if (!hero || typeof IntersectionObserver === 'undefined') return; // no hero / unsupported → stays visible
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hide until the hero search scrolls away
    setVisible(false);
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '-8px 0px 0px 0px' }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('soukhub:ask', { detail: { question: query } }));
  };

  return (
    <form
      onSubmit={submit}
      role="search"
      aria-hidden={!visible}
      className={`relative hidden flex-1 transition-all duration-200 sm:block sm:max-w-md ${
        visible ? 'opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
      }`}
    >
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
        tabIndex={visible ? 0 : -1}
        className="w-full rounded-lg border border-border bg-card py-2 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </form>
  );
}
