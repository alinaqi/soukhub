import { execSync } from 'node:child_process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration-test helpers against the LOCAL Supabase stack (GETTING_STARTED.md).
 * Keys are read from the environment or fetched live from `supabase status`
 * (local-dev keys only) — nothing is hardcoded.
 */

interface LocalStack {
  url: string;
  anonKey: string;
  serviceKey: string;
}

let cached: LocalStack | null | undefined;

function localStack(): LocalStack | null {
  if (cached !== undefined) return cached;

  const fromEnv = {
    url: process.env.SUPABASE_TEST_URL,
    anonKey: process.env.SUPABASE_TEST_ANON_KEY,
    serviceKey: process.env.SUPABASE_TEST_SERVICE_KEY,
  };
  if (fromEnv.url && fromEnv.anonKey && fromEnv.serviceKey) {
    cached = fromEnv as LocalStack;
    return cached;
  }

  try {
    const out = execSync('supabase status -o env', {
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 15_000,
    }).toString();
    const get = (name: string) => out.match(new RegExp(`^${name}="([^"]+)"`, 'm'))?.[1];
    const url = get('API_URL');
    const anonKey = get('PUBLISHABLE_KEY') ?? get('ANON_KEY');
    const serviceKey = get('SECRET_KEY') ?? get('SERVICE_ROLE_KEY');
    cached = url && anonKey && serviceKey ? { url, anonKey, serviceKey } : null;
  } catch {
    cached = null;
  }
  return cached;
}

export function serviceClient(): SupabaseClient {
  const stack = localStack();
  if (!stack) throw new Error('local Supabase stack not available');
  return createClient(stack.url, stack.serviceKey, { auth: { persistSession: false } });
}

export function anonClient(): SupabaseClient {
  const stack = localStack();
  if (!stack) throw new Error('local Supabase stack not available');
  return createClient(stack.url, stack.anonKey, { auth: { persistSession: false } });
}

/** Create (or fetch) a confirmed user and return an authenticated client + user id. */
export async function userClient(
  email: string,
  password = 'test-password-123'
): Promise<{ client: SupabaseClient; userId: string }> {
  const svc = serviceClient();
  const { data: created, error } = await svc.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  let userId = created?.user?.id;
  if (error) {
    if (!/already/i.test(error.message)) throw error;
    const { data: list } = await svc.auth.admin.listUsers();
    userId = list.users.find((u) => u.email === email)?.id;
  }
  if (!userId) throw new Error(`could not resolve user ${email}`);
  const stack = localStack()!;
  const client = createClient(stack.url, stack.anonKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;
  return { client, userId };
}

/** True when the local Supabase stack is reachable (integration tests auto-skip otherwise). */
export async function localStackUp(): Promise<boolean> {
  const stack = localStack();
  if (!stack) return false;
  try {
    const res = await fetch(`${stack.url}/auth/v1/health`, {
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}
