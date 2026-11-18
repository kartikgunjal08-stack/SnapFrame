import React, { useRef, useState } from "react";
import {
  ImagePlus,
  Sparkles,
  RotateCcw,
  Layers,
  ArrowUpDown,
  Contrast,
  Grid,
  X,
  Crop,
} from "lucide-react";
import {
  BackdropPattern,
  CanvasSelectedElement,
  FrameType,
  StudioImageFilterId,
  StudioState,
} from "../types/studio";

export const STUDIO_IMAGE_FILTERS: {
  id: StudioImageFilterId;
  label: string;
  css: string;
  swatch: string;
}[] = [
  { id: "none", label: "Original", css: "none", swatch: "#334155" },
  {
    id: "crisp-studio",
    label: "Crisp Studio",
    css: "contrast(1.1) saturate(1.12) brightness(1.02)",
    swatch: "#3B82F6",
  },
  {
    id: "warm-tone",
    label: "Warm Tone",
    css: "sepia(0.24) saturate(1.18) contrast(1.06)",
    swatch: "#F59E0B",
  },
  {
    id: "desaturated",
    label: "Desaturated",
    css: "saturate(0.45) contrast(1.12)",
    swatch: "#64748B",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    css: "contrast(1.36) saturate(1.14) brightness(0.97)",
    swatch: "#1D4ED8",
  },
  {
    id: "bleach-bypass",
    label: "Bleach Bypass",
    css: "saturate(0.35) contrast(1.48) sepia(0.08) brightness(0.94)",
    swatch: "#94A3B8",
  },
];

const FRAME_CYCLE: FrameType[] = [
  "macos-dark",
  "browser",
  "iphone",
  "tablet",
  "glass",
  "macos-light",
  "none",
];

const PATTERN_CYCLE: BackdropPattern[] = ["none", "dots", "grid", "spotlight", "rings"];

interface QuickActionDockProps {
  selectedElement: CanvasSelectedElement | null;
  state: StudioState;
  onUpdate: (patch: Partial<StudioState>) => void;
  onUploadFile: (file: File) => void;
  onResetPosition: () => void;
  onOpenCrop: () => void;
  onClose: () => void;
  isPreviewLocked?: boolean;
  onRequireAuthForUpload?: () => void;
}

export const QuickActionDock: React.FC<QuickActionDockProps> = ({
  selectedElement,
  state,
  onUpdate,
  onUploadFile,
  onResetPosition,
  onOpenCrop,
  onClose,
  isPreviewLocked = false,
  onRequireAuthForUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  if (!selectedElement) return null;

  const activeFilterId = state.imageFilter || "none";
  const activeFilter =
    STUDIO_IMAGE_FILTERS.find((f) => f.id === activeFilterId) || STUDIO_IMAGE_FILTERS[0];

  const contextLabel =
    selectedElement === "device"
      ? "Device & Screen"
      : selectedElement === "caption"
        ? "Headline"
        : "Backdrop Stage";

  const handleCycleFrame = () => {
    const idx = FRAME_CYCLE.indexOf(state.frame);
    const next = FRAME_CYCLE[(idx + 1) % FRAME_CYCLE.length];
    onUpdate({ frame: next });
  };

  const handleCyclePattern = () => {
    const idx = PATTERN_CYCLE.indexOf(state.pattern);
    const next = PATTERN_CYCLE[(idx + 1) % PATTERN_CYCLE.length];
    onUpdate({ pattern: next });
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onUpdate({ customBgImage: reader.result, useCustomSolid: false });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[95%]"
    >
      {/* Contextual CSS Filter Popover */}
      {filterMenuOpen && (
        <div className="p-2 rounded-xl bg-[#13131A]/95 backdrop-blur-md border border-[#2C2C38] shadow-2xl flex flex-wrap items-center gap-1.5">
          {STUDIO_IMAGE_FILTERS.map((f) => {
            const active = activeFilterId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  onUpdate({ imageFilter: f.id });
                  setFilterMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                    : "bg-[#1A1A23] border-[#282834] text-zinc-300 hover:border-[#3A3A4A]"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm border border-white/25 shrink-0"
                  style={{ backgroundColor: f.swatch }}
                />
                {f.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Floating Dock */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#121218]/95 backdrop-blur-md border border-[#2B2B36] shadow-2xl overflow-x-auto max-w-full">
        <span className="px-2 py-1 text-[11px] font-mono-tabular font-semibold text-[#60A5FA] whitespace-nowrap shrink-0">
          {contextLabel}
        </span>

        <div className="w-px h-4 bg-[#262632] shrink-0" />

        {/* Hidden Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
        <input
          ref={bgInputRef}
          type="file"
          accept="image/*"
          onChange={handleBgUpload}
          className="hidden"
        />

        {/* Replace Image */}
        <button
          type="button"
          onClick={() => {
            if (selectedElement === "backdrop") {
              bgInputRef.current?.click();
            } else if (isPreviewLocked && onRequireAuthForUpload) {
              onRequireAuthForUpload();
            } else {
              fileInputRef.current?.click();
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A23] hover:bg-[#232330] border border-[#2A2A36] text-xs font-medium text-zinc-100 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ImagePlus className="w-3.5 h-3.5 text-[#60A5FA]" />
          {selectedElement === "backdrop"
            ? "Replace Backdrop"
            : isPreviewLocked
              ? "Replace Image (Sign In)"
              : "Replace Image"}
        </button>

        {/* Apply Filter */}
        <button
          type="button"
          onClick={() => setFilterMenuOpen((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer ${
            filterMenuOpen || activeFilterId !== "none"
              ? "bg-[#2563EB]/18 border-[#3B82F6]/60 text-white"
              : "bg-[#1A1A23] hover:bg-[#232330] border-[#2A2A36] text-zinc-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
          {activeFilterId === "none" ? "Apply Filter" : `Filter: ${activeFilter.label}`}
        </button>

        {/* Context-Specific Direct Tools */}
        {selectedElement === "device" && (
          <>
            <button
              type="button"
              onClick={onOpenCrop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A23] hover:bg-[#232330] border border-[#2A2A36] text-xs font-medium text-zinc-100 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Crop className="w-3.5 h-3.5 text-[#60A5FA]" />
              Crop & Fit
            </button>
            <button
              type="button"
              onClick={handleCycleFrame}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A23] hover:bg-[#232330] border border-[#2A2A36] text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Frame: {state.frame}
            </button>
            <div className="flex items-center rounded-lg bg-[#1A1A23] border border-[#2A2A36] shrink-0">
              <button
                type="button"
                onClick={() => onUpdate({ scale: Math.max(45, state.scale - 6) })}
                className="px-2 py-1.5 text-xs font-mono-tabular text-zinc-300 hover:text-white cursor-pointer"
                title="Decrease screenshot size"
              >
                -
              </button>
              <span className="px-1.5 text-[11px] font-mono-tabular text-zinc-300">
                {state.scale}%
              </span>
              <button
                type="button"
                onClick={() => onUpdate({ scale: Math.min(130, state.scale + 6) })}
                className="px-2 py-1.5 text-xs font-mono-tabular text-zinc-300 hover:text-white cursor-pointer"
                title="Increase screenshot size"
              >
                +
              </button>
            </div>
          </>
        )}

        {selectedElement === "caption" && (
          <>
            <button
              type="button"
              onClick={() =>
                onUpdate({ captionPosition: state.captionPosition === "top" ? "bottom" : "top" })
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A23] hover:bg-[#232330] border border-[#2A2A36] text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
              {state.captionPosition === "top" ? "Move Bottom" : "Move Top"}
            </button>
            <button
              type="button"
              onClick={() => onUpdate({ captionLightText: !state.captionLightText })}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A23] hover:bg-[#232330] border border-[#2A2A36] text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Contrast className="w-3.5 h-3.5 text-zinc-400" />
              {state.captionLightText ? "Dark Text" : "Light Text"}
            </button>
          </>
        )}

        {selectedElement === "backdrop" && (
          <button
            type="button"
            onClick={handleCyclePattern}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A23] hover:bg-[#232330] border border-[#2A2A36] text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Grid className="w-3.5 h-3.5 text-zinc-400" />
            Pattern: {state.pattern}
          </button>
        )}

        {/* Reset Position */}
        <button
          type="button"
          onClick={onResetPosition}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A23] hover:bg-[#232330] border border-[#2A2A36] text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
          Reset Position
        </button>

        <button
          type="button"
          onClick={() => {
            setFilterMenuOpen(false);
            onClose();
          }}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          title="Dismiss Quick-Action Dock (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
