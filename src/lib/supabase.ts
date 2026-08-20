import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Lazy on purpose: this module is imported by every windbanner API route, and
// Next's build-time page-data collection imports route modules without
// calling their handlers. A top-level throw here would fail the whole build
// whenever the env vars aren't set yet (e.g. a fresh Vercel project before
// its first env var is configured) — deferring the check to first real use
// keeps the build green and only fails requests that actually hit Supabase.
export function getSupabase(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY precisam estar definidas.");
  }

  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
