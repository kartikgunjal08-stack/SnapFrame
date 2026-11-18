import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  ClaimRedeemResult,
  formatPlanLabel,
  isProfileSubscriptionActive,
  isProfileSubscriptionExpired,
  isSupabaseConfigured,
  RedeemPrecheckResult,
  supabase,
  UserProfile,
} from "../utils/supabase";

const PENDING_REDEEM_STORAGE_KEY = "snapframy_pending_redeem_code_v1";

export interface AuthActionResult {
  ok: boolean;
  message?: string;
  needsEmailConfirmation?: boolean;
  hasActiveAccess?: boolean;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const [authBusy, setAuthBusy] = useState<boolean>(false);

  const loadProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, avatar_url, plan, is_redeemed, redeemed_code, redeemed_at, plan_expires_at"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      setProfile(null);
      return null;
    }
    const typed = data as UserProfile;
    setProfile(typed);
    return typed;
  }, []);

  const claimPendingCodeIfNeeded = useCallback(
    async (userId: string) => {
      if (!supabase) return;
      const pendingCode = localStorage.getItem(PENDING_REDEEM_STORAGE_KEY)?.trim();
      if (!pendingCode) return;

      const { data, error } = await supabase.rpc("claim_redeem_code", {
        p_code: pendingCode,
      });

      if (!error && data && (data as ClaimRedeemResult).success) {
        localStorage.removeItem(PENDING_REDEEM_STORAGE_KEY);
        await loadProfile(userId);
      }
    },
    [loadProfile]
  );

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        const activeSession = data.session ?? null;
        setSession(activeSession);
        setUser(activeSession?.user ?? null);
        if (activeSession?.user) {
          await claimPendingCodeIfNeeded(activeSession.user.id);
          await loadProfile(activeSession.user.id);
        } else {
          setProfile(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void (async () => {
          await claimPendingCodeIfNeeded(nextSession.user.id);
          await loadProfile(nextSession.user.id);
        })();
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [claimPendingCodeIfNeeded, loadProfile]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthActionResult> => {
      if (!supabase) {
        return {
          ok: false,
          message:
            "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, or explore in Preview Mode.",
        };
      }
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { ok: false, message: "Please enter both email and password." };
      }

      setAuthBusy(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (error) {
          return { ok: false, message: error.message };
        }
        let loaded: UserProfile | null = null;
        if (data.user) {
          await claimPendingCodeIfNeeded(data.user.id);
          loaded = await loadProfile(data.user.id);
        }
        const active = isProfileSubscriptionActive(loaded);
        if (!active) {
          return {
            ok: true,
            hasActiveAccess: false,
            message: isProfileSubscriptionExpired(loaded)
              ? "Your 1 Month subscription has expired. Paste a renewal redeem code below to continue."
              : "This account does not have an active 1 Month redeem code yet. Paste your redeem code below to enter.",
          };
        }
        return { ok: true, hasActiveAccess: true };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Unable to sign in right now.",
        };
      } finally {
        setAuthBusy(false);
      }
    },
    [claimPendingCodeIfNeeded, loadProfile]
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      redeemCode?: string
    ): Promise<AuthActionResult> => {
      if (!supabase) {
        return {
          ok: false,
          message:
            "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment, or explore in Preview Mode.",
        };
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = (redeemCode || "").trim().toUpperCase();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        return { ok: false, message: "Please enter a valid email address." };
      }
      if (password.length < 6) {
        return { ok: false, message: "Password must be at least 6 characters." };
      }
      if (!cleanCode) {
        return {
          ok: false,
          message: "A valid 1 Month subscription redeem code is required to create an account.",
        };
      }

      setAuthBusy(true);
      try {
        // Mandatory redeem code precheck before creating auth user
        const { data: precheck, error: precheckErr } = await supabase.rpc(
          "precheck_redeem_access",
          {
            p_email: cleanEmail,
            p_code: cleanCode,
          }
        );

        if (precheckErr) {
          return { ok: false, message: precheckErr.message };
        }
        const parsed = precheck as RedeemPrecheckResult | null;
        if (!parsed || !parsed.allowed) {
          return {
            ok: false,
            message: parsed?.reason || "Invalid or already used 1 Month redeem code.",
          };
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
            data: {
              full_name: fullName.trim() || cleanEmail.split("@")[0],
            },
          },
        });

        if (error) {
          return { ok: false, message: error.message };
        }

        if (data.session && data.user) {
          const { data: claimData, error: claimErr } = await supabase.rpc("claim_redeem_code", {
            p_code: cleanCode,
          });
          const claimRes = claimData as ClaimRedeemResult | null;
          if (claimErr || !claimRes?.success) {
            return {
              ok: false,
              hasActiveAccess: false,
              message:
                claimErr?.message ||
                claimRes?.reason ||
                "Account created, but your redeem code could not be claimed. Please enter a valid 1 Month code below.",
            };
          }
          const loaded = await loadProfile(data.user.id);
          return { ok: true, hasActiveAccess: isProfileSubscriptionActive(loaded) };
        }

        localStorage.setItem(PENDING_REDEEM_STORAGE_KEY, cleanCode);
        return {
          ok: true,
          needsEmailConfirmation: true,
          hasActiveAccess: false,
          message:
            "Account created! Check your inbox to confirm your email, then sign in.",
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Could not create account.",
        };
      } finally {
        setAuthBusy(false);
      }
    },
    [loadProfile]
  );

  const redeemCode = useCallback(
    async (code: string): Promise<AuthActionResult> => {
      if (!supabase || !user) {
        return { ok: false, message: "Please sign in first to redeem a license code." };
      }
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        return { ok: false, message: "Please paste your 1 Month redeem code first." };
      }

      setAuthBusy(true);
      try {
        const { data, error } = await supabase.rpc("claim_redeem_code", {
          p_code: cleanCode,
        });
        if (error) {
          return { ok: false, message: error.message };
        }
        const res = data as ClaimRedeemResult | null;
        if (!res?.success) {
          return { ok: false, message: res?.reason || "Invalid or already used redeem code." };
        }
        const loaded = await loadProfile(user.id);
        return {
          ok: true,
          hasActiveAccess: isProfileSubscriptionActive(loaded),
          message: `Activated ${formatPlanLabel(res.tier || "1 Month")} subscription (${res.code || cleanCode})!`,
        };
      } finally {
        setAuthBusy(false);
      }
    },
    [loadProfile, user]
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const hasActiveAccess = Boolean(
    user && profile && profile.id === user.id && isProfileSubscriptionActive(profile)
  );
  const hasExpiredPlan = Boolean(
    user && profile && profile.id === user.id && isProfileSubscriptionExpired(profile)
  );

  return {
    session,
    user,
    profile,
    loading,
    authBusy,
    isSupabaseConfigured,
    hasActiveAccess,
    hasExpiredPlan,
    signIn,
    signUp,
    redeemCode,
    signOut,
  };
}
