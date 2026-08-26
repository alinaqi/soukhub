import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import type { PublicListing } from '@/lib/marketplace/queries';

vi.mock('@/components/marketplace/LocaleSwitcher', () => ({
  LocaleSwitcher: () => null,
}));

import { HomeLanding } from './HomeLanding';
import { SellLanding } from './SellLanding';

const LISTING: PublicListing = {
  id: '1',
  name: 'iPhone 15 Pro 256GB',
  title_ar: 'ايفون 15 برو',
  brand: 'Apple',
  category: 'phones',
  base_price: 3799,
  images: [],
  slug: 'iphone-15-pro-256gb',
  short_id: 'a1b2c3d4',
  org_id: 'org',
  store_name: 'Demo Phones',
};

function renderWith(ui: React.ReactNode, locale: 'en' | 'ar' = 'en') {
  return render(
    <NextIntlClientProvider locale={locale} messages={locale === 'ar' ? ar : en}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe('Consumer home (HomeLanding)', () => {
  it('leads with a buyer hero, not a seller pitch', () => {
    renderWith(<HomeLanding listings={[]} />);
    expect(
      screen.getByRole('heading', { level: 1, name: /graded phones/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(/operations engine/i)).not.toBeInTheDocument();
  });

  it('shows the Talabat-style delivery location bar', () => {
    renderWith(<HomeLanding listings={[]} />);
    expect(screen.getByText('Deliver to:')).toBeInTheDocument();
    expect(screen.getByText('Choose your location')).toBeInTheDocument();
  });

  it('offers search and categories', () => {
    renderWith(<HomeLanding listings={[]} />);
    expect(screen.getAllByRole('search').length).toBeGreaterThan(0);
    for (const cat of ['Phones', 'Laptops', 'Gaming']) {
      expect(screen.getAllByText(cat).length).toBeGreaterThan(0);
    }
  });

  it('has a single Search button (no separate Ask AI)', () => {
    renderWith(<HomeLanding listings={[]} />);
    const form = screen.getAllByRole('search')[0];
    expect(within(form).getByRole('button', { name: 'Search' })).toBeInTheDocument();
    expect(within(form).queryByText('Ask AI')).not.toBeInTheDocument();
  });

  it('shows real listings when available', () => {
    renderWith(<HomeLanding listings={[LISTING]} />);
    expect(screen.getByText('iPhone 15 Pro 256GB')).toBeInTheDocument();
    expect(screen.getByText(/AED 3,799/)).toBeInTheDocument();
  });

  it('shows the empty state when no listings exist', () => {
    renderWith(<HomeLanding listings={[]} />);
    expect(screen.getByText(/listings are arriving/i)).toBeInTheDocument();
  });

  it('links sellers to /sell instead of pitching them inline', () => {
    renderWith(<HomeLanding listings={[]} />);
    const sellerLinks = screen.getAllByRole('link', { name: /for sellers|sell on soukhub/i });
    expect(sellerLinks.length).toBeGreaterThan(0);
    for (const link of sellerLinks) {
      expect(link).toHaveAttribute('href', '/sell');
    }
  });

  it('renders in Arabic', () => {
    renderWith(<HomeLanding listings={[]} />, 'ar');
    expect(
      screen.getByRole('heading', { level: 1, name: /هواتف وإلكترونيات/ })
    ).toBeInTheDocument();
    const arSellLinks = screen.getAllByRole('link', { name: 'للبائعين' });
    expect(arSellLinks.length).toBeGreaterThan(0);
    expect(arSellLinks[0]).toHaveAttribute('href', '/ar/sell');
  });
});

describe('Seller page (SellLanding)', () => {
  it('carries the seller pitch and signup CTA', () => {
    renderWith(<SellLanding />);
    expect(
      screen.getByRole('heading', { level: 1, name: /open your store/i })
    ).toBeInTheDocument();
    const signups = screen.getAllByRole('link', { name: /start selling|open your store/i });
    expect(signups.length).toBeGreaterThan(0);
    expect(signups[0]).toHaveAttribute('href', '/signup');
  });

  it('explains the three steps and commission', () => {
    renderWith(<SellLanding />);
    expect(screen.getByText(/live in three steps/i)).toBeInTheDocument();
    expect(screen.getAllByText(/no setup fees/i).length).toBeGreaterThan(0);
  });

  it('renders in Arabic', () => {
    renderWith(<SellLanding />, 'ar');
    expect(
      screen.getByRole('heading', { level: 1, name: /افتح متجرك/ })
    ).toBeInTheDocument();
  });
});
