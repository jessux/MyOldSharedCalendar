"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

let client: SupabaseClient<Database> | null = null;

const BUILD_TIME_FALLBACK_URL = "https://build-placeholder.supabase.co";
const BUILD_TIME_FALLBACK_KEY = "sb_publishable_build_placeholder";

function isServerPrerender(): boolean {
  return typeof window === "undefined";
}

export function createBrowserClient(): SupabaseClient<Database> {
  if (client) return client;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if ((!rawUrl || !rawKey) && !isServerPrerender()) {
    throw new Error(
      "Configuration Supabase manquante : NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "n'a pas ete injecte au moment du build. Verifie les secrets GitHub Actions et relance le workflow."
    );
  }

  const url = rawUrl || BUILD_TIME_FALLBACK_URL;
  const anonKey = rawKey || BUILD_TIME_FALLBACK_KEY;

  client = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });

  return client;
}
