'use client';

import { useEffect, useState } from 'react';

interface OrgDeal {
  id: string;
  deal_price: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  product: { id: string; name: string; base_price: number | null; images: string[] | null } | null;
}

interface ConsoleProduct {
  id: string;
  name: string;
  base_price: number | null;
  is_published: boolean;
}

const aed = (n: number | null) =>
  n == null ? '—' : `AED ${Number(n).toLocaleString('en-AE')}`;

function isLive(d: OrgDeal) {
  return d.is_active && new Date(d.ends_at).getTime() > Date.now();
}

/** Seller console: run time-boxed deals on your products; live deals get
 * promoted on the SoukHub home page and product pages. */
export function DealsClient({ products }: { products: ConsoleProduct[] }) {
  const [deals, setDeals] = useState<OrgDeal[]>([]);
  const [productId, setProductId] = useState('');
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/deals');
    if (res.ok) setDeals((await res.json()).deals ?? []);
  };
  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    setError(null);
    const product = products.find((p) => p.id === productId);
    const dealPrice = Number(price);
    if (!product) return setError('Pick a product.');
    if (!(dealPrice > 0)) return setError('Enter a deal price.');
    if (product.base_price != null && dealPrice >= Number(product.base_price)) {
      return setError(`Deal price must be below the list price (${aed(product.base_price)}).`);
    }
    setBusy(true);
    try {
      const ends = new Date(Date.now() + Number(days) * 86_400_000).toISOString();
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, deal_price: dealPrice, ends_at: ends }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error === 'deal_exists' ? 'This product already has a live deal — end it first.' : 'Could not create the deal.');
        return;
      }
      setPrice('');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const end = async (pid: string) => {
    await fetch(`/api/deals?product_id=${encodeURIComponent(pid)}`, { method: 'DELETE' });
    await load();
  };

  const field =
    'rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  const live = deals.filter(isLive);
  const past = deals.filter((d) => !isLive(d));

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Start a deal</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live deals are promoted on the SoukHub home page and shown with a struck-through
          list price on your product pages.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} className={field}>
            <option value="">Choose a product…</option>
            {products.filter((p) => p.is_published).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {aed(p.base_price)}
              </option>
            ))}
          </select>
          <input
            type="number" min="1" placeholder="Deal price (AED)"
            value={price} onChange={(e) => setPrice(e.target.value)} className={field}
          />
          <select value={days} onChange={(e) => setDays(e.target.value)} className={field}>
            {[3, 7, 14, 30].map((v) => (
              <option key={v} value={v}>{v} days</option>
            ))}
          </select>
          <button
            onClick={create}
            disabled={busy}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start deal'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-error">{error}</p>}
      </div>

      <div>
        <h2 className="font-semibold">Live deals ({live.length})</h2>
        {live.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No live deals — start one above.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {live.map((deal) => (
              <li key={deal.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                <div>
                  <p className="font-medium">{deal.product?.name ?? 'Product'}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-accent">{aed(deal.deal_price)}</span>
                    {deal.product?.base_price != null && (
                      <span className="ms-2 line-through">{aed(deal.product.base_price)}</span>
                    )}
                    <span className="ms-2">ends {new Date(deal.ends_at).toLocaleDateString()}</span>
                  </p>
                </div>
                <button
                  onClick={() => deal.product && end(deal.product.id)}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  End deal
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <h2 className="font-semibold text-muted-foreground">Past deals</h2>
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {past.slice(0, 10).map((deal) => (
              <li key={deal.id}>
                {deal.product?.name ?? 'Product'} — {aed(deal.deal_price)} · ended{' '}
                {new Date(deal.ends_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
