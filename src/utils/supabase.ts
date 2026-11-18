import { createClient, SupabaseClient } from "@supabase/supabase-js";

function normalizeSupabaseOrigin(raw: string | undefined): string {
  const cleaned = (raw || "").trim().replace(/^["']|["']$/g, "");
  if (!cleaned || cleaned.includes("YOUR_PROJECT_REF")) return "";
  try {
    const parsed = new URL(cleaned);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return "";
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return "";
  }
}

function normalizeAnonKey(raw: string | undefined): string {
  const cleaned = (raw || "").trim().replace(/^["']|["']$/g, "");
  if (!cleaned || cleaned.includes("YOUR_SUPABASE")) return "";
  return cleaned;
}

const supabaseUrl = normalizeSupabaseOrigin(
  import.meta.env.VITE_SUPABASE_URL as string | undefined
);
const supabaseAnonKey = normalizeAnonKey(
  import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
);

export const isSupabaseConfigured = Boolean(supabaseUrl) && Boolean(supabaseAnonKey);

export const supabase: SupabaseClient | null = (() => {
  if (!isSupabaseConfigured) return null;
  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch {
    return null;
  }
})();

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  is_redeemed: boolean;
  redeemed_code: string | null;
  redeemed_at: string | null;
  plan_expires_at?: string | null;
}

export function formatPlanLabel(plan?: string | null): string {
  const clean = (plan || "").trim();
  if (!clean) return "1 Month";
  const lower = clean.toLowerCase();
  if (lower === "lifetime" || lower === "1_month" || lower === "1 month" || lower === "monthly" || lower === "pro") {
    return "1 Month";
  }
  if (lower === "agency") return "Agency 1 Month";
  return clean;
}

export interface RedeemPrecheckResult {
  allowed: boolean;
  already_redeemed: boolean;
  tier?: string;
  reason?: string;
}

export interface ClaimRedeemResult {
  success: boolean;
  already_redeemed?: boolean;
  tier?: string;
  code?: string;
  plan_expires_at?: string;
  reason?: string;
}
