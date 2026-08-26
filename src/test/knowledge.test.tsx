import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KNOWLEDGE_ARTICLES } from '@/lib/knowledge/articles';
import { KNOWLEDGE_CATEGORIES } from '@/lib/knowledge/types';
import { renderMarkdown } from '@/lib/knowledge/markdown';

describe('knowledge registry integrity', () => {
  it('has unique slugs and valid categories', () => {
    const slugs = KNOWLEDGE_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of KNOWLEDGE_ARTICLES) {
      expect(Object.keys(KNOWLEDGE_CATEGORIES)).toContain(a.category);
      expect(a.slug).toMatch(/^[a-z0-9-]+$/);
      expect(a.body.trim().length).toBeGreaterThan(400);
      expect(a.summary.length).toBeGreaterThan(10);
      expect(a.minutes).toBeGreaterThan(0);
    }
  });

  it('covers procurement and order handling as requested', () => {
    const categories = new Set(KNOWLEDGE_ARTICLES.map((a) => a.category));
    expect(categories.has('procurement')).toBe(true);
    expect(categories.has('orders')).toBe(true);
    expect(KNOWLEDGE_ARTICLES.length).toBeGreaterThanOrEqual(8);
  });

  it('internal links point at real console routes', () => {
    const valid = /^\/(dashboard|orders|packing|shipping|products|inventory|suppliers|customers|communications|requests|analytics|import|settings\/|knowledge|search|trade-in)/;
    for (const a of KNOWLEDGE_ARTICLES) {
      for (const m of a.body.matchAll(/\]\((\/[^)]+)\)/g)) {
        expect(m[1], `${a.slug} links ${m[1]}`).toMatch(valid);
      }
    }
  });
});

describe('renderMarkdown', () => {
  it('renders headings, lists, bold, links and callouts', () => {
    render(
      <div>
        {renderMarkdown(
          '## Heading Two\n\nA paragraph with **bold** and a [link](/orders).\n\n- item one\n- item two\n\n1. first\n2. second\n\n> A callout note.'
        )}
      </div>
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Heading Two' })).toBeInTheDocument();
    expect(screen.getByText('bold').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: 'link' })).toHaveAttribute('href', '/orders');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('A callout note.')).toBeInTheDocument();
  });

  it('every article renders without throwing', () => {
    for (const a of KNOWLEDGE_ARTICLES) {
      expect(() => render(<div>{renderMarkdown(a.body)}</div>)).not.toThrow();
    }
  });
});
