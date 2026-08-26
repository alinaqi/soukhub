'use client';

import { useRef, useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Sparkles, X, Send } from 'lucide-react';
import { safeInternalPath } from '@/lib/marketplace/format';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

/** Render minimal markdown links from the assistant as real anchors. */
function renderContent(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    const safe = m ? safeInternalPath(m[2]) : null;
    if (m && safe) {
      return (
        <a key={i} href={safe} className="font-medium text-primary underline">
          {m[1]}
        </a>
      );
    }
    return <span key={i}>{m ? m[1] : part}</span>;
  });
}

export function AssistantWidget() {
  const t = useTranslations('assistant');
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [turns, busy]);

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    const next: Turn[] = [...turns, { role: 'user', content }];
    setTurns(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      setTurns([...next, { role: 'assistant', content: res.ok ? data.reply : t('error') }]);
    } catch {
      setTurns([...next, { role: 'assistant', content: t('error') }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg hover:bg-primary-hover"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {t('open')}
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 end-5 z-40 flex h-[520px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-surface-warm px-4 py-3">
            <span className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              {t('title')}
            </span>
            <button onClick={() => setOpen(false)} aria-label="close" className="rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
            <div className="max-w-[85%] rounded-xl rounded-ss-sm bg-muted px-3 py-2">{t('hello')}</div>
            {turns.map((turn, i) => (
              <div
                key={i}
                className={
                  turn.role === 'user'
                    ? 'ms-auto max-w-[85%] rounded-xl rounded-se-sm bg-primary px-3 py-2 text-primary-foreground'
                    : 'max-w-[85%] whitespace-pre-wrap rounded-xl rounded-ss-sm bg-muted px-3 py-2'
                }
              >
                {turn.role === 'assistant' ? renderContent(turn.content) : turn.content}
              </div>
            ))}
            {busy && <div className="max-w-[85%] rounded-xl bg-muted px-3 py-2 text-muted-foreground">{t('thinking')}</div>}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border p-3"
            onSubmit={(e) => { e.preventDefault(); void send(); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t('send')}
              className="rounded-lg bg-primary p-2.5 text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
            >
              <Send className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
