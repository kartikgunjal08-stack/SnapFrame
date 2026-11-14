export type FrameType =
  | "none"
  | "macos-dark"
  | "macos-light"
  | "browser"
  | "iphone"
  | "tablet"
  | "glass";

export type AspectRatioId = "auto" | "16:9" | "4:5" | "1:1" | "16:10";

export type ShadowLevel = "none" | "soft" | "elevated" | "dramatic";

export type TiltPreset = "flat" | "left" | "right" | "hero" | "editorial";

export type BackdropPattern = "none" | "dots" | "grid" | "spotlight" | "rings";

export type SampleId = "saas" | "mobile" | "code" | "ecommerce" | "ai" | "social";

export type ExportFormat = "png" | "jpeg";

export type ExportScale = 1 | 2 | 3;

export type AppView = "studio" | "templates" | "guide";

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

export interface StudioState {
  imageSrc: string;
  imageName: string;
  activeSampleId: SampleId | null;
  mockupData: MockupContentData;
  frame: FrameType;
  browserUrl: string;
  windowTitle: string;
  aspectRatio: AspectRatioId;
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
  showCaption: boolean;
  captionEyebrow: string;
  captionTitle: string;
  captionSubtitle: string;
  captionPosition: "top" | "bottom";
  captionLightText: boolean;
  exportFormat: ExportFormat;
  exportScale: ExportScale;
}
