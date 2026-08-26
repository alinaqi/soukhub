import type { ReactNode } from 'react';
import Link from 'next/link';

/**
 * Minimal, dependency-free markdown renderer for knowledge articles.
 * Supports: ## / ### headings, - and 1. lists, **bold**, [text](href),
 * > callouts, and paragraphs. Content is authored in-repo (trusted),
 * but links still render through next/link or plain anchors — no raw HTML.
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={`${keyPrefix}-${i}`}>{bold[1]}</strong>;
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const href = link[2];
      return href.startsWith('/') ? (
        <Link key={`${keyPrefix}-${i}`} href={href} className="font-medium text-primary underline underline-offset-2">
          {link[1]}
        </Link>
      ) : (
        <a key={`${keyPrefix}-${i}`} href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
          {link[1]}
        </a>
      );
    }
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export function renderMarkdown(body: string): ReactNode[] {
  const blocks = body.trim().split(/\n\s*\n/);
  return blocks.map((block, bi) => {
    const trimmed = block.trim();
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={bi} className="mt-8 text-base font-semibold">
          {renderInline(trimmed.slice(4), `h3-${bi}`)}
        </h3>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={bi} className="mt-10 text-xl font-bold">
          {renderInline(trimmed.slice(3), `h2-${bi}`)}
        </h2>
      );
    }
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote
          key={bi}
          className="mt-4 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-relaxed"
        >
          {renderInline(trimmed.replace(/^> /gm, '').replace(/\n/g, ' '), `q-${bi}`)}
        </blockquote>
      );
    }
    const lines = trimmed.split('\n');
    if (lines.every((l) => /^- /.test(l))) {
      return (
        <ul key={bi} className="mt-4 list-disc space-y-1.5 ps-5 text-sm leading-relaxed">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.slice(2), `ul-${bi}-${li}`)}</li>
          ))}
        </ul>
      );
    }
    if (lines.every((l) => /^\d+\. /.test(l))) {
      return (
        <ol key={bi} className="mt-4 list-decimal space-y-1.5 ps-5 text-sm leading-relaxed">
          {lines.map((l, li) => (
            <li key={li}>{renderInline(l.replace(/^\d+\. /, ''), `ol-${bi}-${li}`)}</li>
          ))}
        </ol>
      );
    }
    return (
      <p key={bi} className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {renderInline(trimmed.replace(/\n/g, ' '), `p-${bi}`)}
      </p>
    );
  });
}
