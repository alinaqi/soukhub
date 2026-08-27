'use client';

import { useRef, useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useSearchParams } from 'next/navigation';
import { Sparkles, X, Send, ImageOff, ArrowRight } from 'lucide-react';
import { safeInternalPath, formatAED } from '@/lib/marketplace/format';

interface AssistantProduct {
  title: string;
  price: number | null;
  condition?: string | null;
  source?: string | null;
  store?: string | null;
  link: string;
  image: string | null;
}

interface Turn {
  role: 'user' | 'assistant';
  content: string;
  products?: AssistantProduct[];
}

/** Render minimal markdown (links + bold) from the assistant safely. */
function renderContent(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const safe = safeInternalPath(link[2]);
      return safe ? (
        <a key={i} href={safe} className="font-medium text-primary underline underline-offset-2">
          {link[1]}
        </a>
      ) : (
        <span key={i}>{link[1]}</span>
      );
    }
    const bold = /^\*\*([^*]+)\*\*$/.exec(part);
    if (bold) return <strong key={i}>{bold[1]}</strong>;
    return <span key={i}>{part}</span>;
  });
}

function ProductRow({ product, locale }: { product: AssistantProduct; locale: string }) {
  const safe = safeInternalPath(product.link);
  if (!safe) return null;
  const meta = [product.condition?.replace('_', ' '), product.store ?? product.source]
    .filter(Boolean)
    .join(' · ');
  return (
    <a
      href={safe}
      className="group flex items-center gap-3 rounded-xl border border-border bg-background p-2.5 transition-colors hover:border-primary"
    >
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <ImageOff className="h-5 w-5 text-muted-foreground" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-xs font-medium leading-snug">{product.title}</span>
        {meta && <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{meta}</span>}
      </span>
      <span className="shrink-0 text-end">
        {product.price != null && (
          <span className="block text-sm font-bold text-accent">
            {formatAED(product.price, locale)}
          </span>
        )}
        <ArrowRight
          className="ms-auto mt-1 h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </span>
    </a>
  );
}

function suggestionGroup(pathname: string): 'home' | 'search' | 'product' | 'tradein' | 'sell' {
  const path = pathname.replace(/^\/ar(?=\/|$)/, '') || '/';
  if (path.startsWith('/p/') || path.startsWith('/m/')) return 'product';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/trade-in')) return 'tradein';
  if (path.startsWith('/sell')) return 'sell';
  return 'home';
}

export function AssistantWidget() {
  const t = useTranslations('assistant');
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const group = suggestionGroup(pathname);
  let suggestions: string[] = [];
  try {
    const raw = t.raw(`suggestions.${group}`);
    if (Array.isArray(raw)) suggestions = raw.map(String).slice(0, 3);
  } catch {
    // suggestions are decorative — never break the widget
  }
  const pageContext = searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname;
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [turns, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // "What do you need?" entry points elsewhere (home hero) hand their
  // question to the agent through this event
  useEffect(() => {
    const onAsk = (e: Event) => {
      const question = String((e as CustomEvent).detail?.question ?? '').slice(0, 500);
      setOpen(true);
      if (question) void send(question);
    };
    window.addEventListener('soukhub:ask', onAsk);
    return () => window.removeEventListener('soukhub:ask', onAsk);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns, busy]);

  const send = async (preset?: string) => {
    const content = (preset ?? input).trim();
    if (!content || busy) return;
    const next: Turn[] = [...turns, { role: 'user', content }];
    setTurns(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.map(({ role, content }) => ({ role, content })),
          page: pageContext,
        }),
      });
      const data = await res.json();
      setTurns([
        ...next,
        res.ok
          ? { role: 'assistant', content: data.reply, products: data.products ?? [] }
          : { role: 'assistant', content: t('error') },
      ]);
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
          className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground shadow-lg transition-transform hover:scale-105 hover:bg-primary-hover"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
          {t('open')}
        </button>
      )}

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-foreground/25 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Side drawer */}
      <aside
        role="dialog"
        aria-label={t('title')}
        className={`fixed inset-y-0 end-0 z-50 flex w-full max-w-[420px] flex-col border-s border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full rtl:-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-surface-warm px-5 py-4">
          <span className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="h-4.5 w-4.5" aria-hidden />
            </span>
            <span>
              <span className="block font-bold leading-tight">{t('title')}</span>
              <span className="block text-xs text-muted-foreground">{t('subtitle')}</span>
            </span>
          </span>
          <button
            onClick={() => setOpen(false)}
            aria-label="close"
            className="rounded-lg p-2 hover:bg-muted"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 text-sm">
          <div className="max-w-[90%] rounded-2xl rounded-ss-md bg-muted px-4 py-3 leading-relaxed">
            {t('hello')}
          </div>
          {turns.length === 0 && suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => void send(suggestion)}
                  className="rounded-full border border-primary/40 bg-primary/5 px-3.5 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          {turns.map((turn, i) => (
            <div key={i} className="space-y-2">
              <div
                className={
                  turn.role === 'user'
                    ? 'ms-auto w-fit max-w-[90%] rounded-2xl rounded-se-md bg-primary px-4 py-3 text-primary-foreground'
                    : 'max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-ss-md bg-muted px-4 py-3 leading-relaxed'
                }
              >
                {turn.role === 'assistant' ? renderContent(turn.content) : turn.content}
              </div>
              {turn.products && turn.products.length > 0 && (
                <div className="space-y-2">
                  {turn.products.map((product) => (
                    <ProductRow key={product.link} product={product} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex w-fit items-center gap-2 rounded-2xl rounded-ss-md bg-muted px-4 py-3 text-muted-foreground">
              <span className="inline-flex gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
              </span>
              {t('thinking')}
            </div>
          )}
        </div>

        {/* Composer */}
        <form
          className="border-t border-border bg-surface-warm p-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('placeholder')}
              className="flex-1 bg-transparent px-2.5 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t('send')}
              className="rounded-lg bg-primary p-2.5 text-primary-foreground hover:bg-primary-hover disabled:opacity-40"
            >
              <Send className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}
