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
