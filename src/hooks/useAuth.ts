import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  is_redeemed: boolean;
  redeemed_code: string | null;
  redeemed_at: string | null;
}

export interface PrecheckResult {
  allowed: boolean;
  already_redeemed: boolean;
  tier?: string;
  reason?: string;
}

export interface ClaimCodeResult {
  success: boolean;
  already_redeemed?: boolean;
  tier?: string;
  code?: string;
  reason?: string;
}

const PENDING_CODE_STORAGE_KEY = "snapframy_pending_redeem_code_v1";

function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return err;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) {
      return new Error(msg);
    }
  }
  if (typeof err === "string" && err.trim()) return new Error(err);
  return new Error(fallback);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, plan, is_redeemed, redeemed_code, redeemed_at")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    const nextProfile = data as UserProfile;
    setProfile(nextProfile);
    return nextProfile;
  }, []);

  const claimRedeemCode = useCallback(
    async (rawCode: string, explicitUserId?: string): Promise<ClaimCodeResult> => {
      if (!supabase) {
        throw new Error("Supabase environment variables are not configured.");
      }
      const cleanCode = rawCode.trim().toUpperCase();
      if (!cleanCode) {
        throw new Error("Please enter your purchased redeem code.");
      }

      const { data, error } = await supabase.rpc("claim_redeem_code", {
        p_code: cleanCode,
      });

      if (error) throw toError(error, "Failed to validate redeem code.");
      const res = data as ClaimCodeResult;
      if (!res?.success) {
        throw new Error(res?.reason || "Could not redeem code.");
      }

      try {
        sessionStorage.removeItem(PENDING_CODE_STORAGE_KEY);
      } catch {
        // Ignore storage errors
      }

      const targetUserId = explicitUserId ?? user?.id;
      if (targetUserId) {
        await fetchProfile(targetUserId);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user?.id) {
          await fetchProfile(sessionData.session.user.id);
        }
      }

      return res;
    },
    [fetchProfile, user?.id]
  );

  // Sync session & auto-claim pending redeem code (from metadata or sessionStorage) after confirmation/login
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const handleUserReady = async (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      const nextUser = nextSession?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const loaded = await fetchProfile(nextUser.id);

      let pendingCode: string | null = null;
      try {
        pendingCode = sessionStorage.getItem(PENDING_CODE_STORAGE_KEY);
      } catch {
        pendingCode = null;
      }
      if (!pendingCode) {
        const metaCode = nextUser.user_metadata?.pending_redeem_code;
        if (typeof metaCode === "string" && metaCode.trim()) {
          pendingCode = metaCode.trim().toUpperCase();
        }
      }

      if (pendingCode && (!loaded || !loaded.is_redeemed)) {
        try {
          const { data } = await supabase!.rpc("claim_redeem_code", {
            p_code: pendingCode,
          });
          if ((data as ClaimCodeResult | null)?.success) {
            try {
              sessionStorage.removeItem(PENDING_CODE_STORAGE_KEY);
            } catch {
              // Ignore
            }
            await fetchProfile(nextUser.id);
          }
        } catch {
          // Leave user on Redeem step inside Auth Gate
        }
      }

      if (mounted) setLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data }) => handleUserReady(data.session))
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      handleUserReady(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const precheckRedeemAccess = useCallback(
    async (email: string, code: string): Promise<PrecheckResult> => {
      if (!supabase) {
        throw new Error("Supabase environment variables are not configured.");
      }

      const { data, error } = await supabase.rpc("precheck_redeem_access", {
        p_email: email.trim().toLowerCase(),
        p_code: code.trim().toUpperCase(),
      });

      if (error) throw toError(error, "Unable to verify redeem code.");
      return data as PrecheckResult;
    },
    []
  );

  // Returning users MUST sign in using their Email + Password
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Supabase environment variables are not configured.");
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) throw toError(error, "Invalid email or password.");

      if (data.user?.id) {
        setSession(data.session);
        setUser(data.user);
        const loaded = await fetchProfile(data.user.id);
        let pendingCode: string | null = null;
        try {
          pendingCode = sessionStorage.getItem(PENDING_CODE_STORAGE_KEY);
        } catch {
          pendingCode = null;
        }
        if (!pendingCode && typeof data.user.user_metadata?.pending_redeem_code === "string") {
          pendingCode = data.user.user_metadata.pending_redeem_code.trim().toUpperCase();
        }
        if (pendingCode && (!loaded || !loaded.is_redeemed)) {
          try {
            await claimRedeemCode(pendingCode, data.user.id);
          } catch {
            // Will stay on Redeem Code step if code couldn't be claimed
          }
        }
      }
      return data;
    },
    [claimRedeemCode, fetchProfile]
  );

  // New users MUST register with Email + Genuine Password + Valid Redeem Code
  const signUpWithRedeemCode = useCallback(
    async (
      email: string,
      password: string,
      redeemCode: string,
      fullName?: string
    ): Promise<{ requiresEmailConfirmation: boolean; tier?: string }> => {
      if (!supabase) {
        throw new Error("Supabase environment variables are not configured.");
      }

      const cleanEmail = email.trim().toLowerCase();
      const cleanCode = redeemCode.trim().toUpperCase();

      // 1. Validate redeem code BEFORE creating the auth account
      const check = await precheckRedeemAccess(cleanEmail, cleanCode);
      if (!check.allowed) {
        throw new Error(check.reason || "Invalid or already used redeem code.");
      }
      if (check.already_redeemed) {
        throw new Error(
          "This email already has an active license. Switch to Sign In and enter your password."
        );
      }

      try {
        sessionStorage.setItem(PENDING_CODE_STORAGE_KEY, cleanCode);
      } catch {
        // Ignore storage restrictions
      }

      // 2. Create account with genuine password + store pending code in metadata
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName?.trim() || cleanEmail.split("@")[0],
            pending_redeem_code: cleanCode,
          },
        },
      });
      if (error) {
        try {
          sessionStorage.removeItem(PENDING_CODE_STORAGE_KEY);
        } catch {
          // Ignore
        }
        throw toError(error, "Registration failed.");
      }

      // Supabase returns empty identities if the email is already registered when email confirmation is enabled
      if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        throw new Error(
          "An account with this email already exists. Use Sign In with your password."
        );
      }

      // 3. Direct entry to Studio when Confirm Email is OFF (instant session returned)
      if (data.session && data.user) {
        setSession(data.session);
        setUser(data.user);
        await claimRedeemCode(cleanCode, data.user.id);
        return { requiresEmailConfirmation: false, tier: check.tier };
      }

      return { requiresEmailConfirmation: true, tier: check.tier };
    },
    [claimRedeemCode, precheckRedeemAccess]
  );

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error("Supabase environment variables are not configured.");
    }
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: window.location.origin,
      }
    );
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    try {
      sessionStorage.removeItem(PENDING_CODE_STORAGE_KEY);
    } catch {
      // Ignore
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
  }, []);

  return {
    isConfigured: isSupabaseConfigured,
    session,
    user,
    profile,
    isRedeemed: Boolean(profile?.is_redeemed),
    loading,
    signInWithPassword,
    signUpWithRedeemCode,
    claimRedeemCode,
    resetPassword,
    signOut,
  };
}
