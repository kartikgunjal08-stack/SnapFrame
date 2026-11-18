import React, { useState } from "react";
import {
  Eye,
  Film,
  Layers,
  Lock,
  Monitor,
  Play,
  Sparkles,
  Ticket,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Maximize2,
} from "lucide-react";
import { APP_CONFIG } from "../config";
import type { AuthActionResult } from "../hooks/useAuth";

interface AuthPageProps {
  authBusy: boolean;
  isSupabaseConfigured: boolean;
  onSignIn: (email: string, password: string) => Promise<AuthActionResult>;
  onSignUp: (
    email: string,
    password: string,
    fullName: string,
    redeemCode?: string
  ) => Promise<AuthActionResult>;
  onWatchInPreviewMode: () => void;
}

const TOUR_HIGHLIGHTS = [
  {
    icon: Monitor,
    title: "3D Device Studio",
    desc: "MacBook, iPhone 9:16 Showcase, Glass & Inline Editing",
  },
  {
    icon: Play,
    title: "60fps Motion Loops",
    desc: "Auto camera motion, Phone Reels & transparent GIF/MP4",
  },
  {
    icon: Film,
    title: "6-Act Short Films",
    desc: "Multi-shot SaaS commercials with Beat SFX & Film Look",
  },
  {
    icon: Layers,
    title: "Seamless Carousels",
    desc: "LinkedIn & Instagram continuous decks + Fullscreen preview",
  },
];

export const AuthPage: React.FC<AuthPageProps> = ({
  authBusy,
  isSupabaseConfigured,
  onSignIn,
  onSignUp,
  onWatchInPreviewMode,
}) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [redeemCode, setRedeemCode] = useState("");
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; text: string } | null>(
    null
  );

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
    if (res.message) {
      setFeedback({ type: "success", text: res.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#07080B] text-zinc-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 shrink-0 border-b border-[#1A1C24] px-6 flex items-center justify-between bg-[#090A0E]/90">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center font-display font-bold text-white text-sm">
            S
          </div>
          <span className="font-display font-bold text-base tracking-tight text-white">
            {APP_CONFIG.appName}
          </span>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded bg-[#141722] border border-[#242938] text-[10px] font-mono-tabular text-zinc-400">
            SaaS Showcase Suite
          </span>
        </div>

        <button
          type="button"
          onClick={onWatchInPreviewMode}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#141824] hover:bg-[#1C2233] border border-[#2C3650] text-xs font-semibold text-blue-200 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
          Watch in Preview Mode
        </button>
      </header>

      {/* Main Split Container */}
      <main className="flex-1 flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: Product Value & Guided Tour Preview Card */}
          <section className="lg:col-span-6 rounded-2xl border border-[#1E202B] bg-gradient-to-br from-[#0E1018] via-[#0B0C12] to-[#0D1322] p-7 flex flex-col justify-between relative overflow-hidden">
            <div
              className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-25 blur-3xl"
              style={{ background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)" }}
            />

            <div className="space-y-5 relative">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2563EB]/15 border border-[#3B82F6]/35 text-[11px] font-medium text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                All-in-One Mockup, Motion & Launch Film Studio
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-[1.12]">
                Turn plain screenshots into studio launch visuals in seconds.
              </h1>

              <p className="text-sm text-zinc-400 leading-relaxed">
                Want to inspect the workspace before signing in? Enter{" "}
                <strong className="text-zinc-200">Preview Mode</strong> to take a live interactive
                tour across every studio — then sign in anytime to upload your own product
                screenshots.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {TOUR_HIGHLIGHTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="p-3.5 rounded-xl bg-[#11131C]/90 border border-[#202330]"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-[#60A5FA] shrink-0" />
                        <span className="text-xs font-semibold text-zinc-100">{item.title}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Preview Mode Callout */}
            <div className="mt-6 pt-5 border-t border-[#1D202C] flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Maximize2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Interactive SaaS Tour Available
                </div>
                <p className="text-[11px] text-zinc-400">
                  Click tools, templates & Fullscreen freely. Custom screenshot uploads lock until
                  sign in.
                </p>
              </div>
              <button
                type="button"
                onClick={onWatchInPreviewMode}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
                Watch in Preview Mode
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </section>

          {/* Right: Auth Card */}
          <section className="lg:col-span-6 rounded-2xl border border-[#1E202B] bg-[#0D0E14] p-7 flex flex-col justify-between shadow-2xl">
            <div>
              {/* Mode Tabs */}
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#14161F] border border-[#222534] mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setFeedback(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === "signin"
                      ? "bg-[#2563EB] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Log In / Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setFeedback(null);
                  }}
                  className={`py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mode === "signup"
                      ? "bg-[#2563EB] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="mb-5">
                <h2 className="font-display text-xl font-bold text-white">
                  {mode === "signin"
                    ? "Sign in to your SnapFramy workspace"
                    : "Create your SnapFramy account"}
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {mode === "signin"
                    ? "Unlock custom screenshot uploads, cloud Brand Kit sync, and your 1 Month Pro access."
                    : "Activate a 1 Month subscription to upload your own screenshots and sync your Brand Kit."}
                </p>
              </div>

              {!isSupabaseConfigured && (
                <div className="mb-4 p-3 rounded-xl bg-amber-950/35 border border-amber-500/30 text-[11px] text-amber-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    Supabase auth keys (<code className="text-amber-100">VITE_SUPABASE_URL</code> /{" "}
                    <code className="text-amber-100">VITE_SUPABASE_ANON_KEY</code>) are not set in
                    this environment yet. You can still explore the full app using{" "}
                    <strong>Watch in Preview Mode</strong> below.
                  </div>
                </div>
              )}

              {feedback && (
                <div
                  className={`mb-4 p-3 rounded-xl border text-xs flex items-start gap-2 ${
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

              <form onSubmit={handleSubmit} className="space-y-3.5">
                {mode === "signup" && (
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Aarav Mehta"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161F] border border-[#262938] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="founder@yourcompany.com"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161F] border border-[#262938] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-300 mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161F] border border-[#262938] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="flex items-center justify-between text-[11px] font-medium text-zinc-300 mb-1.5">
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5 text-[#60A5FA]" />
                        1 Month Subscription Code
                      </span>
                      <span className="text-[10px] text-zinc-500">30-Day Monthly Pass</span>
                    </label>
                    <input
                      type="text"
                      value={redeemCode}
                      onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                      placeholder="SNAP-1M-XXXX"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-[#14161F] border border-[#262938] text-xs font-mono-tabular text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {authBusy
                    ? "Please wait..."
                    : mode === "signin"
                      ? "Sign In & Unlock Full Workspace"
                      : "Create Account & Unlock Uploads"}
                </button>
              </form>
            </div>

            {/* Preview Mode Divider & Action Button */}
            <div className="mt-6 pt-5 border-t border-[#1E202B] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Just checking out how SnapFramy works?</span>
                <span className="text-zinc-500">No signup needed for tour</span>
              </div>
              <button
                type="button"
                onClick={onWatchInPreviewMode}
                className="w-full py-2.5 px-4 rounded-xl bg-[#151926] hover:bg-[#1B2133] border border-[#2B3550] text-xs font-semibold text-blue-100 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4 text-[#60A5FA]" />
                Watch in Preview Mode (Interactive SaaS Tour)
              </button>
              <p className="text-[10px] text-center text-zinc-500">
                Preview Mode lets you test Studio, Motion, Short Film & Carousel with sample
                mockups. Uploading your own screenshots unlocks after Sign In.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
