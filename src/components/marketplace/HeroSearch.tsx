'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';

/** Home hero search — always AI-powered: submitting (Enter or the Search
 * button) hands the query to the SoukHub agent drawer. */
export function HeroSearch({ placeholder, searchLabel }: { placeholder: string; searchLabel: string }) {
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('soukhub:ask', { detail: { question: query } }));
  };

  return (
    <form id="hero-search" onSubmit={submit} className="mx-auto mt-8 flex max-w-xl items-center gap-2" role="search">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-card py-3 ps-10 pe-4 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground hover:bg-primary-hover"
      >
        {searchLabel}
      </button>
    </form>
  );
}
