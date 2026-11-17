import { APP_CONFIG, FontMood } from "../config";
import { BrandKit, StudioState } from "../types/studio";

const STORAGE_KEY = "snapframy_brand_kit_v1";

export function sanitizeHexColor(value: string | undefined | null, fallback: string): string {
  const trimmed = (value || "").trim();
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(trimmed)
    ? trimmed
    : fallback;
}

export function getDefaultBrandKit(): BrandKit {
  return {
    ...APP_CONFIG.defaultBrandKit,
    autoApplyTemplates: true,
  };
}

export function loadBrandKit(): BrandKit {
  const defaults = getDefaultBrandKit();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<BrandKit>;
    return {
      ...defaults,
      ...parsed,
      primaryColor: sanitizeHexColor(parsed.primaryColor, defaults.primaryColor),
      secondaryAccent: sanitizeHexColor(parsed.secondaryAccent, defaults.secondaryAccent),
    };
  } catch {
    return defaults;
  }
}

export function saveBrandKit(kit: BrandKit): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(kit));
  } catch {
    // ignore storage quota errors
  }
}

export function getFontMoodClasses(mood: FontMood): {
  displayStyle: React.CSSProperties;
  bodyStyle: React.CSSProperties;
} {
  if (mood === "editorial") {
    return {
      displayStyle: { fontFamily: "Georgia, 'Times New Roman', serif", letterSpacing: "-0.015em" },
      bodyStyle: { fontFamily: "'DM Sans', sans-serif" },
    };
  }
  if (mood === "technical") {
    return {
      displayStyle: { fontFamily: "'JetBrains Mono', monospace", letterSpacing: "-0.03em" },
      bodyStyle: { fontFamily: "'JetBrains Mono', monospace" },
    };
  }
  if (mood === "bold") {
    return {
      displayStyle: {
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        letterSpacing: "-0.035em",
        fontWeight: 800,
      },
      bodyStyle: { fontFamily: "'DM Sans', sans-serif" },
    };
  }
  return {
    displayStyle: { fontFamily: "'Plus Jakarta Sans', sans-serif" },
    bodyStyle: { fontFamily: "'DM Sans', sans-serif" },
  };
}

/**
 * Dynamically re-skins a StudioState (or template patch) using the active BrandKit DNA.
 */
export function applyBrandKitToStudioState(prev: StudioState, kit: BrandKit): StudioState {
  const cleanDomain = kit.domainBadge.trim() || APP_CONFIG.domainLabel;
  const cleanBrand = kit.brandName.trim() || APP_CONFIG.appName;
  const primary = /^#[0-9A-Fa-f]{6}$/.test(kit.primaryColor)
    ? kit.primaryColor
    : APP_CONFIG.defaultBrandKit.primaryColor;

  return {
    ...prev,
    browserUrl: cleanDomain.includes("/") ? cleanDomain : `${cleanDomain}/app`,
    windowTitle: `${cleanBrand} — Product Showcase`,
    mockupData: {
      ...prev.mockupData,
      saas: {
        ...prev.mockupData.saas,
        brandName: cleanBrand,
        accentColor: primary,
      },
      mobile: {
        ...prev.mockupData.mobile,
        accentColor: primary,
      },
      ecommerce: {
        ...prev.mockupData.ecommerce,
        brandName: cleanBrand.toUpperCase(),
        accentColor: primary,
      },
      ai: {
        ...prev.mockupData.ai,
        brandName: cleanBrand,
        accentColor: primary,
      },
      social: {
        ...prev.mockupData.social,
        initials: cleanBrand.slice(0, 2).toUpperCase(),
        accentColor: primary,
      },
    },
  };
}
