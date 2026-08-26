'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { formatAED } from '@/lib/marketplace/format';

const CATEGORY_KEYS = ['phones', 'laptops', 'tablets', 'audio', 'wearables', 'gaming'] as const;
const PRICE_CAP = 8000;
const STEP = 50;

interface Props {
  action: string;
  brands: string[];
  initial: { q?: string; brand?: string; category?: string; min?: string; max?: string };
}

/** Filter rail: brand autocomplete (datalist), category select, price sliders. */
export function SearchFiltersPanel({ action, brands, initial }: Props) {
  const t = useTranslations('search');
  const th = useTranslations('home');
  const locale = useLocale();
  const [brand, setBrand] = useState(initial.brand ?? '');
  const [category, setCategory] = useState(initial.category ?? '');
  const [min, setMin] = useState(Number(initial.min ?? 0) || 0);
  const [max, setMax] = useState(Number(initial.max ?? PRICE_CAP) || PRICE_CAP);

  const setMinSafe = (v: number) => setMin(Math.min(v, max - STEP));
  const setMaxSafe = (v: number) => setMax(Math.max(v, min + STEP));

  const field =
    'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

  return (
    <form action={action} className="grid grid-cols-2 gap-4 lg:grid-cols-1">
      {initial.q && <input type="hidden" name="q" value={initial.q} />}
      {min > 0 && <input type="hidden" name="min" value={min} />}
      {max < PRICE_CAP && <input type="hidden" name="max" value={max} />}

      <label className="text-sm">
        <span className="mb-1 block font-medium">{t('filters.brand')}</span>
        <input
          name="brand"
          list="brand-options"
          autoComplete="off"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className={field}
        />
        <datalist id="brand-options">
          {brands.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </label>

      <label className="text-sm">
        <span className="mb-1 block font-medium">{t('filters.category')}</span>
        <select
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={field}
        >
          <option value="">{t('filters.anyCategory')}</option>
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {th(`categories.${key}`)}
            </option>
          ))}
        </select>
      </label>

      {/* Price range sliders */}
      <div className="col-span-2 text-sm lg:col-span-1">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-medium">{t('filters.price')}</span>
          <span className="text-xs text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {formatAED(min, locale)} – {max >= PRICE_CAP ? `${formatAED(PRICE_CAP, locale)}+` : formatAED(max, locale)}
          </span>
        </div>
        <div className="dual-range" dir="ltr">
          <div className="track" />
          <div
            className="track-fill"
            style={{
              left: `${(min / PRICE_CAP) * 100}%`,
              width: `${((max - min) / PRICE_CAP) * 100}%`,
            }}
          />
          <input
            type="range"
            aria-label={t('filters.minPrice')}
            min={0}
            max={PRICE_CAP}
            step={STEP}
            value={min}
            onChange={(e) => setMinSafe(Number(e.target.value))}
            style={{ zIndex: min > PRICE_CAP - STEP * 4 ? 5 : 3 }}
          />
          <input
            type="range"
            aria-label={t('filters.maxPrice')}
            min={0}
            max={PRICE_CAP}
            step={STEP}
            value={max}
            onChange={(e) => setMaxSafe(Number(e.target.value))}
            style={{ zIndex: 4 }}
          />
        </div>
      </div>

      <div className="col-span-2 flex gap-2 lg:col-span-1">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
        >
          {t('filters.apply')}
        </button>
        <a
          href={action}
          className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium hover:bg-muted"
        >
          {t('filters.clear')}
        </a>
      </div>
    </form>
  );
}
