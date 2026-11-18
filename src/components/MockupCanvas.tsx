import React, { useEffect, useState } from "react";
import { Upload, RotateCcw, ZoomIn, ZoomOut, Lock, ShieldCheck, Maximize2, Minimize2, Crop, Play, Sparkles } from "lucide-react";
import { APP_CONFIG } from "../config";
import { ASPECT_RATIO_OPTIONS, BACKGROUND_PRESETS } from "../data/presets";
import {
  BrandKit,
  CanvasSelectedElement,
  MockupContentData,
  ShadowLevel,
  StudioCssAnimation,
  StudioState,
} from "../types/studio";
import { getFontMoodClasses } from "../utils/brandKitStorage";
import { InlineEditable } from "./InlineEditable";
import { LiveSceneRenderer } from "./LiveSceneRenderer";
import { QuickActionDock, STUDIO_IMAGE_FILTERS } from "./QuickActionDock";
import { SafeZoneOverlay } from "./SafeZoneOverlay";

interface MockupCanvasProps {
  state: StudioState;
  brandKit: BrandKit;
  isExporting: boolean;
  exportRef: React.RefObject<HTMLDivElement | null>;
  deviceRef: React.RefObject<HTMLDivElement | null>;
  onUpdate: (patch: Partial<StudioState>) => void;
  onUpdateMockupData: <K extends keyof MockupContentData>(
    scene: K,
    patch: Partial<MockupContentData[K]>
  ) => void;
  onUploadFile: (file: File) => void;
  onResetStudio: () => void;
  onOpenCrop: () => void;
  isPreviewLocked?: boolean;
  onRequireAuthForUpload?: () => void;
}

const SHADOW_MAP: Record<ShadowLevel, string> = {
  none: "none",
  soft: "0 14px 35px -8px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.2)",
  elevated: "0 28px 60px -12px rgba(0, 0, 0, 0.52), 0 12px 24px -6px rgba(0, 0, 0, 0.3)",
  dramatic: "0 45px 95px -18px rgba(0, 0, 0, 0.72), 0 18px 40px -10px rgba(0, 0, 0, 0.45)",
};

const NOISE_SVG_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

export const MockupCanvas: React.FC<MockupCanvasProps> = ({
  state,
  brandKit,
  isExporting,
  exportRef,
  deviceRef,
  onUpdate,
  onUpdateMockupData,
  onUploadFile,
  onResetStudio,
  onOpenCrop,
  isPreviewLocked = false,
  onRequireAuthForUpload,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [stageZoom, setStageZoom] = useState<number>(100);
  const [selectedElement, setSelectedElement] = useState<CanvasSelectedElement | null>(null);
  const [imgAspect, setImgAspect] = useState<number>(1.6);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animReplayKey, setAnimReplayKey] = useState(0);

  const activeAnim: StudioCssAnimation = state.cssAnimation ?? "tilt-orbit";
  const animClass =
    !isExporting && activeAnim !== "none" ? `mockup-seq-${activeAnim}` : "";

  const ANIM_CYCLE: { id: StudioCssAnimation; label: string }[] = [
    { id: "tilt-orbit", label: "3D Sway" },
    { id: "entrance-rise", label: "Entrance" },
    { id: "float-hover", label: "Float" },
    { id: "spring-pop", label: "Spring" },
    { id: "none", label: "Static" },
  ];
  const activeAnimMeta = ANIM_CYCLE.find((a) => a.id === activeAnim) || ANIM_CYCLE[0];

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedElement(null);
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const activeFilterCss =
    STUDIO_IMAGE_FILTERS.find((f) => f.id === (state.imageFilter || "none"))?.css || "none";

  const activeBg =
    BACKGROUND_PRESETS.find((b) => b.id === state.backgroundId) || BACKGROUND_PRESETS[0];

  const activeRatio = ASPECT_RATIO_OPTIONS.find((r) => r.id === state.aspectRatio);
  const fonts = getFontMoodClasses(brandKit.fontMood);

  const backgroundStyle: React.CSSProperties = state.customBgImage
    ? {
        backgroundImage: `url(${state.customBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : state.useCustomSolid
      ? { backgroundColor: state.customSolidColor }
      : { backgroundImage: activeBg.style };

  const isDarkBackdrop = state.customBgImage
    ? true
    : state.useCustomSolid
      ? (() => {
          const hex = state.customSolidColor.replace("#", "");
          if (hex.length !== 6) return true;
          const r = parseInt(hex.slice(0, 2), 16);
          const g = parseInt(hex.slice(2, 4), 16);
          const b = parseInt(hex.slice(4, 6), 16);
          return (r * 299 + g * 587 + b * 114) / 1000 < 140;
        })()
      : activeBg.isDark;

  const getPatternStyle = (): React.CSSProperties | null => {
    if (state.pattern === "none") return null;
    if (state.pattern === "dots") {
      const color = isDarkBackdrop ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)";
      return {
        backgroundImage: `radial-gradient(${color} 1.15px, transparent 1.15px)`,
        backgroundSize: "18px 18px",
      };
    }
    if (state.pattern === "grid") {
      const color = isDarkBackdrop ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";
      return {
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
      };
    }
    if (state.pattern === "spotlight") {
      const color = isDarkBackdrop ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.55)";
      return {
        backgroundImage: `radial-gradient(circle at 50% 42%, ${color} 0%, transparent 66%)`,
      };
    }
    if (state.pattern === "rings") {
      const color = isDarkBackdrop ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.07)";
      return {
        backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 44px, ${color} 45px, transparent 46px)`,
      };
    }
    return null;
  };

  const patternStyle = getPatternStyle();

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (isPreviewLocked && onRequireAuthForUpload) {
        onRequireAuthForUpload();
        return;
      }
      onUploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const isPhone = state.frame === "iphone";
  const isTablet = state.frame === "tablet";
  const isGlass = state.frame === "glass";
  const innerRadius = Math.max(0, state.borderRadius - 2);

  const isWideDesktopMedia = state.activeSampleId
    ? state.activeSampleId !== "mobile"
    : imgAspect > 1.12;
  const effectivePhoneFit = state.phoneFit ?? (isWideDesktopMedia ? "showcase" : "pan");
  const phonePanPct = state.phonePanX ?? 50;

  const stageWidth =
    state.aspectRatio === "appstore-69" ||
    state.aspectRatio === "appstore-65" ||
    state.aspectRatio === "play-store" ||
    state.aspectRatio === "9:16"
      ? "420px"
      : state.aspectRatio === "4:5"
        ? "560px"
        : state.aspectRatio === "1:1"
          ? "640px"
          : "780px";

  const renderScreenContent = (extraClassName = "", imgStyle?: React.CSSProperties) => {
    const lx = state.loupeX ?? 0.58;
    const ly = state.loupeY ?? 0.42;

    const inner = state.activeSampleId ? (
      <LiveSceneRenderer
        sampleId={state.activeSampleId}
        data={state.mockupData}
        isExporting={isExporting}
        onUpdateData={onUpdateMockupData}
      />
    ) : (
      <img
        src={state.imageSrc}
        alt="Screenshot mockup preview"
        referrerPolicy="no-referrer"
        onLoad={(e) => {
          const el = e.currentTarget;
          if (el.naturalWidth > 0 && el.naturalHeight > 0) {
            setImgAspect(el.naturalWidth / el.naturalHeight);
          }
        }}
        style={imgStyle}
        className={`w-full h-auto block ${extraClassName}`}
      />
    );

    const filtered =
      activeFilterCss === "none" ? (
        inner
      ) : (
        <div style={{ filter: activeFilterCss }} className="w-full h-full">
          {inner}
        </div>
      );

    if (!state.loupeEnabled) return filtered;

    return (
      <div
        className="relative w-full h-full cursor-crosshair"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const nx = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
          const ny = Math.max(0.08, Math.min(0.92, (e.clientY - rect.top) / rect.height));
          onUpdate({ loupeX: nx, loupeY: ny });
        }}
        title="Click anywhere on screenshot to move Spotlight Loupe"
      >
        {filtered}

        {/* Spotlight Focus Ring + 2x Magnifier Lens for uploaded images */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20"
          style={{ left: `${lx * 100}%`, top: `${ly * 100}%` }}
        >
          {!state.activeSampleId ? (
            <div
              className="w-24 h-24 rounded-full border-2 shadow-2xl bg-[#07090F]"
              style={{
                borderColor: brandKit.secondaryAccent || "#60A5FA",
                boxShadow: `0 12px 32px rgba(0,0,0,0.65), 0 0 0 4px ${brandKit.primaryColor}35`,
                backgroundImage: `url("${state.imageSrc}")`,
                backgroundRepeat: "no-repeat",
                backgroundSize: "210%",
                backgroundPosition: `${lx * 100}% ${ly * 100}%`,
              }}
            />
          ) : (
            <div
              className="w-16 h-16 rounded-full border-2 shadow-xl"
              style={{
                borderColor: brandKit.secondaryAccent || "#60A5FA",
                backgroundColor: `${brandKit.primaryColor}28`,
                boxShadow: `0 0 0 6px ${brandKit.primaryColor}25`,
              }}
            />
          )}

          {state.loupeLabel && state.loupeLabel.trim() && (
            <div
              className="mt-2 mx-auto whitespace-nowrap px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xl border text-center"
              style={{
                background: "rgba(12, 15, 25, 0.92)",
                borderColor: brandKit.secondaryAccent || "#60A5FA",
              }}
            >
              {state.loupeLabel.trim()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const showChromeText = state.showFrameHeader !== false;

  const renderFrameChrome = () => {
    if (!showChromeText) return null;

    if (state.frame === "macos-dark") {
      return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1C1D22] border-b border-white/[0.08] select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          {showChromeText && (
            <InlineEditable
              value={state.windowTitle || APP_CONFIG.defaultWindowTitle}
              onChange={(val) => onUpdate({ windowTitle: val })}
              className="text-[11px] font-medium text-zinc-400 truncate max-w-[260px]"
            />
          )}
          <div className="w-10" />
        </div>
      );
    }

    if (state.frame === "macos-light") {
      return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#F4F4F6] border-b border-black/[0.08] select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          {showChromeText && (
            <InlineEditable
              lightSurface
              value={state.windowTitle || APP_CONFIG.defaultWindowTitle}
              onChange={(val) => onUpdate({ windowTitle: val })}
              className="text-[11px] font-medium text-zinc-600 truncate max-w-[260px]"
            />
          )}
          <div className="w-10" />
        </div>
      );
    }

    if (state.frame === "browser") {
      return (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#16171C] border-b border-white/[0.08] select-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-600/80" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            {showChromeText && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.06] text-[11px] text-zinc-300 font-mono-tabular max-w-[280px] w-full justify-center">
                <Lock className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                <InlineEditable
                  value={state.browserUrl || APP_CONFIG.defaultBrowserUrl}
                  onChange={(val) => onUpdate({ browserUrl: val })}
                  className="truncate"
                />
              </div>
            )}
          </div>
          <div className="w-10 shrink-0" />
        </div>
      );
    }

    return null;
  };

  const renderCaption = () => {
    if (!state.showCaption) return null;
    const eyebrowColor = state.captionLightText ? "text-white/70" : "text-zinc-500";
    const textColor = state.captionLightText ? "text-white" : "text-zinc-900";
    const subColor = state.captionLightText ? "text-white/75" : "text-zinc-600";

    return (
      <div className="text-center max-w-xl mx-auto px-4 select-none space-y-1">
        {(state.captionEyebrow || !isExporting) && (
          <div>
            <InlineEditable
              lightSurface={!state.captionLightText}
              value={state.captionEyebrow}
              placeholder="Add eyebrow..."
              onChange={(val) => onUpdate({ captionEyebrow: val })}
              className={`text-[11px] font-semibold uppercase tracking-[0.14em] inline-block ${eyebrowColor}`}
            />
          </div>
        )}
        <div>
          <InlineEditable
            as="h2"
            lightSurface={!state.captionLightText}
            value={state.captionTitle}
            placeholder="Click to add headline..."
            onChange={(val) => onUpdate({ captionTitle: val })}
            className={`font-display font-bold tracking-tight leading-tight text-balance inline-block ${textColor}`}
            style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.65rem)", ...fonts.displayStyle }}
          />
        </div>
        {(state.captionSubtitle || !isExporting) && (
          <div>
            <InlineEditable
              as="p"
              lightSurface={!state.captionLightText}
              value={state.captionSubtitle}
              placeholder="Click to add subtitle..."
              onChange={(val) => onUpdate({ captionSubtitle: val })}
              className={`text-xs sm:text-sm leading-relaxed inline-block ${subColor}`}
              style={fonts.bodyStyle}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-[#060608] overflow-hidden"
          : "relative flex-1 flex flex-col min-w-0 studio-canvas-grid overflow-hidden"
      }
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Minimal Stage Sub-Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E1E24] bg-[#0D0D10]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5 text-xs text-zinc-400 min-w-0">
          <span className="font-mono-tabular text-zinc-300 whitespace-nowrap">
            {activeRatio?.label}
            {activeRatio?.pixelSpec
              ? ` (${activeRatio.pixelSpec.width}×${activeRatio.pixelSpec.height})`
              : ""}
          </span>
          <span aria-hidden="true" className="text-zinc-600">
            ·
          </span>
          <span className="text-zinc-400 truncate">
            {isFullscreen
              ? "Full Screen Preview (Press Esc to exit)"
              : state.activeSampleId
                ? "Click any text or chart on mockup to edit"
                : `${state.imageName} · Drop image or Ctrl+V`}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {state.safeZoneId !== "none" && !isFullscreen && (
            <button
              type="button"
              onClick={() => onUpdate({ showSafeZone: !state.showSafeZone })}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium mr-1 cursor-pointer ${
                state.showSafeZone
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Toggle Safe-Zone Compliance Overlay"
            >
              <ShieldCheck className="w-3 h-3" />
              Safe-Zone
            </button>
          )}
          <button
            type="button"
            onClick={() => setStageZoom((z) => Math.max(50, z - 10))}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Zoom out preview"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono-tabular text-zinc-300 w-10 text-center">
            {stageZoom}%
          </span>
          <button
            type="button"
            onClick={() => setStageZoom((z) => Math.min(150, z + 10))}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Zoom in preview"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-[#23232A] mx-1" />
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? "Exit Full Screen (Esc)" : "Full Screen Preview (no export needed)"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isFullscreen
                ? "bg-[#2563EB] border-[#3B82F6] text-white"
                : "bg-[#16161C] border-[#262632] text-zinc-200 hover:text-white hover:border-[#3A3A48]"
            }`}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                Fullscreen
              </>
            )}
          </button>
          {!isFullscreen && (
            <>
              <div className="flex items-center rounded-md bg-[#16161C] border border-[#262632] overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const idx = ANIM_CYCLE.findIndex((a) => a.id === activeAnim);
                    const next = ANIM_CYCLE[(idx + 1) % ANIM_CYCLE.length];
                    onUpdate({ cssAnimation: next.id });
                    setAnimReplayKey((k) => k + 1);
                  }}
                  title="Switch CSS 3D / entrance animation sequence"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-zinc-200 hover:text-white hover:bg-white/[0.05] whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                  <span>{activeAnimMeta.label}</span>
                </button>
                {activeAnim !== "none" && (
                  <button
                    type="button"
                    onClick={() => setAnimReplayKey((k) => k + 1)}
                    title="Replay CSS animation sequence"
                    className="px-1.5 py-1 border-l border-[#262632] text-zinc-400 hover:text-white hover:bg-white/[0.05] cursor-pointer"
                  >
                    <Play className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onOpenCrop}
                title="Crop screenshot so it automatically fits inside the frame"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#16161C] border border-[#262632] text-zinc-200 hover:text-white hover:border-[#3A3A48] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Crop className="w-3.5 h-3.5 text-[#60A5FA]" />
                Crop
              </button>
              <button
                type="button"
                onClick={() => {
                  setStageZoom(100);
                  onResetStudio();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Centered Interactive Stage */}
      <div
        onClick={() => setSelectedElement(null)}
        className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto studio-scroll"
      >
        <div
          className="transition-transform duration-150 ease-out origin-center max-w-full"
          style={{ transform: `scale(${stageZoom / 100})` }}
        >
          {/* Export Target Container */}
          <div
            ref={exportRef}
            onClick={(e) => {
              e.stopPropagation();
              if (!isFullscreen) setSelectedElement("backdrop");
            }}
            className={`relative flex flex-col items-center justify-center overflow-hidden select-none transition-shadow ${
              !isExporting && !isFullscreen && selectedElement === "backdrop"
                ? "ring-2 ring-[#3B82F6]/60"
                : ""
            }`}
            style={{
              ...backgroundStyle,
              aspectRatio: activeRatio?.ratioValue || undefined,
              padding: `${state.padding}px`,
              width: stageWidth,
              maxWidth: "100%",
              borderRadius: "4px",
            }}
          >
            {/* Film Grain Overlay */}
            {state.grainOpacity > 0 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mix-blend-overlay"
                style={{
                  backgroundImage: NOISE_SVG_URI,
                  opacity: state.grainOpacity / 100,
                }}
              />
            )}

            {/* Backdrop Pattern Overlay */}
            {patternStyle && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={patternStyle}
              />
            )}

            {/* Store Compliance Safe-Zone Guide Overlay (Never exported) */}
            <SafeZoneOverlay
              safeZoneId={state.safeZoneId}
              visible={state.showSafeZone && !isExporting}
            />

            {/* Top Caption */}
            {state.showCaption && state.captionPosition === "top" && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement("caption");
                }}
                className={`relative z-10 mb-6 w-full rounded-lg py-1 transition-shadow cursor-pointer ${
                  !isExporting && selectedElement === "caption"
                    ? "ring-2 ring-[#3B82F6]/65"
                    : ""
                }`}
              >
                {renderCaption()}
              </div>
            )}

            {/* CSS Animation Sequence + 3D Perspective Mockup Wrapper */}
            <div
              key={`${activeAnim}-${animReplayKey}`}
              className={`relative z-10 w-full flex items-center justify-center ${animClass}`}
            >
              <div
                ref={deviceRef}
                data-mockup-device="true"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement("device");
                }}
                className={`relative flex items-center justify-center transition-transform duration-200 ease-out cursor-pointer rounded-xl ${
                  !isExporting && selectedElement === "device"
                    ? "ring-2 ring-[#3B82F6]/70 ring-offset-4 ring-offset-transparent"
                    : ""
                }`}
                style={{
                  width: isPhone ? `${Math.round((308 * state.scale) / 100)}px` : `${state.scale}%`,
                  maxWidth: "100%",
                  transform: `perspective(1400px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg) rotateZ(${state.rotateZ}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
              {isPhone ? (
                <div className="relative w-full">
                  <div
                    className="relative w-full bg-[#121215] p-[10px] border border-white/15"
                    style={{
                      borderRadius: `${Math.max(30, state.borderRadius + 16)}px`,
                      boxShadow: SHADOW_MAP[state.shadow],
                    }}
                  >
                    <div className="absolute top-[16px] left-1/2 -translate-x-1/2 w-[72px] h-[18px] bg-black rounded-full z-20 flex items-center justify-end px-2 pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-[#171A26] border border-white/10" />
                    </div>
                    <div
                      className={`relative overflow-hidden bg-[#090B10] ${
                        isWideDesktopMedia ? "aspect-[9/19] flex flex-col items-center justify-center" : ""
                      }`}
                      style={{ borderRadius: `${Math.max(22, state.borderRadius + 8)}px` }}
                    >
                      {/* Ambient blurred backdrop inside tall phone screen for desktop screenshots */}
                      {isWideDesktopMedia && !state.activeSampleId && (
                        <img
                          src={state.imageSrc}
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-35 blur-lg scale-125"
                        />
                      )}
                      {isWideDesktopMedia && state.activeSampleId && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 opacity-45"
                          style={{
                            background: `radial-gradient(circle at 30% 25%, ${brandKit.primaryColor}66 0%, transparent 55%), radial-gradient(circle at 75% 75%, ${brandKit.secondaryAccent}44 0%, transparent 60%)`,
                          }}
                        />
                      )}

                      {!isWideDesktopMedia ? (
                        renderScreenContent("object-cover")
                      ) : effectivePhoneFit === "pan" ? (
                        state.activeSampleId ? (
                          <div className="relative z-10 w-full h-full overflow-hidden flex items-center">
                            <div
                              className="w-[460px] shrink-0 origin-left"
                              style={{
                                transform: `translateX(-${Math.round((phonePanPct / 100) * 185)}px) scale(0.96)`,
                              }}
                            >
                              {renderScreenContent()}
                            </div>
                          </div>
                        ) : (
                          renderScreenContent("!h-full w-full object-cover relative z-10", {
                            objectPosition: `${phonePanPct}% 50%`,
                          })
                        )
                      ) : effectivePhoneFit === "fit" ? (
                        <div className="relative z-10 w-full px-2">
                          <div className="rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-[#0B0D12]">
                            {renderScreenContent()}
                          </div>
                        </div>
                      ) : (
                        /* "showcase" ambient phone inner stage (wide Pop-Out card sits right above bezel below) */
                        <div className="relative z-10 mt-auto mb-4 px-3 w-full flex items-center justify-between text-[9px] font-mono-tabular text-white/55">
                          <span className="truncate">{brandKit.brandName || "Desktop View"}</span>
                          <span>HD</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pop-Out Wide Desktop Showcase Card across the front of the iPhone bezel */}
                  {isWideDesktopMedia && effectivePhoneFit === "showcase" && (
                    <div
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-[116%] rounded-xl overflow-hidden border border-white/25 bg-[#0B0D12]"
                      style={{
                        boxShadow: "0 26px 58px -10px rgba(0,0,0,0.82), 0 0 0 1px rgba(255,255,255,0.08)",
                      }}
                    >
                      {showChromeText && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-[#181920] border-b border-white/[0.08]">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                            <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                            <span className="w-2 h-2 rounded-full bg-[#27C93F]" />
                          </div>
                          <span className="text-[9px] font-mono-tabular text-zinc-400 truncate max-w-[160px]">
                            {state.browserUrl || brandKit.domainBadge}
                          </span>
                          <span className="w-6" />
                        </div>
                      )}
                      <div className="overflow-hidden">{renderScreenContent()}</div>
                    </div>
                  )}
                </div>
              ) : isTablet ? (
                <div
                  className="relative w-full bg-[#101115] p-[14px] border border-white/15"
                  style={{
                    borderRadius: `${Math.max(22, state.borderRadius + 10)}px`,
                    boxShadow: SHADOW_MAP[state.shadow],
                  }}
                >
                  <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#1F2433] border border-white/15 pointer-events-none" />
                  <div
                    className="overflow-hidden bg-black border border-white/[0.06]"
                    style={{ borderRadius: `${Math.max(12, state.borderRadius + 2)}px` }}
                  >
                    {renderScreenContent()}
                  </div>
                </div>
              ) : isGlass ? (
                <div
                  className="w-full p-2.5 sm:p-3 bg-white/[0.08] backdrop-blur-md border border-white/25"
                  style={{
                    borderRadius: `${state.borderRadius + 8}px`,
                    boxShadow: SHADOW_MAP[state.shadow],
                  }}
                >
                  <div
                    className="overflow-hidden border border-white/15 bg-[#0B0D12]"
                    style={{ borderRadius: `${state.borderRadius}px` }}
                  >
                    {renderScreenContent()}
                  </div>
                </div>
              ) : (
                <div
                  className="w-full overflow-hidden border border-white/[0.12] bg-[#0B0D12]"
                  style={{
                    borderRadius: `${state.borderRadius}px`,
                    boxShadow: SHADOW_MAP[state.shadow],
                  }}
                >
                  {renderFrameChrome()}
                  <div
                    className="overflow-hidden"
                    style={
                      showChromeText
                        ? {
                            borderBottomLeftRadius: `${innerRadius}px`,
                            borderBottomRightRadius: `${innerRadius}px`,
                          }
                        : { borderRadius: `${innerRadius}px` }
                    }
                  >
                    {renderScreenContent()}
                  </div>
                </div>
              )}
              </div>
            </div>

            {/* Bottom Caption */}
            {state.showCaption && state.captionPosition === "bottom" && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedElement("caption");
                }}
                className={`relative z-10 mt-6 w-full rounded-lg py-1 transition-shadow cursor-pointer ${
                  !isExporting && selectedElement === "caption"
                    ? "ring-2 ring-[#3B82F6]/65"
                    : ""
                }`}
              >
                {renderCaption()}
              </div>
            )}

            {/* Brand Kit Logo & Domain Badge */}
            {showChromeText && (brandKit.showDomainBadge || brandKit.logoDataUrl) && (
              <div
                className={`absolute bottom-3 right-4 z-20 flex items-center gap-2 text-[11px] font-mono-tabular font-semibold ${
                  isDarkBackdrop ? "text-white/80" : "text-zinc-800/80"
                }`}
              >
                {brandKit.logoDataUrl && (
                  <img
                    src={brandKit.logoDataUrl}
                    alt={brandKit.brandName}
                    className="w-4 h-4 rounded object-contain"
                  />
                )}
                {brandKit.showDomainBadge && <span>{brandKit.domainBadge}</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Context-Sensitive Quick-Action Dock (Hidden during export or fullscreen) */}
      {!isExporting && !isFullscreen && (
        <QuickActionDock
          selectedElement={selectedElement}
          state={state}
          onUpdate={onUpdate}
          onUploadFile={onUploadFile}
          isPreviewLocked={isPreviewLocked}
          onRequireAuthForUpload={onRequireAuthForUpload}
          onResetPosition={() => {
            setStageZoom(100);
            onUpdate({
              tiltPreset: "flat",
              rotateX: 0,
              rotateY: 0,
              rotateZ: 0,
              scale: 92,
              padding: 48,
            });
          }}
          onOpenCrop={onOpenCrop}
          onClose={() => setSelectedElement(null)}
        />
      )}

      {/* Drag-and-Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-[#0A0A0C]/85 backdrop-blur-sm border-2 border-dashed border-[#3B82F6] m-3 rounded-xl flex flex-col items-center justify-center gap-3 pointer-events-none">
          <div className="w-12 h-12 rounded-xl bg-[#2563EB]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#60A5FA]">
            <Upload className="w-6 h-6" />
          </div>
          <p className="font-display text-base font-semibold text-white">
            Drop screenshot to load onto canvas
          </p>
          <p className="text-xs text-zinc-400">PNG, JPG, WebP, or SVG supported locally</p>
        </div>
      )}
    </div>
  );
};
