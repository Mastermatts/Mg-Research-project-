import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/**
 * Use this client in Client Components ("use client").
 * It reads/writes the auth session via cookies so it stays in sync
 * with the server client below.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
