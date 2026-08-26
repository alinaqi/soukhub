import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Design-system contract tests (ADR 0010 "Clean Souk").
 * Guards the commerce-grade palette against regression to the old AI-SaaS look.
 */

const css = readFileSync(resolve(__dirname, '../app/globals.css'), 'utf8');
const landing = [
  readFileSync(resolve(__dirname, '../components/marketplace/HomeLanding.tsx'), 'utf8'),
  readFileSync(resolve(__dirname, '../components/marketplace/SellLanding.tsx'), 'utf8'),
].join('\n');

describe('Clean Souk design tokens (globals.css)', () => {
  it('defines the souk-teal primary', () => {
    expect(css).toMatch(/--primary:\s*#0f766e/);
    expect(css).toMatch(/--primary-hover:\s*#115e59/);
  });

  it('defines the sienna accent (deals/prices only)', () => {
    expect(css).toMatch(/--accent:\s*#c2410c/);
  });

  it('defines the warm sand surface tint', () => {
    expect(css).toMatch(/--surface-warm:\s*#faf8f5/);
  });

  it('uses near-black ink on white', () => {
    expect(css).toMatch(/--background:\s*#ffffff/);
    expect(css).toMatch(/--foreground:\s*#1a1a1a/);
  });

  it('has no trace of the old AI-SaaS palette', () => {
    expect(css).not.toContain('#2563eb');
    expect(css).not.toContain('#f59e0b');
  });

  it('does not fall back to Arial', () => {
    expect(css).not.toMatch(/font-family:\s*Arial/);
  });
});

describe('Landing pages follow the design system', () => {
  it('contains no gradient washes', () => {
    expect(landing).not.toMatch(/gradient/i);
  });

  it('uses no emoji as UI icons', () => {
    // Surrogate-pair emoji (🚀📦 etc.) and common pictographs
    expect(landing).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});
