'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Search, Clock } from 'lucide-react';
import {
  KNOWLEDGE_CATEGORIES,
  type KnowledgeArticle,
  type KnowledgeCategory,
} from '@/lib/knowledge/types';

type ArticleMeta = Omit<KnowledgeArticle, 'body'>;

export function KnowledgeIndexClient({ articles }: { articles: ArticleMeta[] }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<KnowledgeCategory | 'all'>('all');

  const q = query.trim().toLowerCase();
  const filtered = articles.filter((a) => {
    if (category !== 'all' && a.category !== category) return false;
    if (!q) return true;
    return `${a.title} ${a.summary}`.toLowerCase().includes(q);
  });

  const grouped = Object.entries(KNOWLEDGE_CATEGORIES)
    .map(([key, meta]) => ({
      key: key as KnowledgeCategory,
      meta,
      items: filtered.filter((a) => a.category === key),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="h-6 w-6 text-primary" aria-hidden />
          Knowledge Center
        </h1>
        <p className="mt-1 text-muted-foreground">
          Practical guides for sourcing, fulfilment, pricing, and growing your store.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides…"
            className="w-full rounded-lg border border-border bg-card py-2.5 ps-9 pe-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('all')}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
              category === 'all' ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'
            }`}
          >
            All
          </button>
          {Object.entries(KNOWLEDGE_CATEGORIES).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setCategory(key as KnowledgeCategory)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                category === key ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-muted'
              }`}
            >
              {meta.icon} {meta.label}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <p className="rounded-xl border border-border p-8 text-center text-muted-foreground">
          No guides match “{query}”.
        </p>
      )}

      {grouped.map(({ key, meta, items }) => (
        <section key={key}>
          <h2 className="text-lg font-semibold">
            {meta.icon} {meta.label}
          </h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((article) => (
              <Link
                key={article.slug}
                href={`/knowledge/${article.slug}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <h3 className="font-semibold leading-snug group-hover:text-primary">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{article.summary}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {article.minutes} min read
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
