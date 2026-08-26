import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, BookOpen } from 'lucide-react';
import { KNOWLEDGE_ARTICLES } from '@/lib/knowledge/articles';
import { KNOWLEDGE_CATEGORIES } from '@/lib/knowledge/types';
import { renderMarkdown } from '@/lib/knowledge/markdown';

export function generateStaticParams() {
  return KNOWLEDGE_ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
  return article ? { title: article.title } : {};
}

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = KNOWLEDGE_ARTICLES.find((a) => a.slug === slug);
  if (!article) notFound();

  const categoryMeta = KNOWLEDGE_CATEGORIES[article.category];
  const related = KNOWLEDGE_ARTICLES.filter(
    (a) => a.category === article.category && a.slug !== article.slug
  ).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/knowledge"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        Knowledge Center
      </Link>

      <p className="mt-6 text-sm font-medium text-primary">
        {categoryMeta.icon} {categoryMeta.label}
      </p>
      <h1 className="mt-1 text-3xl font-bold leading-tight" style={{ textWrap: 'balance' }}>
        {article.title}
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" aria-hidden />
        {article.minutes} min read
      </p>

      <article className="mt-4 border-t border-border pt-2">
        {renderMarkdown(article.body)}
      </article>

      {related.length > 0 && (
        <aside className="mt-12 rounded-xl border border-border bg-surface-warm p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden />
            Keep reading
          </h2>
          <ul className="mt-3 space-y-2">
            {related.map((a) => (
              <li key={a.slug}>
                <Link href={`/knowledge/${a.slug}`} className="text-sm font-medium text-primary hover:underline">
                  {a.title}
                </Link>
                <span className="ms-2 text-xs text-muted-foreground">{a.minutes} min</span>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
