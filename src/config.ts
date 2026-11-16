export type FontMood = "modern" | "editorial" | "technical" | "bold";

export interface SponsorConfig {
  enabled: boolean;
  label: string;
  name: string;
  description: string;
  url: string;
}

export interface DefaultBrandKitConfig {
  brandName: string;
  primaryColor: string;
  secondaryAccent: string;
  domainBadge: string;
  showDomainBadge: boolean;
  logoDataUrl: string | null;
  fontMood: FontMood;
}

export interface AppConfig {
  appName: string;
  domainLabel: string;
  defaultBrowserUrl: string;
  defaultWindowTitle: string;
  requireRedeemAuth: boolean;
  defaultBrandKit: DefaultBrandKitConfig;
  sponsorSlot: SponsorConfig;
}

/**
 * Centralized Application Configuration.
 * Buyers can customize branding, default Brand Kit DNA, frame titles,
 * auth gate behavior, or enable a sidebar sponsor card from this single file.
 */
export const APP_CONFIG: AppConfig = {
  appName: "SnapFramy",
  domainLabel: "snapframy.app",
  defaultBrowserUrl: "app.snapframy.io/analytics",
  defaultWindowTitle: "Revenue Overview — Q4",
  // Requires Email + Password + Purchased Redeem Code login on first visit
  // when VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY are configured.
  requireRedeemAuth: true,
  defaultBrandKit: {
    brandName: "SnapFramy",
    primaryColor: "#2563EB",
    secondaryAccent: "#60A5FA",
    domainBadge: "snapframy.app",
    showDomainBadge: false,
    logoDataUrl: null,
    fontMood: "modern",
  },
  sponsorSlot: {
    enabled: false,
    label: "Sponsor",
    name: "",
    description: "",
    url: "",
  },
};
