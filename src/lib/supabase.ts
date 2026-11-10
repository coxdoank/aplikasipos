import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export const isSupabaseConfigured = (): boolean => {
  const url = (import.meta.env.VITE_SUPABASE_URL || "").trim();
  const key = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

  return Boolean(
    url &&
    key &&
    url !== "" &&
    key !== "" &&
    !url.includes("placeholder-project") &&
    !url.includes("unconfigured-project") &&
    !url.includes("your-project-id") &&
    !key.includes("placeholder") &&
    !key.includes("unconfigured") &&
    !key.includes("your-anon-key")
  );
};

// Safe fallback placeholder only used when unconfigured to prevent module-level throw on import
const rawUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

const supabaseUrl = isSupabaseConfigured()
  ? rawUrl
  : "https://unconfigured-project.supabase.co";
const supabaseAnonKey = isSupabaseConfigured()
  ? rawKey
  : "unconfigured-anon-key";

if (!isSupabaseConfigured()) {
  console.warn(
    "[FOODPOS] Supabase environment variables (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) are not set. " +
    "Please configure them in your .env file or GitHub Repository Secrets."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
