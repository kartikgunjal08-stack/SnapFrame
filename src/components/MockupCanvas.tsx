import React, { useState } from "react";
import { Upload, RotateCcw, ZoomIn, ZoomOut, Lock } from "lucide-react";
import { APP_CONFIG } from "../config";
import { ASPECT_RATIO_OPTIONS, BACKGROUND_PRESETS } from "../data/presets";
import { ShadowLevel, StudioState } from "../types/studio";

interface MockupCanvasProps {
  state: StudioState;
  exportRef: React.RefObject<HTMLDivElement | null>;
  onUploadFile: (file: File) => void;
  onResetStudio: () => void;
}

const SHADOW_MAP: Record<ShadowLevel, string> = {
  none: "none",
  soft: "0 14px 35px -8px rgba(0, 0, 0, 0.35), 0 4px 12px -2px rgba(0, 0, 0, 0.2)",
  elevated: "0 28px 60px -12px rgba(0, 0, 0, 0.52), 0 12px 24px -6px rgba(0, 0, 0, 0.3)",
  dramatic: "0 45px 95px -18px rgba(0, 0, 0, 0.72), 0 18px 40px -10px rgba(0, 0, 0, 0.45)",
};

// Lightweight inline SVG noise pattern so zero external requests are needed during export
const NOISE_SVG_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

export const MockupCanvas: React.FC<MockupCanvasProps> = ({
  state,
  exportRef,
  onUploadFile,
  onResetStudio,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [stageZoom, setStageZoom] = useState<number>(100);

  const activeBg =
    BACKGROUND_PRESETS.find((b) => b.id === state.backgroundId) || BACKGROUND_PRESETS[0];

  const activeRatio = ASPECT_RATIO_OPTIONS.find((r) => r.id === state.aspectRatio);

  const backgroundStyle: React.CSSProperties = state.customBgImage
    ? {
        backgroundImage: `url(${state.customBgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : state.useCustomSolid
      ? { backgroundColor: state.customSolidColor }
      : { backgroundImage: activeBg.style };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
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
  const innerRadius = Math.max(0, state.borderRadius - 2);

  const renderFrameChrome = () => {
    if (state.frame === "macos-dark") {
      return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1C1D22] border-b border-white/[0.08] select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56]" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F]" />
          </div>
          <span className="text-[11px] font-medium text-zinc-400 truncate max-w-[260px]">
            {state.windowTitle || APP_CONFIG.defaultWindowTitle}
          </span>
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
          <span className="text-[11px] font-medium text-zinc-600 truncate max-w-[260px]">
            {state.windowTitle || APP_CONFIG.defaultWindowTitle}
          </span>
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
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.05] border border-white/[0.06] text-[11px] text-zinc-300 font-mono-tabular max-w-[280px] w-full justify-center">
              <Lock className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
              <span className="truncate">{state.browserUrl || APP_CONFIG.defaultBrowserUrl}</span>
            </div>
          </div>
          <div className="w-10 shrink-0" />
        </div>
      );
    }

    return null;
  };

  const renderCaption = () => {
    if (!state.showCaption) return null;
    const textColor = state.captionLightText ? "text-white" : "text-zinc-900";
    const subColor = state.captionLightText ? "text-white/75" : "text-zinc-600";

    return (
      <div className="text-center max-w-xl mx-auto px-4 select-none">
        {state.captionTitle && (
          <h2
            className={`font-display font-bold tracking-tight leading-tight text-balance ${textColor}`}
            style={{ fontSize: "clamp(1.15rem, 2.2vw, 1.65rem)" }}
          >
            {state.captionTitle}
          </h2>
        )}
        {state.captionSubtitle && (
          <p className={`mt-1.5 text-xs sm:text-sm leading-relaxed ${subColor}`}>
            {state.captionSubtitle}
          </p>
        )}
      </div>
    );
  };

  return (
    <div
      className="relative flex-1 flex flex-col min-w-0 studio-canvas-grid overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Subtle Workspace Sub-Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1E1E24] bg-[#0D0D10]/90 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="truncate max-w-[200px] font-medium text-zinc-300">
            {state.imageName}
          </span>
          <span aria-hidden="true" className="text-zinc-600">
            ·
          </span>
          <span className="font-mono-tabular whitespace-nowrap">
            {activeRatio?.label} ({activeRatio?.platform})
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-zinc-600">
            ·
          </span>
          <span className="hidden sm:inline text-zinc-500 whitespace-nowrap">
            Drop image or Ctrl+V to paste
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setStageZoom((z) => Math.max(60, z - 10))}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Zoom out preview"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono-tabular text-zinc-300 w-10 text-center">
            {stageZoom}%
          </span>
          <button
            type="button"
            onClick={() => setStageZoom((z) => Math.min(120, z + 10))}
            className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Zoom in preview"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3.5 bg-[#23232A] mx-1" />
          <button
            type="button"
            onClick={() => {
              setStageZoom(100);
              onResetStudio();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        </div>
      </div>

      {/* Main Centered Interactive Stage */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-auto studio-scroll">
        <div
          className="transition-transform duration-150 ease-out origin-center max-w-full"
          style={{ transform: `scale(${stageZoom / 100})` }}
        >
          {/* Export Target Container */}
          <div
            ref={exportRef}
            className="relative flex flex-col items-center justify-center overflow-hidden select-none"
            style={{
              ...backgroundStyle,
              aspectRatio: activeRatio?.ratioValue || undefined,
              padding: `${state.padding}px`,
              width: state.aspectRatio === "4:5" ? "560px" : state.aspectRatio === "1:1" ? "640px" : "780px",
              maxWidth: "100%",
              borderRadius: "4px",
            }}
          >
            {/* Optional Film Grain Texture */}
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

            {/* Top Caption */}
            {state.showCaption && state.captionPosition === "top" && (
              <div className="relative z-10 mb-6 w-full">{renderCaption()}</div>
            )}

            {/* 3D Perspective Mockup Wrapper */}
            <div
              className="relative z-10 flex items-center justify-center transition-transform duration-200 ease-out"
              style={{
                width: isPhone ? "250px" : `${state.scale}%`,
                transform: `perspective(1400px) rotateX(${state.rotateX}deg) rotateY(${state.rotateY}deg)`,
                transformStyle: "preserve-3d",
              }}
            >
              {isPhone ? (
                /* Realistic Titanium iPhone Bezel */
                <div
                  className="relative w-full bg-[#121215] p-[10px] border border-white/15"
                  style={{
                    borderRadius: `${Math.max(30, state.borderRadius + 16)}px`,
                    boxShadow: SHADOW_MAP[state.shadow],
                  }}
                >
                  {/* Dynamic Island */}
                  <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-[74px] h-[20px] bg-black rounded-full z-20 flex items-center justify-end px-2">
                    <span className="w-2 h-2 rounded-full bg-[#171A26] border border-white/10" />
                  </div>
                  <div
                    className="overflow-hidden bg-black"
                    style={{ borderRadius: `${Math.max(22, state.borderRadius + 8)}px` }}
                  >
                    <img
                      src={state.imageSrc}
                      alt="Device mockup preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto block object-cover"
                    />
                  </div>
                </div>
              ) : (
                /* Desktop / Window / Card Frame */
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
                    style={{
                      borderBottomLeftRadius: `${innerRadius}px`,
                      borderBottomRightRadius: `${innerRadius}px`,
                    }}
                  >
                    <img
                      src={state.imageSrc}
                      alt="Screenshot mockup preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto block"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Caption */}
            {state.showCaption && state.captionPosition === "bottom" && (
              <div className="relative z-10 mt-6 w-full">{renderCaption()}</div>
            )}
          </div>
        </div>
      </div>

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
