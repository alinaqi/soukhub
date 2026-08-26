import type { Metadata } from 'next';
import { KnowledgeIndexClient } from '@/components/dashboard/KnowledgeIndexClient';
import { KNOWLEDGE_ARTICLES } from '@/lib/knowledge/articles';

export const metadata: Metadata = {
  title: 'Knowledge Center',
};

export default function KnowledgePage() {
  const articles = KNOWLEDGE_ARTICLES.map(({ body, ...meta }) => {
    void body; // index ships metadata only
    return meta;
  });
  return <KnowledgeIndexClient articles={articles} />;
}
