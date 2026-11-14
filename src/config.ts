export interface SponsorConfig {
  enabled: boolean;
  label: string;
  name: string;
  description: string;
  url: string;
}

export interface AppConfig {
  appName: string;
  domainLabel: string;
  defaultBrowserUrl: string;
  defaultWindowTitle: string;
  sponsorSlot: SponsorConfig;
}

/**
 * Centralized Application Configuration.
 * Buyers can customize branding, default frame titles, or enable a sidebar
 * sponsor card from this single file.
 */
export const APP_CONFIG: AppConfig = {
  appName: "SnapFrame",
  domainLabel: "snapframe.app",
  defaultBrowserUrl: "app.snapframe.io/analytics",
  defaultWindowTitle: "Revenue Overview — Q4",
  sponsorSlot: {
    enabled: false,
    label: "Sponsor",
    name: "",
    description: "",
    url: "",
  },
};
