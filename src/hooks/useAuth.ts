import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  ClaimRedeemResult,
  formatPlanLabel,
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

    if (error || !data) return null;
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
        if (data.user) {
          await claimPendingCodeIfNeeded(data.user.id);
          await loadProfile(data.user.id);
        }
        return { ok: true };
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

      setAuthBusy(true);
      try {
        // Optional purchased redeem code precheck if code was entered
        if (cleanCode) {
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
          if (parsed && !parsed.allowed) {
            return {
              ok: false,
              message: parsed.reason || "Invalid or already used redeem code.",
            };
          }
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

        if (cleanCode) {
          if (data.session && data.user) {
            const { data: claimData } = await supabase.rpc("claim_redeem_code", {
              p_code: cleanCode,
            });
            const claimRes = claimData as ClaimRedeemResult | null;
            if (claimRes && !claimRes.success) {
              return {
                ok: true,
                message:
                  claimRes.reason ||
                  "Account created, but code could not be claimed. You can redeem it in Account settings.",
              };
            }
            await loadProfile(data.user.id);
          } else {
            localStorage.setItem(PENDING_REDEEM_STORAGE_KEY, cleanCode);
          }
        }

        if (!data.session) {
          return {
            ok: true,
            needsEmailConfirmation: true,
            message:
              "Account created! Check your inbox to confirm your email, then sign in.",
          };
        }

        return { ok: true };
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
        return { ok: false, message: "Enter a redeem code first." };
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
          return { ok: false, message: res?.reason || "Redeem failed." };
        }
        await loadProfile(user.id);
        return {
          ok: true,
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

  return {
    session,
    user,
    profile,
    loading,
    authBusy,
    isSupabaseConfigured,
    signIn,
    signUp,
    redeemCode,
    signOut,
  };
}
