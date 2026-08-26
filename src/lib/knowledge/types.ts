export const KNOWLEDGE_CATEGORIES = {
  'getting-started': { label: 'Getting Started', icon: '🚀' },
  procurement: { label: 'Procurement & Sourcing', icon: '📦' },
  orders: { label: 'Orders & Fulfillment', icon: '🚚' },
  pricing: { label: 'Pricing & Trade-ins', icon: '💰' },
  growth: { label: 'Growing Your Store', icon: '📈' },
} as const;

export type KnowledgeCategory = keyof typeof KNOWLEDGE_CATEGORIES;

export interface KnowledgeArticle {
  slug: string;
  title: string;
  category: KnowledgeCategory;
  summary: string;
  minutes: number;
  /** Markdown body (##/### headings, lists, **bold**, [links](...)) */
  body: string;
}
