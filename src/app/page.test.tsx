import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from './page';

describe('Home Page', () => {
  it('renders the main heading', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { name: /soukhub/i })).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<Home />);
    expect(screen.getByText(/ai-powered agent for multi-channel marketplace sellers/i)).toBeInTheDocument();
  });

  it('renders marketplace cards', () => {
    render(<Home />);
    expect(screen.getByText('Amazon')).toBeInTheDocument();
    expect(screen.getByText('Cartlow')).toBeInTheDocument();
    expect(screen.getByText('Revibe')).toBeInTheDocument();
  });

  it('has correct main element role', () => {
    render(<Home />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
