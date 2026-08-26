'use client';

import { Sparkles } from 'lucide-react';

/** Hands the hero question to the AI agent drawer ("What do you need?"). */
export function AskAiButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const form = (e.currentTarget as HTMLButtonElement).form;
        const q = (form?.elements.namedItem('q') as HTMLInputElement | null)?.value ?? '';
        window.dispatchEvent(new CustomEvent('soukhub:ask', { detail: { question: q } }));
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-4 py-3 font-semibold text-primary hover:bg-primary/5"
    >
      <Sparkles className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
