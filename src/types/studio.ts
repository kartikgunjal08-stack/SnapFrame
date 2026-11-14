export type FrameType = "none" | "macos-dark" | "macos-light" | "browser" | "iphone";

export type AspectRatioId = "auto" | "16:9" | "4:5" | "1:1" | "16:10";

export type ShadowLevel = "none" | "soft" | "elevated" | "dramatic";

export type TiltPreset = "flat" | "left" | "right" | "hero";

export type SampleId = "saas" | "mobile" | "code";

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

export interface StudioState {
  imageSrc: string;
  imageName: string;
  frame: FrameType;
  browserUrl: string;
  windowTitle: string;
  aspectRatio: AspectRatioId;
  backgroundId: string;
  customSolidColor: string;
  useCustomSolid: boolean;
  customBgImage: string | null;
  grainOpacity: number;
  padding: number;
  borderRadius: number;
  scale: number;
  shadow: ShadowLevel;
  tiltPreset: TiltPreset;
  rotateX: number;
  rotateY: number;
  showCaption: boolean;
  captionTitle: string;
  captionSubtitle: string;
  captionPosition: "top" | "bottom";
  captionLightText: boolean;
  exportFormat: ExportFormat;
  exportScale: ExportScale;
}
