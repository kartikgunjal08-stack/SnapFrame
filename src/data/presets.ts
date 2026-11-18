import { AspectRatioOption, BackgroundPreset, SampleId, StudioState } from "../types/studio";
import { DEFAULT_MOCKUP_DATA } from "../utils/sampleSvgBuilder";

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "cobalt-eclipse",
    name: "Cobalt Eclipse",
    style:
      "radial-gradient(at 18% 20%, #2563eb 0px, transparent 55%), radial-gradient(at 85% 80%, #1e1b4b 0px, transparent 55%), linear-gradient(135deg, #090d16 0%, #111827 50%, #0f172a 100%)",
    swatch: "linear-gradient(135deg, #2563eb 0%, #0f172a 100%)",
    isDark: true,
  },
  {
    id: "obsidian-steel",
    name: "Obsidian Steel",
    style:
      "radial-gradient(at 80% 15%, #334155 0px, transparent 50%), radial-gradient(at 15% 85%, #18181b 0px, transparent 55%), linear-gradient(135deg, #09090b 0%, #18181b 100%)",
    swatch: "linear-gradient(135deg, #334155 0%, #09090b 100%)",
    isDark: true,
  },
  {
    id: "sunset-ember",
    name: "Sunset Ember",
    style:
      "radial-gradient(at 15% 20%, #f97316 0px, transparent 52%), radial-gradient(at 85% 85%, #be123c 0px, transparent 58%), linear-gradient(135deg, #431407 0%, #881337 100%)",
    swatch: "linear-gradient(135deg, #f97316 0%, #be123c 100%)",
    isDark: true,
  },
  {
    id: "emerald-dusk",
    name: "Emerald Dusk",
    style:
      "radial-gradient(at 20% 25%, #059669 0px, transparent 52%), radial-gradient(at 85% 75%, #0f766e 0px, transparent 55%), linear-gradient(135deg, #022c22 0%, #0f172a 100%)",
    swatch: "linear-gradient(135deg, #10b981 0%, #064e3b 100%)",
    isDark: true,
  },
  {
    id: "nordic-mist",
    name: "Nordic Mist",
    style:
      "radial-gradient(at 20% 20%, #e0f2fe 0px, transparent 55%), radial-gradient(at 80% 80%, #f1f5f9 0px, transparent 55%), linear-gradient(135deg, #cbd5e1 0%, #f8fafc 100%)",
    swatch: "linear-gradient(135deg, #e0f2fe 0%, #cbd5e1 100%)",
    isDark: false,
  },
  {
    id: "warm-alabaster",
    name: "Warm Alabaster",
    style:
      "radial-gradient(at 25% 15%, #fef3c7 0px, transparent 55%), radial-gradient(at 80% 85%, #e7e5e4 0px, transparent 55%), linear-gradient(135deg, #f5f5f4 0%, #d6d3d1 100%)",
    swatch: "linear-gradient(135deg, #fef3c7 0%, #d6d3d1 100%)",
    isDark: false,
  },
  {
    id: "oceanic-slate",
    name: "Oceanic Slate",
    style:
      "radial-gradient(at 80% 20%, #0284c7 0px, transparent 55%), radial-gradient(at 15% 80%, #1e293b 0px, transparent 60%), linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)",
    swatch: "linear-gradient(135deg, #0284c7 0%, #0f172a 100%)",
    isDark: true,
  },
  {
    id: "amber-horizon",
    name: "Amber Horizon",
    style:
      "radial-gradient(at 20% 80%, #d97706 0px, transparent 55%), radial-gradient(at 85% 20%, #451a03 0px, transparent 55%), linear-gradient(135deg, #1c1917 0%, #78350f 100%)",
    swatch: "linear-gradient(135deg, #f59e0b 0%, #292524 100%)",
    isDark: true,
  },
  {
    id: "rose-quartz",
    name: "Rose Quartz",
    style:
      "radial-gradient(at 20% 20%, #ffe4e6 0px, transparent 55%), radial-gradient(at 85% 80%, #fecdd3 0px, transparent 55%), linear-gradient(135deg, #fff1f2 0%, #e2e8f0 100%)",
    swatch: "linear-gradient(135deg, #fecdd3 0%, #e2e8f0 100%)",
    isDark: false,
  },
  {
    id: "graphite-carbon",
    name: "Graphite Carbon",
    style: "linear-gradient(160deg, #18181b 0%, #09090b 100%)",
    swatch: "linear-gradient(160deg, #27272a 0%, #09090b 100%)",
    isDark: true,
  },
  {
    id: "studio-white",
    name: "Studio White",
    style: "linear-gradient(160deg, #ffffff 0%, #f4f4f5 100%)",
    swatch: "linear-gradient(160deg, #ffffff 0%, #e4e4e7 100%)",
    isDark: false,
  },
  {
    id: "electric-cyan",
    name: "Arctic Cobalt",
    style:
      "radial-gradient(at 75% 20%, #38bdf8 0px, transparent 55%), radial-gradient(at 20% 80%, #1d4ed8 0px, transparent 58%), linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
    swatch: "linear-gradient(135deg, #38bdf8 0%, #1d4ed8 100%)",
    isDark: true,
  },
  {
    id: "indigo-pulse",
    name: "Indigo Pulse",
    style:
      "radial-gradient(at 25% 25%, #6366f1 0px, transparent 55%), radial-gradient(at 80% 80%, #312e81 0px, transparent 58%), linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
    swatch: "linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%)",
    isDark: true,
  },
  {
    id: "carbon-emerald",
    name: "Carbon Emerald",
    style:
      "radial-gradient(at 85% 20%, #10b981 0px, transparent 45%), radial-gradient(at 15% 85%, #064e3b 0px, transparent 50%), linear-gradient(145deg, #09090b 0%, #06281e 100%)",
    swatch: "linear-gradient(135deg, #10b981 0%, #09090b 100%)",
    isDark: true,
  },
  {
    id: "terracotta-silk",
    name: "Terracotta Silk",
    style:
      "radial-gradient(at 20% 20%, #fed7aa 0px, transparent 55%), radial-gradient(at 85% 80%, #fdba74 0px, transparent 55%), linear-gradient(135deg, #fff7ed 0%, #e7e5e4 100%)",
    swatch: "linear-gradient(135deg, #fed7aa 0%, #e7e5e4 100%)",
    isDark: false,
  },
  {
    id: "frost-silver",
    name: "Frost Silver",
    style:
      "radial-gradient(at 70% 15%, #e2e8f0 0px, transparent 50%), radial-gradient(at 20% 85%, #cbd5e1 0px, transparent 55%), linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%)",
    swatch: "linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)",
    isDark: false,
  },
  {
    id: "deep-burgundy",
    name: "Deep Burgundy",
    style:
      "radial-gradient(at 20% 20%, #e11d48 0px, transparent 50%), radial-gradient(at 80% 85%, #4c0519 0px, transparent 55%), linear-gradient(135deg, #1f0610 0%, #881337 100%)",
    swatch: "linear-gradient(135deg, #e11d48 0%, #1f0610 100%)",
    isDark: true,
  },
  {
    id: "cyber-slate",
    name: "Cyber Slate",
    style:
      "radial-gradient(at 15% 80%, #06b6d4 0px, transparent 50%), radial-gradient(at 85% 15%, #1e293b 0px, transparent 55%), linear-gradient(135deg, #020617 0%, #0f172a 100%)",
    swatch: "linear-gradient(135deg, #06b6d4 0%, #020617 100%)",
    isDark: true,
  },
  {
    id: "champagne-sand",
    name: "Champagne Sand",
    style:
      "radial-gradient(at 30% 20%, #fef08a 0px, transparent 48%), radial-gradient(at 80% 80%, #e7e5e4 0px, transparent 55%), linear-gradient(135deg, #fafaf9 0%, #d6d3d1 100%)",
    swatch: "linear-gradient(135deg, #fef08a 0%, #d6d3d1 100%)",
    isDark: false,
  },
  {
    id: "titanium-charcoal",
    name: "Titanium Charcoal",
    style:
      "radial-gradient(at 50% 0%, #3f3f46 0px, transparent 60%), linear-gradient(180deg, #18181b 0%, #09090b 100%)",
    swatch: "linear-gradient(180deg, #3f3f46 0%, #09090b 100%)",
    isDark: true,
  },
  {
    id: "ocean-teal",
    name: "Ocean Teal",
    style:
      "radial-gradient(at 20% 25%, #14b8a6 0px, transparent 52%), radial-gradient(at 85% 80%, #0e7490 0px, transparent 55%), linear-gradient(135deg, #042f2e 0%, #083344 100%)",
    swatch: "linear-gradient(135deg, #14b8a6 0%, #083344 100%)",
    isDark: true,
  },
  {
    id: "monochrome-ink",
    name: "Monochrome Ink",
    style: "linear-gradient(135deg, #0a0a0a 0%, #171717 50%, #050505 100%)",
    swatch: "linear-gradient(135deg, #262626 0%, #050505 100%)",
    isDark: true,
  },
  {
    id: "coral-glow",
    name: "Coral Glow",
    style:
      "radial-gradient(at 20% 20%, #fb7185 0px, transparent 52%), radial-gradient(at 85% 85%, #fdba74 0px, transparent 55%), linear-gradient(135deg, #fff1f2 0%, #ffedd5 100%)",
    swatch: "linear-gradient(135deg, #fb7185 0%, #fdba74 100%)",
    isDark: false,
  },
  {
    id: "aurora-night",
    name: "Aurora Night",
    style:
      "radial-gradient(at 20% 20%, #34d399 0px, transparent 48%), radial-gradient(at 80% 25%, #3b82f6 0px, transparent 50%), linear-gradient(135deg, #090d16 0%, #111827 100%)",
    swatch: "linear-gradient(135deg, #34d399 0%, #3b82f6 100%)",
    isDark: true,
  },
  {
    id: "violet-nebula",
    name: "Royal Dusk",
    style:
      "radial-gradient(at 20% 25%, #4f46e5 0px, transparent 55%), radial-gradient(at 80% 80%, #0ea5e9 0px, transparent 55%), linear-gradient(135deg, #0b1120 0%, #1e1b4b 100%)",
    swatch: "linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)",
    isDark: true,
  },
  {
    id: "mint-linen",
    name: "Mint Linen",
    style:
      "radial-gradient(at 20% 20%, #d1fae5 0px, transparent 55%), radial-gradient(at 85% 80%, #e0f2fe 0px, transparent 55%), linear-gradient(135deg, #ecfdf5 0%, #f1f5f9 100%)",
    swatch: "linear-gradient(135deg, #a7f3d0 0%, #e0f2fe 100%)",
    isDark: false,
  },
  {
    id: "bronze-obsidian",
    name: "Bronze Obsidian",
    style:
      "radial-gradient(at 75% 20%, #b45309 0px, transparent 52%), radial-gradient(at 18% 85%, #292524 0px, transparent 55%), linear-gradient(135deg, #0c0a09 0%, #292524 100%)",
    swatch: "linear-gradient(135deg, #d97706 0%, #1c1917 100%)",
    isDark: true,
  },
  {
    id: "skyline-ice",
    name: "Skyline Ice",
    style:
      "radial-gradient(at 25% 20%, #bae6fd 0px, transparent 55%), radial-gradient(at 85% 85%, #ddd6fe 0px, transparent 55%), linear-gradient(135deg, #f0f9ff 0%, #f5f3ff 100%)",
    swatch: "linear-gradient(135deg, #bae6fd 0%, #ddd6fe 100%)",
    isDark: false,
  },
];

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { id: "auto", label: "Auto", platform: "Adaptive" },
  {
    id: "16:9",
    label: "16:9",
    platform: "X / YouTube",
    ratioValue: "16 / 9",
    pixelSpec: { width: 1600, height: 900 },
    safeZoneId: "x-twitter",
  },
  { id: "16:10", label: "16:10", platform: "Product Hunt", ratioValue: "16 / 10" },
  {
    id: "4:5",
    label: "4:5",
    platform: "LinkedIn",
    ratioValue: "4 / 5",
    pixelSpec: { width: 1080, height: 1350 },
    safeZoneId: "linkedin",
  },
  { id: "1:1", label: "1:1", platform: "Square", ratioValue: "1 / 1" },
  {
    id: "9:16",
    label: "9:16",
    platform: "IG Story",
    ratioValue: "9 / 16",
    pixelSpec: { width: 1080, height: 1920 },
    safeZoneId: "instagram-story",
  },
  {
    id: "appstore-69",
    label: "App Store 6.9\"",
    platform: "1320×2868",
    ratioValue: "1320 / 2868",
    pixelSpec: { width: 1320, height: 2868 },
    safeZoneId: "appstore-69",
    isStoreSpec: true,
  },
  {
    id: "appstore-65",
    label: "App Store 6.5\"",
    platform: "1284×2778",
    ratioValue: "1284 / 2778",
    pixelSpec: { width: 1284, height: 2778 },
    safeZoneId: "appstore-65",
    isStoreSpec: true,
  },
  {
    id: "play-store",
    label: "Google Play",
    platform: "1080×1920",
    ratioValue: "1080 / 1920",
    pixelSpec: { width: 1080, height: 1920 },
    safeZoneId: "play-store",
    isStoreSpec: true,
  },
  {
    id: "product-hunt",
    label: "PH Gallery",
    platform: "1270×760",
    ratioValue: "1270 / 760",
    pixelSpec: { width: 1270, height: 760 },
    safeZoneId: "product-hunt",
    isStoreSpec: true,
  },
  {
    id: "chrome-store",
    label: "Chrome Store",
    platform: "1280×800",
    ratioValue: "1280 / 800",
    pixelSpec: { width: 1280, height: 800 },
    safeZoneId: "chrome-store",
    isStoreSpec: true,
  },
];

export const SOCIAL_EXPORT_PRESETS: import("../types/studio").SocialExportPreset[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    formatLabel: "4:5 Feed Post",
    aspectRatio: "4:5",
    safeZoneId: "linkedin",
    pixelSpec: { width: 1080, height: 1350 },
    recommendedPadding: 48,
    recommendedScale: 92,
    safeZoneSummary: "Clears top header crop & bottom reaction bar",
    fileTag: "linkedin-1080x1350",
  },
  {
    id: "x-twitter",
    name: "X (Twitter)",
    formatLabel: "16:9 Timeline Card",
    aspectRatio: "16:9",
    safeZoneId: "x-twitter",
    pixelSpec: { width: 1600, height: 900 },
    recommendedPadding: 40,
    recommendedScale: 86,
    safeZoneSummary: "Clears timeline crop & ALT media badge",
    fileTag: "x-twitter-1600x900",
  },
  {
    id: "instagram-story",
    name: "Instagram Story",
    formatLabel: "9:16 Fullscreen",
    aspectRatio: "9:16",
    safeZoneId: "instagram-story",
    pixelSpec: { width: 1080, height: 1920 },
    recommendedPadding: 34,
    recommendedScale: 94,
    safeZoneSummary: "Clears 14% top header & 18% bottom reply bar",
    fileTag: "instagram-story-1080x1920",
  },
];

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_MOCKUPS: Record<SampleId, { label: string; src: string; recommendedFrame: StudioState["frame"] }> = {
  saas: {
    label: "SaaS Analytics",
    recommendedFrame: "macos-dark",
    src: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
  <rect width="1200" height="760" fill="#0B0E14"/>
  <rect x="0" y="0" width="230" height="760" fill="#0F131B"/>
  <line x1="230" y1="0" x2="230" y2="760" stroke="#1E2532" stroke-width="1"/>
  <rect x="28" y="34" width="28" height="28" rx="7" fill="#2563EB"/>
  <path d="M36 48L42 54L50 42" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="68" y="54" fill="#F8FAFC" font-family="sans-serif" font-size="18" font-weight="700">MetricPulse</text>
  <rect x="24" y="96" width="182" height="36" rx="8" fill="#182030"/>
  <text x="42" y="119" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600">Overview</text>
  <text x="42" y="160" fill="#94A3B8" font-family="sans-serif" font-size="14">Revenue Cohort</text>
  <text x="42" y="198" fill="#94A3B8" font-family="sans-serif" font-size="14">Subscriptions</text>
  <text x="42" y="236" fill="#94A3B8" font-family="sans-serif" font-size="14">Churn Analysis</text>
  <text x="42" y="274" fill="#94A3B8" font-family="sans-serif" font-size="14">API Usage</text>

  <text x="272" y="56" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="700">Executive Revenue Summary</text>
  <text x="272" y="80" fill="#64748B" font-family="sans-serif" font-size="13">Real-time net MRR &amp; expansion metrics across 142 workspaces</text>
  <rect x="1010" y="36" width="146" height="36" rx="8" fill="#2563EB"/>
  <text x="1040" y="59" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">Export Report</text>

  <rect x="272" y="112" width="280" height="124" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="296" y="144" fill="#94A3B8" font-family="sans-serif" font-size="13">Monthly Recurring Revenue</text>
  <text x="296" y="186" fill="#F8FAFC" font-family="sans-serif" font-size="34" font-weight="700">$48,920</text>
  <text x="296" y="214" fill="#34D399" font-family="sans-serif" font-size="13" font-weight="600">+18.4% vs last 30 days</text>

  <rect x="574" y="112" width="280" height="124" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="598" y="144" fill="#94A3B8" font-family="sans-serif" font-size="13">Active Paid Teams</text>
  <text x="598" y="186" fill="#F8FAFC" font-family="sans-serif" font-size="34" font-weight="700">1,284</text>
  <text x="598" y="214" fill="#34D399" font-family="sans-serif" font-size="13" font-weight="600">+94 new teams this week</text>

  <rect x="876" y="112" width="280" height="124" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="900" y="144" fill="#94A3B8" font-family="sans-serif" font-size="13">Net Dollar Retention</text>
  <text x="900" y="186" fill="#F8FAFC" font-family="sans-serif" font-size="34" font-weight="700">114.2%</text>
  <text x="900" y="214" fill="#60A5FA" font-family="sans-serif" font-size="13" font-weight="600">Top decile benchmark</text>

  <rect x="272" y="260" width="884" height="296" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="298" y="296" fill="#F8FAFC" font-family="sans-serif" font-size="16" font-weight="600">Net Growth Trajectory (Last 12 Weeks)</text>
  <line x1="298" y1="340" x2="1128" y2="340" stroke="#1A2130" stroke-width="1"/>
  <line x1="298" y1="400" x2="1128" y2="400" stroke="#1A2130" stroke-width="1"/>
  <line x1="298" y1="460" x2="1128" y2="460" stroke="#1A2130" stroke-width="1"/>
  <line x1="298" y1="520" x2="1128" y2="520" stroke="#1A2130" stroke-width="1"/>

  <defs>
    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2563EB" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#2563EB" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M300 495 C380 480, 440 465, 510 438 C580 410, 640 422, 710 386 C780 350, 860 362, 930 326 C1000 292, 1070 305, 1126 280 L1126 520 L300 520 Z" fill="url(#areaGrad)"/>
  <path d="M300 495 C380 480, 440 465, 510 438 C580 410, 640 422, 710 386 C780 350, 860 362, 930 326 C1000 292, 1070 305, 1126 280" stroke="#3B82F6" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="1126" cy="280" r="6" fill="#60A5FA" stroke="#0B0E14" stroke-width="2"/>

  <rect x="272" y="580" width="884" height="140" rx="12" fill="#111622" stroke="#1E2532"/>
  <text x="298" y="614" fill="#94A3B8" font-family="sans-serif" font-size="13" font-weight="600">RECENT ENTERPRISE UPGRADES</text>
  <text x="298" y="652" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600">Northwind Logistics</text>
  <text x="580" y="652" fill="#94A3B8" font-family="sans-serif" font-size="14">Annual Scale Plan</text>
  <text x="1068" y="652" fill="#34D399" font-family="sans-serif" font-size="14" font-weight="600">+$2,400</text>
  <line x1="298" y1="670" x2="1128" y2="670" stroke="#1A2130" stroke-width="1"/>
  <text x="298" y="698" fill="#F8FAFC" font-family="sans-serif" font-size="14" font-weight="600">Verve Studio Berlin</text>
  <text x="580" y="698" fill="#94A3B8" font-family="sans-serif" font-size="14">Team Pro (12 seats)</text>
  <text x="1084" y="698" fill="#34D399" font-family="sans-serif" font-size="14" font-weight="600">+$588</text>
</svg>`),
  },
  mobile: {
    label: "Mobile Fintech",
    recommendedFrame: "iphone",
    src: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="440" height="920" viewBox="0 0 440 920" fill="none">
  <rect width="440" height="920" fill="#090B10"/>
  <text x="32" y="72" fill="#94A3B8" font-family="sans-serif" font-size="14">Total Portfolio Balance</text>
  <text x="32" y="114" fill="#FFFFFF" font-family="sans-serif" font-size="40" font-weight="700">$24,815.40</text>
  <text x="32" y="144" fill="#34D399" font-family="sans-serif" font-size="14" font-weight="600">+$1,420.10 (+6.07%) this month</text>

  <rect x="32" y="176" width="180" height="46" rx="12" fill="#2563EB"/>
  <text x="90" y="205" fill="#FFFFFF" font-family="sans-serif" font-size="15" font-weight="600">Transfer</text>
  <rect x="228" y="176" width="180" height="46" rx="12" fill="#161B26" stroke="#232B3A"/>
  <text x="288" y="205" fill="#E2E8F0" font-family="sans-serif" font-size="15" font-weight="600">Deposit</text>

  <rect x="32" y="250" width="376" height="190" rx="18" fill="#121722" stroke="#1F2736"/>
  <text x="54" y="284" fill="#94A3B8" font-family="sans-serif" font-size="13">Treasury Yield · 4.85% APY</text>
  <path d="M54 395 C110 385, 150 360, 210 352 C265 344, 310 318, 384 295" stroke="#38BDF8" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="384" cy="295" r="5" fill="#38BDF8"/>
  <text x="54" y="422" fill="#64748B" font-family="sans-serif" font-size="12">Updated 2 minutes ago</text>

  <text x="32" y="482" fill="#F8FAFC" font-family="sans-serif" font-size="17" font-weight="700">Recent Activity</text>

  <rect x="32" y="502" width="376" height="74" rx="14" fill="#11151F" stroke="#1B2230"/>
  <rect x="48" y="519" width="40" height="40" rx="10" fill="#1E293B"/>
  <text x="61" y="544" fill="#60A5FA" font-family="sans-serif" font-size="16" font-weight="700">S</text>
  <text x="104" y="535" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="600">Stripe Payout</text>
  <text x="104" y="556" fill="#64748B" font-family="sans-serif" font-size="12">Today · 09:42 AM</text>
  <text x="316" y="544" fill="#34D399" font-family="sans-serif" font-size="15" font-weight="700">+$2,450</text>

  <rect x="32" y="590" width="376" height="74" rx="14" fill="#11151F" stroke="#1B2230"/>
  <rect x="48" y="607" width="40" height="40" rx="10" fill="#1E293B"/>
  <text x="60" y="632" fill="#FBBF24" font-family="sans-serif" font-size="16" font-weight="700">V</text>
  <text x="104" y="623" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="600">Vercel Pro Hosting</text>
  <text x="104" y="644" fill="#64748B" font-family="sans-serif" font-size="12">Yesterday · Auto-pay</text>
  <text x="334" y="632" fill="#E2E8F0" font-family="sans-serif" font-size="15" font-weight="600">-$20.00</text>

  <rect x="32" y="678" width="376" height="74" rx="14" fill="#11151F" stroke="#1B2230"/>
  <rect x="48" y="695" width="40" height="40" rx="10" fill="#1E293B"/>
  <text x="60" y="720" fill="#34D399" font-family="sans-serif" font-size="16" font-weight="700">F</text>
  <text x="104" y="711" fill="#F8FAFC" font-family="sans-serif" font-size="15" font-weight="600">Figma Organization</text>
  <text x="104" y="732" fill="#64748B" font-family="sans-serif" font-size="12">Nov 12 · Card 4821</text>
  <text x="334" y="720" fill="#E2E8F0" font-family="sans-serif" font-size="15" font-weight="600">-$45.00</text>

  <rect x="130" y="886" width="180" height="5" rx="3" fill="#334155"/>
</svg>`),
  },
  code: {
    label: "Code Release",
    recommendedFrame: "macos-dark",
    src: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560" fill="none">
  <rect width="960" height="560" fill="#0D1117"/>
  <text x="48" y="76" fill="#6E7681" font-family="monospace" font-size="20">1</text>
  <text x="96" y="76" fill="#FF7B72" font-family="monospace" font-size="20">export async function</text>
  <text x="364" y="76" fill="#D2A8FF" font-family="monospace" font-size="20">generateMockup</text>
  <text x="532" y="76" fill="#E6EDF3" font-family="monospace" font-size="20">(canvas: HTMLElement) {</text>

  <text x="48" y="120" fill="#6E7681" font-family="monospace" font-size="20">2</text>
  <text x="120" y="120" fill="#FF7B72" font-family="monospace" font-size="20">const</text>
  <text x="192" y="120" fill="#79C0FF" font-family="monospace" font-size="20">blob</text>
  <text x="252" y="120" fill="#E6EDF3" font-family="monospace" font-size="20">=</text>
  <text x="276" y="120" fill="#FF7B72" font-family="monospace" font-size="20">await</text>
  <text x="348" y="120" fill="#D2A8FF" font-family="monospace" font-size="20">renderHighDpiPng</text>
  <text x="540" y="120" fill="#E6EDF3" font-family="monospace" font-size="20">(canvas, {</text>

  <text x="48" y="164" fill="#6E7681" font-family="monospace" font-size="20">3</text>
  <text x="144" y="164" fill="#79C0FF" font-family="monospace" font-size="20">pixelRatio:</text>
  <text x="292" y="164" fill="#A5D6FF" font-family="monospace" font-size="20">3,</text>

  <text x="48" y="208" fill="#6E7681" font-family="monospace" font-size="20">4</text>
  <text x="144" y="208" fill="#79C0FF" font-family="monospace" font-size="20">preservePerspective:</text>
  <text x="396" y="208" fill="#79C0FF" font-family="monospace" font-size="20">true,</text>

  <text x="48" y="252" fill="#6E7681" font-family="monospace" font-size="20">5</text>
  <text x="144" y="252" fill="#79C0FF" font-family="monospace" font-size="20">shadowDepth:</text>
  <text x="296" y="252" fill="#A5D6FF" font-family="monospace" font-size="20">'dramatic',</text>

  <text x="48" y="296" fill="#6E7681" font-family="monospace" font-size="20">6</text>
  <text x="120" y="296" fill="#E6EDF3" font-family="monospace" font-size="20">});</text>

  <text x="48" y="340" fill="#6E7681" font-family="monospace" font-size="20">7</text>

  <text x="48" y="384" fill="#6E7681" font-family="monospace" font-size="20">8</text>
  <text x="120" y="384" fill="#FF7B72" font-family="monospace" font-size="20">return</text>
  <text x="204" y="384" fill="#D2A8FF" font-family="monospace" font-size="20">downloadAsset</text>
  <text x="360" y="384" fill="#E6EDF3" font-family="monospace" font-size="20">(blob,</text>
  <text x="444" y="384" fill="#A5D6FF" font-family="monospace" font-size="20">'launch-card-3x.png'</text>
  <text x="672" y="384" fill="#E6EDF3" font-family="monospace" font-size="20">);</text>

  <text x="48" y="428" fill="#6E7681" font-family="monospace" font-size="20">9</text>
  <text x="96" y="428" fill="#E6EDF3" font-family="monospace" font-size="20">}</text>

  <rect x="48" y="468" width="864" height="48" rx="8" fill="#161B22" stroke="#30363D"/>
  <text x="72" y="498" fill="#3FB950" font-family="monospace" font-size="16">PASS  Exported 3600×2250px lossless PNG in 142ms (0 server calls)</text>
</svg>`),
  },
  ecommerce: {
    label: "Storefront UI",
    recommendedFrame: "browser",
    src: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
  <rect width="1200" height="760" fill="#FAFAF9"/>
  <rect x="0" y="0" width="1200" height="72" fill="#FFFFFF"/>
  <line x1="0" y1="72" x2="1200" y2="72" stroke="#E7E5E4"/>
  <text x="56" y="44" fill="#1C1917" font-family="sans-serif" font-size="20" font-weight="700">ATELIER NORD</text>
  <text x="450" y="43" fill="#57534E" font-family="sans-serif" font-size="14" font-weight="500">New Arrivals</text>
  <text x="580" y="43" fill="#57534E" font-family="sans-serif" font-size="14" font-weight="500">Lighting</text>
  <text x="678" y="43" fill="#57534E" font-family="sans-serif" font-size="14" font-weight="500">Objects</text>
  <rect x="1030" y="20" width="114" height="34" rx="8" fill="#1C1917"/>
  <text x="1060" y="42" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">Cart (2)</text>

  <rect x="56" y="108" width="540" height="596" rx="18" fill="#E7E5E4"/>
  <rect x="116" y="170" width="420" height="440" rx="14" fill="#D6D3D1"/>
  <circle cx="326" cy="340" r="110" fill="#FAFAF9"/>
  <rect x="266" y="430" width="120" height="120" rx="12" fill="#44403C"/>
  <text x="88" y="670" fill="#57534E" font-family="sans-serif" font-size="13" font-weight="600">ARCHITECTURAL SERIES · EDITION 04</text>

  <text x="644" y="156" fill="#78716C" font-family="sans-serif" font-size="13" font-weight="600">STUDIO LIGHTING · IN STOCK</text>
  <text x="644" y="206" fill="#1C1917" font-family="sans-serif" font-size="38" font-weight="700">Kanso Ceramic Lamp</text>
  <text x="644" y="252" fill="#1C1917" font-family="sans-serif" font-size="26" font-weight="600">$280.00</text>
  <text x="762" y="250" fill="#16A34A" font-family="sans-serif" font-size="14" font-weight="600">Free worldwide shipping</text>

  <text x="644" y="306" fill="#57534E" font-family="sans-serif" font-size="15">Hand-thrown matte stoneware base paired with a warm diffused</text>
  <text x="644" y="330" fill="#57534E" font-family="sans-serif" font-size="15">opal glass shade. Dimmable 2700K warm architectural LED.</text>

  <text x="644" y="388" fill="#1C1917" font-family="sans-serif" font-size="13" font-weight="600">FINISH</text>
  <circle cx="662" cy="422" r="16" fill="#F5F5F4" stroke="#1C1917" stroke-width="2"/>
  <circle cx="706" cy="422" r="16" fill="#44403C"/>
  <circle cx="750" cy="422" r="16" fill="#A8A29E"/>

  <rect x="644" y="476" width="496" height="54" rx="10" fill="#1C1917"/>
  <text x="832" y="509" fill="#FFFFFF" font-family="sans-serif" font-size="15" font-weight="600">Add to Bag — $280</text>

  <rect x="644" y="556" width="240" height="92" rx="12" fill="#FFFFFF" stroke="#E7E5E4"/>
  <text x="668" y="592" fill="#78716C" font-family="sans-serif" font-size="12">CONVERSION RATE</text>
  <text x="668" y="626" fill="#1C1917" font-family="sans-serif" font-size="24" font-weight="700">4.82% (+1.1%)</text>

  <rect x="900" y="556" width="240" height="92" rx="12" fill="#FFFFFF" stroke="#E7E5E4"/>
  <text x="924" y="592" fill="#78716C" font-family="sans-serif" font-size="12">TODAY REVENUE</text>
  <text x="924" y="626" fill="#1C1917" font-family="sans-serif" font-size="24" font-weight="700">$6,440</text>
</svg>`),
  },
  ai: {
    label: "AI Copilot",
    recommendedFrame: "glass",
    src: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="760" viewBox="0 0 1200 760" fill="none">
  <rect width="1200" height="760" fill="#090A0F"/>
  <rect x="0" y="0" width="250" height="760" fill="#0E1017"/>
  <line x1="250" y1="0" x2="250" y2="760" stroke="#1E2230"/>
  <text x="28" y="48" fill="#F8FAFC" font-family="sans-serif" font-size="17" font-weight="700">ContextAgent</text>
  <rect x="24" y="76" width="202" height="38" rx="9" fill="#1D4ED8"/>
  <text x="66" y="100" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">+ New Thread</text>
  <text x="28" y="154" fill="#64748B" font-family="sans-serif" font-size="11" font-weight="600">RECENT WORKFLOWS</text>
  <rect x="20" y="170" width="210" height="36" rx="8" fill="#161A26"/>
  <text x="34" y="193" fill="#E2E8F0" font-family="sans-serif" font-size="13">Q4 Churn Root-Cause</text>
  <text x="34" y="232" fill="#94A3B8" font-family="sans-serif" font-size="13">SQL Cohort Builder</text>
  <text x="34" y="268" fill="#94A3B8" font-family="sans-serif" font-size="13">Landing Copy Audit</text>

  <rect x="310" y="54" width="830" height="78" rx="14" fill="#121520" stroke="#22283A"/>
  <text x="336" y="88" fill="#94A3B8" font-family="sans-serif" font-size="12" font-weight="600">YOU ASKED</text>
  <text x="336" y="114" fill="#F8FAFC" font-family="sans-serif" font-size="15">Summarize why Pro upgrades jumped 24% after adding 1-click exports.</text>

  <rect x="310" y="158" width="830" height="432" rx="16" fill="#0F131D" stroke="#252C40"/>
  <text x="338" y="198" fill="#60A5FA" font-family="sans-serif" font-size="13" font-weight="700">COPILOT ANALYSIS · 14,200 SESSIONS SCANNED</text>
  <text x="338" y="240" fill="#E2E8F0" font-family="sans-serif" font-size="16" font-weight="600">1. Time-to-value dropped from 4m 10s to 38 seconds</text>
  <text x="338" y="268" fill="#94A3B8" font-family="sans-serif" font-size="14">Users who exported a graphic within their first minute converted at 3.4x higher rates.</text>

  <rect x="338" y="302" width="774" height="148" rx="12" fill="#090C12" stroke="#1E2536"/>
  <text x="362" y="336" fill="#79C0FF" font-family="monospace" font-size="14">SELECT cohort_week, COUNT(*) AS exports, AVG(upgrade_rate) AS conv</text>
  <text x="362" y="364" fill="#E2E8F0" font-family="monospace" font-size="14">FROM studio_events WHERE action = 'export_3x_png'</text>
  <text x="362" y="392" fill="#34D399" font-family="monospace" font-size="14">-- Result: +24.3% lift across 1,840 organic workspaces</text>
  <text x="362" y="424" fill="#94A3B8" font-family="monospace" font-size="13">Executed in 42ms · Verified against Warehouse Replica</text>

  <text x="338" y="492" fill="#E2E8F0" font-family="sans-serif" font-size="16" font-weight="600">2. Recommended Next Action</text>
  <text x="338" y="520" fill="#94A3B8" font-family="sans-serif" font-size="14">Promote the 16:10 Product Hunt preset directly in the onboarding checklist.</text>
  <rect x="338" y="544" width="184" height="30" rx="6" fill="#182235" stroke="#2B3E63"/>
  <text x="356" y="564" fill="#93C5FD" font-family="sans-serif" font-size="12" font-weight="600">Apply Recommendation</text>

  <rect x="310" y="618" width="830" height="72" rx="14" fill="#121520" stroke="#283046"/>
  <text x="338" y="660" fill="#64748B" font-family="sans-serif" font-size="15">Ask a follow-up question or attach a CSV / SQL table...</text>
  <rect x="1032" y="634" width="90" height="40" rx="9" fill="#2563EB"/>
  <text x="1062" y="659" fill="#FFFFFF" font-family="sans-serif" font-size="13" font-weight="600">Send</text>
</svg>`),
  },
  social: {
    label: "Creator Card",
    recommendedFrame: "none",
    src: svgToDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600" fill="none">
  <rect width="960" height="600" fill="#111216"/>
  <circle cx="108" cy="108" r="36" fill="#2563EB"/>
  <text x="95" y="116" fill="#FFFFFF" font-family="sans-serif" font-size="22" font-weight="700">AK</text>
  <text x="164" y="102" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="700">Aarav Kulkarni</text>
  <text x="164" y="130" fill="#94A3B8" font-family="sans-serif" font-size="15">@aaravbuilds · Founder, ShipFast Labs</text>

  <text x="72" y="216" fill="#F8FAFC" font-family="sans-serif" font-size="30" font-weight="600">Small, focused tools beat bloated platforms.</text>
  <text x="72" y="264" fill="#CBD5E1" font-family="sans-serif" font-size="24">We replaced 4 separate design subscriptions with</text>
  <text x="72" y="302" fill="#CBD5E1" font-family="sans-serif" font-size="24">one clean browser mockup studio — zero logins,</text>
  <text x="72" y="340" fill="#CBD5E1" font-family="sans-serif" font-size="24">instant 3x PNG exports, and 150+ templates.</text>

  <rect x="72" y="392" width="816" height="106" rx="14" fill="#171920" stroke="#262936"/>
  <text x="104" y="434" fill="#94A3B8" font-family="sans-serif" font-size="13" font-weight="600">VERIFIED IMPACT · 30-DAY LAUNCH LOG</text>
  <text x="104" y="472" fill="#34D399" font-family="sans-serif" font-size="22" font-weight="700">14,820 exports</text>
  <text x="360" y="472" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="700">38s avg workflow</text>
  <text x="660" y="472" fill="#60A5FA" font-family="sans-serif" font-size="22" font-weight="700">$0 server cost</text>

  <text x="72" y="548" fill="#64748B" font-family="sans-serif" font-size="14">9:14 AM · Nov 14, 2026 · 1,420 Reposts · 6,890 Likes</text>
</svg>`),
  },
};

export type TemplateCategory =
  | "Launch"
  | "Social"
  | "Mobile"
  | "Engineering"
  | "Editorial"
  | "Marketing"
  | "AI & Agents"
  | "E-Commerce";

export interface SceneTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  patch: Partial<StudioState>;
}

export const INITIAL_STUDIO_STATE: StudioState = {
  imageSrc: SAMPLE_MOCKUPS.saas.src,
  imageName: "saas-analytics.svg",
  activeSampleId: "saas",
  mockupData: DEFAULT_MOCKUP_DATA,
  frame: "macos-dark",
  showFrameHeader: true,
  browserUrl: "app.snapframy.io/analytics",
  windowTitle: "Revenue Overview — Q4",
  aspectRatio: "16:10",
  safeZoneId: "none",
  showSafeZone: false,
  backgroundId: "cobalt-eclipse",
  customSolidColor: "#1e293b",
  useCustomSolid: false,
  customBgImage: null,
  pattern: "spotlight",
  grainOpacity: 8,
  padding: 56,
  borderRadius: 14,
  scale: 92,
  shadow: "dramatic",
  tiltPreset: "flat",
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  cssAnimation: "tilt-orbit",
  showCaption: true,
  captionEyebrow: "New Release",
  captionTitle: "Real-time revenue metrics, zero setup.",
  captionSubtitle: "Track MRR, expansion, and cohort retention in one clean workspace.",
  captionPosition: "top",
  captionLightText: true,
  exportFormat: "png",
  exportScale: 2,
};

