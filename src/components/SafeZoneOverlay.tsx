import React from "react";
import { SafeZoneId } from "../types/studio";

interface SafeZoneOverlayProps {
  safeZoneId: SafeZoneId;
  visible: boolean;
}

interface SafeZoneSpec {
  label: string;
  specText: string;
  topInsetPct: number;
  bottomInsetPct: number;
  sideInsetPct: number;
  showDynamicIsland?: boolean;
  showNotch?: boolean;
  topLabel: string;
  bottomLabel: string;
}

export const SAFE_ZONE_SPECS: Record<Exclude<SafeZoneId, "none">, SafeZoneSpec> = {
  linkedin: {
    label: "LinkedIn Feed",
    specText: "1080 × 1350 px",
    topInsetPct: 6,
    bottomInsetPct: 9,
    sideInsetPct: 5,
    topLabel: "Feed Card Top Crop Safe Margin",
    bottomLabel: "'See More' & Reaction Bar Safe Zone",
  },
  "x-twitter": {
    label: "X (Twitter)",
    specText: "1600 × 900 px",
    topInsetPct: 5,
    bottomInsetPct: 9,
    sideInsetPct: 4,
    topLabel: "Timeline Card Top Safe Margin",
    bottomLabel: "ALT Badge & Media Pill Safe Zone",
  },
  "instagram-story": {
    label: "Instagram Story",
    specText: "1080 × 1920 px",
    topInsetPct: 14,
    bottomInsetPct: 18,
    sideInsetPct: 6,
    topLabel: "Profile Avatar & Story Bar Safe Zone (250px)",
    bottomLabel: "Reply Bar, Stickers & CTA Safe Zone (340px)",
  },
  "appstore-69": {
    label: "Apple App Store 6.9\"",
    specText: "1320 × 2868 px",
    topInsetPct: 6.2,
    bottomInsetPct: 4.5,
    sideInsetPct: 5,
    showDynamicIsland: true,
    topLabel: "Dynamic Island & Status Bar Safe Zone",
    bottomLabel: "Home Indicator Safe Margin",
  },
  "appstore-65": {
    label: "Apple App Store 6.5\"",
    specText: "1284 × 2778 px",
    topInsetPct: 5.8,
    bottomInsetPct: 4.5,
    sideInsetPct: 5,
    showNotch: true,
    topLabel: "Notch & Status Bar Safe Zone",
    bottomLabel: "Home Indicator Safe Margin",
  },
  "play-store": {
    label: "Google Play Store",
    specText: "1080 × 1920 px",
    topInsetPct: 5,
    bottomInsetPct: 6,
    sideInsetPct: 6,
    topLabel: "Android Status & Action Safe Area",
    bottomLabel: "Navigation Bar / Store Overlay Margin",
  },
  "product-hunt": {
    label: "Product Hunt Gallery",
    specText: "1270 × 760 px",
    topInsetPct: 6,
    bottomInsetPct: 11,
    sideInsetPct: 5,
    topLabel: "Top Crop Safe Margin (45px)",
    bottomLabel: "Gallery Controls & Carousel Arrows Safe Zone",
  },
  "chrome-store": {
    label: "Chrome Web Store",
    specText: "1280 × 800 px",
    topInsetPct: 6,
    bottomInsetPct: 9,
    sideInsetPct: 5,
    topLabel: "Top Safe Margin",
    bottomLabel: "Store Thumbnail Bar & Badge Overlay Zone",
  },
};

export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ safeZoneId, visible }) => {
  if (!visible || safeZoneId === "none") return null;
  const spec = SAFE_ZONE_SPECS[safeZoneId];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-30 select-none overflow-hidden"
    >
      {/* Top Exclusion Scrim */}
      <div
        className="absolute top-0 left-0 right-0 bg-amber-500/10 border-b border-dashed border-amber-400/70 flex flex-col items-center justify-end pb-1"
        style={{ height: `${spec.topInsetPct}%` }}
      >
        {spec.showDynamicIsland && (
          <div className="w-[22%] h-[14px] rounded-full bg-amber-400/30 border border-amber-300/70 mb-0.5" />
        )}
        {spec.showNotch && (
          <div className="w-[28%] h-[12px] rounded-b-lg bg-amber-400/30 border-x border-b border-amber-300/70 mb-0.5" />
        )}
        <span className="text-[9px] font-mono-tabular font-semibold text-amber-200 bg-black/60 px-1.5 py-0.5 rounded">
          {spec.topLabel}
        </span>
      </div>

      {/* Bottom Exclusion Scrim */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-amber-500/10 border-t border-dashed border-amber-400/70 flex items-start justify-center pt-1"
        style={{ height: `${spec.bottomInsetPct}%` }}
      >
        <span className="text-[9px] font-mono-tabular font-semibold text-amber-200 bg-black/60 px-1.5 py-0.5 rounded">
          {spec.bottomLabel}
        </span>
      </div>

      {/* Inner Safe Perimeter Box */}
      <div
        className="absolute border border-dashed border-emerald-400/55"
        style={{
          top: `${spec.topInsetPct}%`,
          bottom: `${spec.bottomInsetPct}%`,
          left: `${spec.sideInsetPct}%`,
          right: `${spec.sideInsetPct}%`,
        }}
      >
        <span className="absolute top-1.5 left-1.5 text-[9px] font-mono-tabular font-semibold text-emerald-300 bg-black/65 px-1.5 py-0.5 rounded">
          SAFE AREA · {spec.label} ({spec.specText})
        </span>
      </div>
    </div>
  );
};
