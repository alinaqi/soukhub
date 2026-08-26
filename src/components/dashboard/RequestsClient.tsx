'use client';

import { useState } from 'react';
import { MessageCircle, Sparkles, ExternalLink } from 'lucide-react';

export interface CatalogRequestRow {
  id: string;
  name: string | null;
  contact_phone: string;
  note: string | null;
  status: string;
  created_at: string;
  catalog_products: {
    title: string;
    price: number | null;
    currency: string;
    source: string;
    url: string;
  } | null;
}

export interface TradeInRow {
  id: string;
  contact_phone: string | null;
  notes: string | null;
  status: string;
  estimated_value: number | null;
  currency: string;
  ai_assessment: {
    brand?: string | null;
    model?: string | null;
    condition_grade?: string;
    confidence?: number;
  } | null;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-accent/10 text-accent',
  evaluated: 'bg-info/10 text-info',
  contacted: 'bg-warning/10 text-warning',
  completed: 'bg-success/10 text-success',
  closed: 'bg-muted text-muted-foreground',
};

const NEXT_STATUSES = ['contacted', 'completed', 'closed'] as const;

function waLink(phone: string) {
  const digits = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${digits.startsWith('0') ? '971' + digits.slice(1) : digits}`;
}

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status] ?? STATUS_STYLE.closed}`}
    >
      {status}
    </span>
  );
}

export function RequestsClient({
  catalogRequests,
  tradeIns,
}: {
  catalogRequests: CatalogRequestRow[];
  tradeIns: TradeInRow[];
}) {
  const [catalog, setCatalog] = useState(catalogRequests);
  const [trades, setTrades] = useState(tradeIns);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setStatus = async (kind: 'catalog' | 'tradein', id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, id, status }),
      });
      if (!res.ok) return;
      if (kind === 'catalog') {
        setCatalog((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      } else {
        setTrades((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const actions = (kind: 'catalog' | 'tradein', row: { id: string; status: string }) => (
    <div className="flex gap-1.5">
      {NEXT_STATUSES.filter((s) => s !== row.status).map((s) => (
        <button
          key={s}
          disabled={busyId === row.id}
          onClick={() => void setStatus(kind, row.id, s)}
          className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
        >
          {s}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Marketplace Requests</h1>
        <p className="text-muted-foreground">
          Buyer interest from the catalog and AI trade-in valuations — follow up on WhatsApp.
        </p>
      </div>

      {/* Catalog requests */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
          Order-through-SoukHub requests
          <span className="text-sm font-normal text-muted-foreground">({catalog.length})</span>
        </h2>
        <div className="mt-3 space-y-3">
          {catalog.length === 0 && (
            <p className="rounded-xl border border-border p-6 text-center text-muted-foreground">
              No catalog requests yet.
            </p>
          )}
          {catalog.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {row.catalog_products?.title ?? 'Item removed'}
                    {row.catalog_products?.price != null && (
                      <span className="ms-2 font-bold text-accent">
                        {row.catalog_products.currency} {row.catalog_products.price}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.name || 'Anonymous'} ·{' '}
                    <a href={waLink(row.contact_phone)} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                      {row.contact_phone}
                    </a>{' '}
                    · {new Date(row.created_at).toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {row.note && <p className="mt-1 text-sm">“{row.note}”</p>}
                  {row.catalog_products?.url && (
                    <a
                      href={row.catalog_products.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden />
                      source: {row.catalog_products.source}
                    </a>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill status={row.status} />
                  {actions('catalog', row)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trade-ins */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden />
          Trade-in valuations
          <span className="text-sm font-normal text-muted-foreground">({trades.length})</span>
        </h2>
        <div className="mt-3 space-y-3">
          {trades.length === 0 && (
            <p className="rounded-xl border border-border p-6 text-center text-muted-foreground">
              No trade-in requests yet.
            </p>
          )}
          {trades.map((row) => (
            <div key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {[row.ai_assessment?.brand, row.ai_assessment?.model].filter(Boolean).join(' ') || 'Unidentified device'}
                    {row.estimated_value != null && (
                      <span className="ms-2 font-bold text-accent">
                        {row.currency} {row.estimated_value}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.ai_assessment?.condition_grade && (
                      <>condition: {row.ai_assessment.condition_grade.replace('_', ' ')} · </>
                    )}
                    {row.contact_phone ? (
                      <a href={waLink(row.contact_phone)} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                        {row.contact_phone}
                      </a>
                    ) : (
                      'no contact left'
                    )}{' '}
                    · {new Date(row.created_at).toLocaleString('en-AE', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {row.notes && <p className="mt-1 text-sm">“{row.notes}”</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill status={row.status} />
                  {actions('tradein', row)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
