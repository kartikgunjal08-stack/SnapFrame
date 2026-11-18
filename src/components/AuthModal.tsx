import React, { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Lock,
  Ticket,
  Upload,
  X,
} from "lucide-react";
import type { AuthActionResult } from "../hooks/useAuth";

interface AuthModalProps {
  open: boolean;
  reason?: string | null;
  authBusy: boolean;
  isSupabaseConfigured: boolean;
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (
    email: string,
    password: string,
    fullName: string,
    redeemCode?: string
  ) => Promise<AuthActionResult>;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  open,
  reason,
  authBusy,
  isSupabaseConfigured,
  onSignIn,
  onSignUp,
  onClose,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const res =
      mode === "signin"
        ? await onSignIn(email, password)
        : await onSignUp(email, password, fullName, redeemCode);

    if (!res.ok) {
      setFeedback({ type: "error", text: res.message || "Authentication failed." });
      return;
    }
    if (res.needsEmailConfirmation) {
      setFeedback({
        type: "success",
        text: res.message || "Check your email to confirm your account, then sign in.",
      });
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#262938] bg-[#0E1017] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border border-[#3B82F6]/40 flex items-center justify-center">
              {reason ? (
                <Upload className="w-4 h-4 text-[#60A5FA]" />
              ) : (
                <Lock className="w-4 h-4 text-[#60A5FA]" />
              )}
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">
                {reason ? "Sign In Required for Custom Screenshots" : "Sign In to SnapFramy"}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {reason || "Unlock custom screenshot uploads & cloud Brand Kit sync."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {reason && (
          <div className="p-3 rounded-xl bg-[#141A29] border border-[#2B3B60] text-[11px] text-blue-100 leading-relaxed">
            You are currently in <strong>Preview Mode</strong>. Explore all templates, motion loops,
            and controls freely — to upload, paste (`Ctrl+V`), or drop your own screenshots, please
            log in or create an account.
          </div>
        )}

        {!isSupabaseConfigured && (
          <div className="p-3 rounded-xl bg-amber-950/35 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span>
              Configure <code className="text-amber-100">VITE_SUPABASE_URL</code> and{" "}
              <code className="text-amber-100">VITE_SUPABASE_ANON_KEY</code> to enable live sign in
              & cloud sync.
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#14161F] border border-[#222534]">
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setFeedback(null);
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === "signin"
                ? "bg-[#2563EB] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setFeedback(null);
            }}
            className={`py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              mode === "signup"
                ? "bg-[#2563EB] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {feedback && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
              feedback.type === "error"
                ? "bg-red-950/40 border-red-700/50 text-red-200"
                : "bg-emerald-950/40 border-emerald-700/50 text-emerald-200"
            }`}
          >
            {feedback.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <label className="block text-[11px] font-medium text-zinc-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="w-full px-3 py-2 rounded-lg bg-[#14161F] border border-[#262938] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@company.com"
              className="w-full px-3 py-2 rounded-lg bg-[#14161F] border border-[#262938] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 rounded-lg bg-[#14161F] border border-[#262938] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          {mode === "signup" && (
            <div>
              <label className="flex items-center justify-between text-[11px] font-medium text-zinc-300 mb-1">
                <span className="flex items-center gap-1">
                  <Ticket className="w-3 h-3 text-[#60A5FA]" />
                  1 Month Subscription Code
                </span>
                <span className="text-[10px] text-zinc-500">30-Day Pass</span>
              </label>
              <input
                type="text"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                placeholder="SNAP-1M-XXXX"
                className="w-full px-3 py-2 rounded-lg bg-[#14161F] border border-[#262938] text-xs font-mono-tabular text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={authBusy}
            className="w-full py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {authBusy
              ? "Authenticating..."
              : mode === "signin"
                ? "Log In & Unlock Screenshot Uploads"
                : "Sign Up & Unlock Screenshot Uploads"}
          </button>
        </form>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 rounded-lg bg-[#14161F] hover:bg-[#1B1E2A] border border-[#242836] text-[11px] font-medium text-zinc-300 flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
          Continue Preview Mode Tour
        </button>
      </div>
    </div>
  );
};
