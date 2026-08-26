import { describe, it, expect } from 'vitest';
import { mapPlaceItem, mapPlaces, toWhatsApp, inferEmirate } from '@/lib/ingestion/providers';

const RAW = {
  placeId: 'ChIJabc123',
  title: 'Al Noor Mobile Phones Trading',
  phone: '+971 50 123 4567',
  address: '12 Al Fahidi St - Bur Dubai - Dubai',
  city: 'Dubai',
  neighborhood: 'Bur Dubai',
  location: { lat: 25.2632, lng: 55.2972 },
  totalScore: 4.4,
  reviewsCount: 128,
  categoryName: 'Cell phone store',
  website: 'https://alnoor.example',
  imageUrl: 'https://lh3.googleusercontent.com/x.jpg',
  openingHours: [{ day: 'Monday', hours: '9 AM–10 PM' }],
};

describe('mapPlaceItem', () => {
  it('maps a full Google place', () => {
    const p = mapPlaceItem(RAW)!;
    expect(p.google_place_id).toBe('ChIJabc123');
    expect(p.whatsapp).toBe('971501234567');
    expect(p.emirate).toBe('Dubai');
    expect(p.area).toBe('Bur Dubai');
    expect(p.lat).toBeCloseTo(25.2632);
    expect(p.google_rating).toBe(4.4);
    expect(p.hours).toHaveProperty('openingHours');
  });

  it('drops closed shops and rows without id/name', () => {
    expect(mapPlaceItem({ ...RAW, permanentlyClosed: true })).toBeNull();
    expect(mapPlaceItem({ ...RAW, placeId: undefined })).toBeNull();
    expect(mapPlaceItem({ ...RAW, title: '' })).toBeNull();
  });

  it('survives missing optional fields', () => {
    const p = mapPlaceItem({ placeId: 'x', title: 'Shop' })!;
    expect(p.phone).toBeNull();
    expect(p.whatsapp).toBeNull();
    expect(p.lat).toBeNull();
  });
});

describe('toWhatsApp', () => {
  it('converts UAE mobile formats', () => {
    expect(toWhatsApp('+971 50 123 4567')).toBe('971501234567');
    expect(toWhatsApp('050 123 4567')).toBe('971501234567');
    expect(toWhatsApp('00971551112222')).toBe('971551112222');
  });
  it('rejects landlines (no WhatsApp)', () => {
    expect(toWhatsApp('+971 4 351 9999')).toBeNull();
    expect(toWhatsApp(null)).toBeNull();
  });
});

describe('inferEmirate / dedupe', () => {
  it('detects emirates from address text', () => {
    expect(inferEmirate('Al Wahda St, Sharjah', null)).toBe('Sharjah');
    expect(inferEmirate(null, 'Abu Dhabi')).toBe('Abu Dhabi');
    expect(inferEmirate('Somewhere else', null)).toBeNull();
  });
  it('dedupes by place id', () => {
    const out = mapPlaces([RAW, { ...RAW }, { ...RAW, placeId: 'other' }]);
    expect(out).toHaveLength(2);
  });
});
