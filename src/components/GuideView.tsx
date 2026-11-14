import React from "react";
import { ArrowRight, Check } from "lucide-react";
import { APP_CONFIG } from "../config";

interface GuideViewProps {
  onOpenStudio: () => void;
}

export const GuideView: React.FC<GuideViewProps> = ({ onOpenStudio }) => {
  return (
    <div className="flex-1 overflow-y-auto studio-scroll bg-[#0A0A0C]">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <span>Browser-Local Rendering</span>
            <span aria-hidden="true">·</span>
            <span>No Watermarks</span>
            <span aria-hidden="true">·</span>
            <span>Up to 3x Lossless Export</span>
          </div>
          <h1
            className="font-display font-bold tracking-tight text-white text-balance"
            style={{ fontSize: "clamp(1.75rem, 3vw, 2.5rem)" }}
          >
            Built for fast product launches and clean social graphics
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed">
            {APP_CONFIG.appName} renders every frame, gradient, 3D tilt, and high-resolution
            export directly inside your browser. Screenshots never leave your device.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-[#111115] border border-[#22222A]">
            <p className="text-xs font-mono-tabular text-zinc-500 mb-2">01. Instant Input</p>
            <h2 className="font-display text-base font-semibold text-white">
              Click to Edit — Or Drop a Screen
            </h2>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Click any text, metric, headline, or chart right on the canvas to edit it directly
              with your mouse — or paste (<code className="font-mono-tabular text-zinc-200">Ctrl+V</code>)
              or drop any local screenshot onto the stage.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#111115] border border-[#22222A]">
            <p className="text-xs font-mono-tabular text-zinc-500 mb-2">02. Device & Depth</p>
            <h2 className="font-display text-base font-semibold text-white">
              7 Frames, Patterns & 3D
            </h2>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Choose macOS Dark/Light, Browser, iPhone, Tablet, Frosted Glass, or Frameless cards.
              Layer 28 gradients with Dot, Grid, Glow, or Ring patterns and X/Y/Z 3D tilt controls.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-[#111115] border border-[#22222A]">
            <p className="text-xs font-mono-tabular text-zinc-500 mb-2">03. Clean Output</p>
            <h2 className="font-display text-base font-semibold text-white">
              152 Templates & 3x Export
            </h2>
            <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
              Start from 152 templates across 8 categories, customize eyebrow & headline overlays,
              and export clean 1x, 2x, or 3x PNG/JPEG files sized for X, Product Hunt, and LinkedIn.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#111115] border border-[#22222A] overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1E1E24] flex items-center justify-between">
            <span className="text-xs font-mono-tabular text-zinc-300">
              Capabilities & White-Label Configuration
            </span>
            <button
              type="button"
              onClick={onOpenStudio}
              className="flex items-center gap-1.5 text-xs font-medium text-[#60A5FA] hover:text-white transition-colors whitespace-nowrap"
            >
              Open Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[#1C1C22]">
                <span className="text-zinc-400">Active Brand</span>
                <span className="font-mono-tabular text-zinc-100">{APP_CONFIG.appName}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1C1C22]">
                <span className="text-zinc-400">Export Watermark</span>
                <span className="font-mono-tabular text-emerald-400">None (Clean Output)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#1C1C22]">
                <span className="text-zinc-400">Configuration File</span>
                <span className="font-mono-tabular text-zinc-100">src/config.ts</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <p className="font-semibold text-zinc-200 mb-2">Production Ready Defaults</p>
              {[
                "All 1x, 2x, and 3x export resolutions unlocked",
                "Zero watermarks, paywalls, or account gates",
                "100% static build compatible with Vercel & Netlify",
                "Single-file branding & optional sponsor slot in src/config.ts",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
