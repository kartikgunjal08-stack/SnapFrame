import { FontMood } from "../config";

export type FrameType =
  | "none"
  | "macos-dark"
  | "macos-light"
  | "browser"
  | "iphone"
  | "tablet"
  | "glass";

export type AspectRatioId =
  | "auto"
  | "16:9"
  | "4:5"
  | "1:1"
  | "16:10"
  | "9:16"
  | "appstore-69"
  | "appstore-65"
  | "play-store"
  | "product-hunt"
  | "chrome-store";

export type SafeZoneId =
  | "none"
  | "linkedin"
  | "x-twitter"
  | "instagram-story"
  | "appstore-69"
  | "appstore-65"
  | "play-store"
  | "product-hunt"
  | "chrome-store";

export type SocialExportPresetId = "linkedin" | "x-twitter" | "instagram-story";

export interface SocialExportPreset {
  id: SocialExportPresetId;
  name: string;
  formatLabel: string;
  aspectRatio: AspectRatioId;
  safeZoneId: Exclude<SafeZoneId, "none">;
  pixelSpec: { width: number; height: number };
  recommendedPadding: number;
  recommendedScale: number;
  safeZoneSummary: string;
  fileTag: string;
}

export type ShadowLevel = "none" | "soft" | "elevated" | "dramatic";

export type TiltPreset = "flat" | "left" | "right" | "hero" | "editorial";

export type BackdropPattern = "none" | "dots" | "grid" | "spotlight" | "rings";

export type SampleId = "saas" | "mobile" | "code" | "ecommerce" | "ai" | "social";

export type ExportFormat = "png" | "jpeg";

export type ExportScale = 1 | 2 | 3;

export type AppView = "studio" | "short-film" | "motion" | "carousel" | "templates" | "guide";

export interface BrandKit {
  brandName: string;
  primaryColor: string;
  secondaryAccent: string;
  domainBadge: string;
  showDomainBadge: boolean;
  logoDataUrl: string | null;
  fontMood: FontMood;
  autoApplyTemplates: boolean;
}

export interface BackgroundPreset {
  id: string;
  name: string;
  style: string;
  swatch: string;
  isDark: boolean;
}

export interface AspectRatioOption {
  id: AspectRatioId;
  label: string;
  platform: string;
  ratioValue?: string;
  pixelSpec?: { width: number; height: number };
  safeZoneId?: SafeZoneId;
  isStoreSpec?: boolean;
}

export type ChartType = "area" | "bar";

export interface SaasMockupData {
  brandName: string;
  headerTitle: string;
  headerSubtitle: string;
  ctaLabel: string;
  accentColor: string;
  kpi1Label: string;
  kpi1Value: string;
  kpi1Delta: string;
  kpi2Label: string;
  kpi2Value: string;
  kpi2Delta: string;
  kpi3Label: string;
  kpi3Value: string;
  kpi3Delta: string;
  chartTitle: string;
  chartType: ChartType;
  chartValues: string;
  row1Name: string;
  row1Plan: string;
  row1Amount: string;
  row2Name: string;
  row2Plan: string;
  row2Amount: string;
}

export interface MobileMockupData {
  subtitle: string;
  balance: string;
  delta: string;
  primaryBtn: string;
  secondaryBtn: string;
  accentColor: string;
  chartTitle: string;
  chartValues: string;
  activity1Title: string;
  activity1Sub: string;
  activity1Amount: string;
  activity2Title: string;
  activity2Sub: string;
  activity2Amount: string;
  activity3Title: string;
  activity3Sub: string;
  activity3Amount: string;
}

export interface CodeMockupData {
  codeText: string;
  statusText: string;
}

export interface EcommerceMockupData {
  brandName: string;
  badgeText: string;
  productName: string;
  price: string;
  shippingNote: string;
  description: string;
  ctaLabel: string;
  accentColor: string;
  metric1Label: string;
  metric1Value: string;
  metric2Label: string;
  metric2Value: string;
}

export interface AiMockupData {
  brandName: string;
  promptText: string;
  analysisHeader: string;
  finding1Title: string;
  finding1Body: string;
  codeLine1: string;
  codeLine2: string;
  codeLine3: string;
  ctaLabel: string;
  accentColor: string;
}

export interface SocialMockupData {
  initials: string;
  authorName: string;
  handle: string;
  headline: string;
  body: string;
  statsEyebrow: string;
  stat1: string;
  stat2: string;
  stat3: string;
  footerMeta: string;
  accentColor: string;
}

export interface MockupContentData {
  saas: SaasMockupData;
  mobile: MobileMockupData;
  code: CodeMockupData;
  ecommerce: EcommerceMockupData;
  ai: AiMockupData;
  social: SocialMockupData;
}

export type StudioImageFilterId =
  | "none"
  | "crisp-studio"
  | "warm-tone"
  | "desaturated"
  | "high-contrast"
  | "bleach-bypass";

export type CanvasSelectedElement = "device" | "caption" | "backdrop";

export interface StudioState {
  imageSrc: string;
  imageName: string;
  activeSampleId: SampleId | null;
  mockupData: MockupContentData;
  frame: FrameType;
  browserUrl: string;
  windowTitle: string;
  aspectRatio: AspectRatioId;
  safeZoneId: SafeZoneId;
  showSafeZone: boolean;
  backgroundId: string;
  customSolidColor: string;
  useCustomSolid: boolean;
  customBgImage: string | null;
  pattern: BackdropPattern;
  grainOpacity: number;
  padding: number;
  borderRadius: number;
  scale: number;
  shadow: ShadowLevel;
  tiltPreset: TiltPreset;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  imageFilter?: StudioImageFilterId;
  showCaption: boolean;
  captionEyebrow: string;
  captionTitle: string;
  captionSubtitle: string;
  captionPosition: "top" | "bottom";
  captionLightText: boolean;
  exportFormat: ExportFormat;
  exportScale: ExportScale;
}

/* ---------------- Motion / Video Template Types ---------------- */

export type MotionCategory =
  | "3D Card Flips & Reveals"
  | "Camera & Pan Motions"
  | "Multi-Device & Floating Elements"
  | "Social & Launch Loops"
  | "App Store & Kinetic Frames";

export type MotionEasing = "easeOut" | "spring" | "easeInOut" | "linear" | "expoOut";

export type MotionDuration = 3 | 5 | 8;

export type MotionAspectId = "16:9" | "16:10" | "4:5" | "1:1" | "9:16";

export interface MotionKeyframeSpec {
  startScale: number;
  endScale: number;
  startX: number; // normalized fraction of canvas width (-0.5..0.5)
  endX: number;
  startY: number;
  endY: number;
  startRotateDeg: number;
  endRotateDeg: number;
  tiltX: number; // simulated 3D perspective pitch (-28..28)
  tiltY: number; // simulated 3D perspective yaw (-28..28)
  startOpacity: number;
  endOpacity: number;
  flipAxis?: "none" | "horizontal" | "vertical" | "book";
  floatAmpY: number; // pixels
  floatFreq: number; // cycles across duration
  shadowPulse: boolean;
  shimmerSweep: boolean;
  multiDeviceMode?: "none" | "laptop-to-mobile" | "stagger-duet" | "stacked-cards";
  focusCrop?: "none" | "top-left" | "top-right" | "center" | "bottom";
  bounceSettle?: boolean;
}

export interface MotionPreset {
  id: string;
  name: string;
  category: MotionCategory;
  description: string;
  defaultDuration: MotionDuration;
  defaultEasing: MotionEasing;
  frameStyle: "macos-dark" | "macos-light" | "browser" | "iphone" | "glass" | "frameless";
  backdropColors: [string, string, string];
  pattern: BackdropPattern;
  headlineDefault: string;
  eyebrowDefault: string;
  motion: MotionKeyframeSpec;
}

/* ---------------- Continuous Carousel Builder Types ---------------- */

export type CarouselFormat = "linkedin-4x5" | "product-hunt" | "x-16x9" | "square-1x1";

export interface CarouselSlide {
  id: string;
  eyebrow: string;
  headline: string;
  subtitle: string;
  frame: FrameType;
  imageSrc: string;
  activeSampleId: SampleId | null;
  scale: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
}

/* ---------------- Short Film Motions (Multi-Screenshot Pro Editor) ---------------- */

export type ShortFilmCategory =
  | "Apple Keynote & Hardware"
  | "Linear & Stripe Launch"
  | "Kinetic Typography Edits"
  | "3D Camera & Depth"
  | "Viral Social & SaaS"
  | "Film, Glitch & Broadcast";

export type ShortFilmChoreography =
  | "whip-cut"
  | "bento-assemble"
  | "orbit-3d"
  | "domino-cascade"
  | "diagonal-split"
  | "shutter-slice"
  | "tunnel-zoom"
  | "parallax-stack";

export type ShortFilmTransition =
  | "whip-pan"
  | "flash-cut"
  | "chromatic-glitch"
  | "zoom-punch"
  | "iris-wipe"
  | "cube-swing";

export interface ShortFilmShot {
  id: string;
  imageSrc: string;
  label: string;
  caption: string;
  focusX?: number; // 0..1 normalized horizontal hotspot
  focusY?: number; // 0..1 normalized vertical hotspot
}

export interface BrandDealScript {
  clientName: string;
  problemHook: string;
  heroHeadline: string;
  proofStat1: string;
  proofStat2: string;
  proofStat3: string;
  offerBadge: string;
  ctaUrl: string;
  ctaSubtitle: string;
}

export interface SavedBrandDealProfile {
  id: string;
  name: string;
  script: BrandDealScript;
  filmLook: FilmLookConfig;
  presetId: string;
  duration: ShortFilmDuration;
}

export type FilmLookId =
  | "none"
  | "warm-tone"
  | "desaturated"
  | "high-contrast"
  | "bleach-bypass"
  | "teal-amber"
  | "noir-mono";

export interface FilmLookConfig {
  id: FilmLookId;
  intensity: number; // 0..100
  vignette: number; // 0..100
  filmGrain: number; // 0..100
}

export type ShortFilmDuration = 10 | 15 | 20 | 30;

export interface ShortFilmPreset {
  id: string;
  name: string;
  category: ShortFilmCategory;
  description: string;
  choreography: ShortFilmChoreography;
  transition: ShortFilmTransition;
  frameStyle: "macos-dark" | "macos-light" | "browser" | "iphone" | "glass" | "frameless";
  palette: [string, string, string];
  pattern: BackdropPattern;
  defaultDuration: ShortFilmDuration;
  commercialArc: boolean;
  motionBlurTrails: boolean;
  flashBeats: boolean;
  chromaticSplit: boolean;
  floorReflection: boolean;
  kineticText: boolean;
  particlesEnabled: boolean;
  cursorSpotlight: boolean;
  cinemaBars: boolean;
  tiltAngle: number;
  speedCurve: "snap" | "cinematic" | "hyper";
}


