import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  labelFromNominatim,
  loadStoredLocation,
  storeLocation,
  type DeliveryLocation,
} from '@/lib/delivery-location';

describe('labelFromNominatim', () => {
  it('prefers neighbourhood + city (Talabat-style "Area, City")', () => {
    expect(
      labelFromNominatim({
        address: { neighbourhood: 'Al Barsha 1', city: 'Dubai', country: 'United Arab Emirates' },
        display_name: 'Al Barsha 1, Dubai, United Arab Emirates',
      })
    ).toBe('Al Barsha 1, Dubai');
  });

  it('falls back through suburb/quarter → state when city is missing', () => {
    expect(
      labelFromNominatim({
        address: { suburb: 'Al Majaz', state: 'Sharjah' },
        display_name: 'x',
      })
    ).toBe('Al Majaz, Sharjah');
    expect(labelFromNominatim({ address: { state: 'Abu Dhabi' }, display_name: 'x' })).toBe(
      'Abu Dhabi'
    );
  });

  it('falls back to a trimmed display_name and rejects junk', () => {
    const long = Array.from({ length: 10 }, (_, i) => `Part${i}`).join(', ');
    const label = labelFromNominatim({ display_name: long });
    expect(label).toBe('Part0, Part1');
    expect(labelFromNominatim({})).toBeNull();
    expect(labelFromNominatim(null)).toBeNull();
    expect(labelFromNominatim('nope')).toBeNull();
  });
});

describe('stored location', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const loc: DeliveryLocation = { label: 'Al Barsha 1, Dubai', lat: 25.1, lng: 55.2 };

  it('round-trips through localStorage', () => {
    storeLocation(loc);
    expect(loadStoredLocation()).toEqual(loc);
  });

  it('accepts a manual label without coordinates', () => {
    storeLocation({ label: 'Dubai Marina', lat: null, lng: null });
    expect(loadStoredLocation()).toEqual({ label: 'Dubai Marina', lat: null, lng: null });
  });

  it('returns null for missing, malformed, or wrong-shaped data', () => {
    expect(loadStoredLocation()).toBeNull();
    localStorage.setItem('soukhub-delivery-location', 'not json');
    expect(loadStoredLocation()).toBeNull();
    localStorage.setItem('soukhub-delivery-location', JSON.stringify({ label: 42 }));
    expect(loadStoredLocation()).toBeNull();
    localStorage.setItem(
      'soukhub-delivery-location',
      JSON.stringify({ label: 'x', lat: 'NaN', lng: 2 })
    );
    expect(loadStoredLocation()).toBeNull();
  });

  it('never throws when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => storeLocation(loc)).not.toThrow();
    expect(loadStoredLocation()).toBeNull();
  });
});
