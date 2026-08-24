import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
  it('renders the hero heading', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { level: 1, name: /order-to-delivery/i })
    ).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<Home />);
    expect(
      screen.getByText(/manages your entire fulfillment workflow with ai-powered automation/i)
    ).toBeInTheDocument();
  });

  it('renders supported marketplaces', () => {
    render(<Home />);
    expect(screen.getAllByText('Amazon UAE').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Cartlow').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Revibe').length).toBeGreaterThan(0);
  });

  it('renders signup and login links', () => {
    render(<Home />);
    const signupLinks = screen.getAllByRole('link', { name: /start free trial/i });
    expect(signupLinks.length).toBeGreaterThan(0);
    expect(signupLinks[0]).toHaveAttribute('href', '/signup');
    const loginLinks = screen.getAllByRole('link', { name: /log in/i });
    expect(loginLinks.length).toBeGreaterThan(0);
    expect(loginLinks[0]).toHaveAttribute('href', '/login');
  });
});
