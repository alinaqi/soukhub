import { createClient } from '@supabase/supabase-js';

/**
 * UAE retail calendar (ADR 0018 ring-2 / spec §7.4): a curated schedule of
 * shopping events. The active event drives a home banner and highlighted
 * deals; upcoming events feed a "what's next" strip.
 */
function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

export interface RetailEvent {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  emoji: string | null;
  category: string | null;
  starts_at: string;
  ends_at: string;
  expected_discount_pct: number | null;
  priority: number;
}

const COLS =
  'id, slug, name, name_ar, emoji, category, starts_at, ends_at, expected_discount_pct, priority';

/** The event to feature right now — highest priority among those live. */
export async function getActiveEvent(now: Date = new Date()): Promise<RetailEvent | null> {
  const iso = now.toISOString();
  const { data, error } = await publicClient()
    .from('events')
    .select(COLS)
    .eq('is_active', true)
    .lte('starts_at', iso)
    .gt('ends_at', iso)
    .order('priority', { ascending: false })
    .order('ends_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as RetailEvent | null) ?? null;
}

/** Events starting after `now`, soonest first (the schedule ahead). */
export async function listUpcomingEvents(now: Date = new Date(), limit = 4): Promise<RetailEvent[]> {
  const { data, error } = await publicClient()
    .from('events')
    .select(COLS)
    .eq('is_active', true)
    .gt('starts_at', now.toISOString())
    .order('starts_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as RetailEvent[];
}

export interface EventCalendarQuery {
  now?: Date;
  days?: number;
  category?: string | null;
}

/**
 * Retail-calendar view for the shopping agent (spec §6 get_event_calendar):
 * events overlapping [now, now+days] relevant to a category. An event with a
 * null category applies to everything; a category filter also keeps matching
 * category-specific events. Ordered soonest-ending first so "wait for X" cites
 * the nearest opportunity.
 */
export async function getEventCalendar(query: EventCalendarQuery = {}): Promise<RetailEvent[]> {
  const now = query.now ?? new Date();
  const horizon = new Date(now.getTime() + (query.days ?? 60) * 86_400_000);
  const { data, error } = await publicClient()
    .from('events')
    .select(COLS)
    .eq('is_active', true)
    .lte('starts_at', horizon.toISOString()) // starts before the horizon
    .gt('ends_at', now.toISOString()) // hasn't ended yet
    .order('ends_at', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as RetailEvent[];
  if (!query.category) return rows;
  return rows.filter((e) => e.category == null || e.category === query.category);
}
