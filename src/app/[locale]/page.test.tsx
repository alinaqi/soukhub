import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import en from '../../../messages/en.json';
import ar from '../../../messages/ar.json';
import Home from './page';

function renderHome(locale: 'en' | 'ar' = 'en') {
  const messages = locale === 'ar' ? ar : en;
  return render(
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Home />
    </NextIntlClientProvider>
  );
}

describe('Marketplace landing (en)', () => {
  it('renders the marketplace hero heading', () => {
    renderHome();
    expect(
      screen.getByRole('heading', { level: 1, name: /marketplace for phones/i })
    ).toBeInTheDocument();
  });

  it('offers product search', () => {
    renderHome();
    expect(screen.getAllByRole('search').length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText(/iphone 15/i)).toBeInTheDocument();
  });

  it('has buyer and seller calls to action', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /browse phones/i })).toBeInTheDocument();
    const sellLinks = screen.getAllByRole('link', { name: /start selling|open your store/i });
    expect(sellLinks.length).toBeGreaterThan(0);
  });

  it('shows category navigation', () => {
    renderHome();
    for (const cat of ['Phones', 'Laptops', 'Audio', 'Gaming']) {
      expect(screen.getAllByText(cat).length).toBeGreaterThan(0);
    }
  });

  it('mentions external marketplace sync', () => {
    renderHome();
    for (const mp of ['Amazon UAE', 'Cartlow', 'Revibe']) {
      expect(screen.getAllByText(mp).length).toBeGreaterThan(0);
    }
  });

  it('surfaces cash on delivery and Arabic support', () => {
    renderHome();
    expect(screen.getAllByText(/cash on delivery/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/العربية/).length).toBeGreaterThan(0);
  });
});

describe('Marketplace landing (ar)', () => {
  it('renders localized Arabic hero', () => {
    renderHome('ar');
    expect(
      screen.getByRole('heading', { level: 1, name: /سوق الإمارات/ })
    ).toBeInTheDocument();
  });

  it('renders Arabic categories', () => {
    renderHome('ar');
    expect(screen.getAllByText('هواتف').length).toBeGreaterThan(0);
  });
});
