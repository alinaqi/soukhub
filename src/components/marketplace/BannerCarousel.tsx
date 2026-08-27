'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { PromoBanner } from '@/lib/marketplace/banners-service';

const INTERVAL = 5000;

/** Rotating promo banners (event + per-category). Auto-advances, pauses on
 * hover, respects reduced motion, and is keyboard/arrow navigable. */
export function BannerCarousel({ banners }: { banners: PromoBanner[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = banners.length;

  const go = useCallback((next: number) => setIndex((next % count + count) % count), [count]);

  const reducedMotion = useRef(false);
  useEffect(() => {
    reducedMotion.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  useEffect(() => {
    if (count <= 1 || paused || reducedMotion.current) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL);
    return () => clearInterval(id);
  }, [count, paused, index]);

  if (count === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div
        className="relative overflow-hidden rounded-2xl border border-border"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        role="region"
        aria-roledescription="carousel"
        aria-label="Promotions"
      >
        {/* Track */}
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(${-index * 100}%)` }}
        >
          {banners.map((b) => (
            <Link
              key={b.id}
              href={b.href}
              className="group block w-full shrink-0"
              aria-label={`${b.headline} — shop now`}
              tabIndex={0}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image_url}
                alt={b.headline}
                className="h-auto w-full object-cover"
                loading={b.sort_order === 0 ? 'eager' : 'lazy'}
              />
            </Link>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous promotion"
              className="absolute start-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next promotion"
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 text-foreground shadow hover:bg-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" aria-hidden />
            </button>

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
              {banners.map((b, i) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to promotion ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-white' : 'w-2 bg-white/60 hover:bg-white/90'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
