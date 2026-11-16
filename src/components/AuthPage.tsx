import React, { useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Mail,
  Lock,
  Ticket,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Layers,
  Film,
  Sparkles,
  ArrowRight,
  LogOut,
} from "lucide-react";
import { APP_CONFIG } from "../config";
import { ClaimCodeResult, UserProfile } from "../hooks/useAuth";

interface AuthPageProps {
  isConfigured: boolean;
  user: User | null;
  profile: UserProfile | null;
  onSignInPassword: (email: string, password: string) => Promise<unknown>;
  onSignUpWithCode: (
    email: string,
    password: string,
    redeemCode: string,
    fullName?: string
  ) => Promise<{ requiresEmailConfirmation: boolean; tier?: string }>;
  onClaimRedeemCode: (code: string) => Promise<ClaimCodeResult>;
  onResetPassword: (email: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  onEnterLocalPreview?: () => void;
  onNotify: (text: string, type?: "info" | "error") => void;
}

type AuthTab = "signin" | "register";

function validateGenuinePassword(pw: string): { valid: boolean; message: string } {
  if (pw.length < 8) {
    return { valid: false, message: "Use at least 8 characters." };
  }
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    return { valid: false, message: "Include both letters and at least 1 number." };
  }
  return { valid: true, message: "Strong password" };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  isConfigured,
  user,
  profile,
  onSignInPassword,
  onSignUpWithCode,
  onClaimRedeemCode,
  onResetPassword,
  onSignOut,
  onEnterLocalPreview,
  onNotify,
}) => {
  const [tab, setTab] = useState<AuthTab>("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const pwCheck = validateGenuinePassword(password);
  const isPendingRedemption = Boolean(user && !profile?.is_redeemed);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg("Enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      await onSignInPassword(email.trim(), password);
      onNotify("Signed in to studio");
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Invalid email or password."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterAndRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!pwCheck.valid) {
      setErrorMsg(`Password requirement: ${pwCheck.message}`);
      return;
    }
    if (!redeemCode.trim()) {
      setErrorMsg("Enter the redeem code from your purchase.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await onSignUpWithCode(
        email.trim(),
        password,
        redeemCode.trim(),
        fullName.trim() || undefined
      );

      if (res.requiresEmailConfirmation) {
        setSuccessMsg(
          `Code verified for ${(res.tier || "lifetime").toUpperCase()} access! Click the confirmation link sent to ${email.trim()} to enter the studio directly (or turn OFF "Confirm email" in Supabase Auth settings for instant signup without email checks).`
        );
      } else {
        onNotify(
          `Welcome! ${(res.tier || "lifetime").toUpperCase()} license activated.`
        );
      }
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!redeemCode.trim()) {
      setErrorMsg("Please enter your purchased redeem code.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await onClaimRedeemCode(redeemCode.trim());
      onNotify(
        `Activated ${(res.tier || "lifetime").toUpperCase()} access (${res.code})!`
      );
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Could not activate code."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    if (!email.trim()) {
      setErrorMsg("Enter your registered email first to receive a password reset link.");
      return;
    }
    setSubmitting(true);
    try {
      await onResetPassword(email.trim());
      setSuccessMsg("Password reset instructions sent to your email.");
    } catch (err) {
      setErrorMsg(getErrorMessage(err, "Failed to send reset link."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F4F4F6] flex flex-col">
      {/* Minimal Brand Header */}
      <header className="h-14 px-6 border-b border-[#1A1A22] flex items-center justify-between bg-[#0B0B0E]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm"
            style={{ backgroundColor: APP_CONFIG.defaultBrandKit.primaryColor }}
          >
            {APP_CONFIG.appName.slice(0, 1)}
          </div>
          <span className="font-display text-base font-bold tracking-tight text-white">
            {APP_CONFIG.appName}
          </span>
        </div>
        <span className="text-[11px] font-mono-tabular text-zinc-500">
          {APP_CONFIG.domainLabel}
        </span>
      </header>

      {/* Main Split SaaS Auth Stage */}
      <main className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 items-center">
          {/* Left Side: Product Overview */}
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono-tabular font-semibold text-[#60A5FA] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                License-Verified Workspace
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.12]">
                Turn raw screenshots into launch-ready assets.
              </h1>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
                Create pixel-exact App Store mockups, 30-second commercial reels, and multi-platform social graphics — all synced with your Brand Kit.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#111116] border border-[#1E1E28]">
                <Layers className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-zinc-100">
                    150+ Static & 108 Motion Templates
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    One-click LinkedIn, X, Instagram Story & App Store compliance presets.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#111116] border border-[#1E1E28]">
                <Film className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-zinc-100">
                    30s Commercial Short-Film Studio
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Cinematic film color grading, kinetic text & WebM/GIF export in browser.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#111116] border border-[#1E1E28]">
                <Sparkles className="w-4 h-4 text-[#60A5FA] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-zinc-100">
                    One-Time License Redemption
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Bind your purchased redeem code to your email and sign in anytime with your password.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Email + Password + Redeem Code Card */}
          <div className="rounded-2xl bg-[#111116] border border-[#242430] shadow-2xl p-6 space-y-5">
            {!isConfigured && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-2 leading-relaxed">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Supabase env vars (<code className="font-mono-tabular">VITE_SUPABASE_URL</code>,{" "}
                    <code className="font-mono-tabular">VITE_SUPABASE_ANON_KEY</code>) are not configured yet.
                  </span>
                </div>
                {onEnterLocalPreview && (
                  <button
                    type="button"
                    onClick={onEnterLocalPreview}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-xs font-semibold text-amber-100 cursor-pointer"
                  >
                    Continue in Local Preview Mode
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {isPendingRedemption ? (
              /* Authenticated user who still needs to enter a purchased redeem code */
              <div className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-white">
                    Redeem Your License Code
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1">
                    Signed in as <span className="text-zinc-200 font-medium">{user?.email}</span>. Enter a purchased redeem code to unlock the studio.
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/35 text-[11px] text-red-200 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleActivateExistingAccount} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Purchased Redeem Code
                    </label>
                    <div className="relative">
                      <Ticket className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={redeemCode}
                        onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                        placeholder="SNAP-LIFE-7K2M"
                        className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#16161D] border border-[#282834] text-xs font-mono-tabular uppercase tracking-wider text-white focus:outline-none focus:border-[#3B82F6]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isConfigured || submitting}
                    className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors disabled:opacity-45 cursor-pointer"
                  >
                    {submitting ? "Validating code..." : "Activate & Enter Studio"}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out and use another email
                </button>
              </div>
            ) : (
              /* Unauthenticated Visitor: Sign In (Email + Password) OR Register & Redeem */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#16161D] border border-[#242430]">
                  <button
                    type="button"
                    onClick={() => {
                      setTab("register");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2 rounded-md text-xs font-semibold cursor-pointer ${
                      tab === "register"
                        ? "bg-[#2563EB] text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Redeem & Register
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("signin");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className={`py-2 rounded-md text-xs font-semibold cursor-pointer ${
                      tab === "signin"
                        ? "bg-[#2563EB] text-white"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    Sign In
                  </button>
                </div>

                <div>
                  <h2 className="font-display text-base font-bold text-white">
                    {tab === "register"
                      ? "Create account & redeem code"
                      : "Sign in to your account"}
                  </h2>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    {tab === "register"
                      ? "Enter your email, create a strong password, and redeem your purchased license key."
                      : "Already registered? Enter your email and password to enter the studio."}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/35 text-[11px] text-red-200 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/35 text-[11px] text-emerald-200 flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {tab === "register" ? (
                  <form onSubmit={handleRegisterAndRedeem} className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Full Name (Optional)
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Alex Rivera"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#16161D] border border-[#282834] text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#16161D] border border-[#282834] text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-zinc-400">Create Password</label>
                        {password.length > 0 && (
                          <span
                            className={`text-[10px] font-medium ${
                              pwCheck.valid ? "text-emerald-400" : "text-amber-400"
                            }`}
                          >
                            {pwCheck.message}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Min 8 chars + number"
                          className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#16161D] border border-[#282834] text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">
                        Purchased Redeem Code
                      </label>
                      <div className="relative">
                        <Ticket className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={redeemCode}
                          onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                          placeholder="SNAP-LIFE-7K2M"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#16161D] border border-[#282834] text-xs font-mono-tabular uppercase tracking-wider text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isConfigured || submitting}
                      className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-45 cursor-pointer"
                    >
                      {submitting
                        ? "Verifying code & creating account..."
                        : "Redeem Code & Create Account"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-[#16161D] border border-[#282834] text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-zinc-400">Password</label>
                        <button
                          type="button"
                          disabled={!isConfigured || submitting}
                          onClick={handleForgotPassword}
                          className="text-[10px] text-[#60A5FA] hover:underline disabled:opacity-40 cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                          className="w-full pl-9 pr-9 py-2.5 rounded-lg bg-[#16161D] border border-[#282834] text-xs text-white focus:outline-none focus:border-[#3B82F6]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isConfigured || submitting}
                      className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-45 cursor-pointer"
                    >
                      {submitting ? "Signing in..." : "Sign In with Password"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
