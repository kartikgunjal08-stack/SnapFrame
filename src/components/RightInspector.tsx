import React, { useRef, useState } from "react";
import {
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  RotateCw,
  ChevronDown,
  Video,
  Sparkles,
  Smartphone,
  EyeOff,
  SlidersHorizontal,
} from "lucide-react";
import { BACKGROUND_PRESETS } from "../data/presets";
import {
  BackdropPattern,
  ExportFormat,
  ExportScale,
  FrameType,
  PhoneFitMode,
  ShadowLevel,
  SocialExportPreset,
  SocialExportPresetId,
  StudioCssAnimation,
  StudioState,
  TiltPreset,
} from "../types/studio";
import { HistoryEntry } from "../hooks/useGlobalHistory";
import { HistoryPanel } from "./HistoryPanel";
import { PresetExportPanel } from "./PresetExportPanel";

interface RightInspectorProps {
  state: StudioState;
  isExporting: boolean;
  mp4Progress?: number | null;
  copiedSuccess: boolean;
  activePresetExportingId: SocialExportPresetId | "all" | null;
  historyEntries: HistoryEntry[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpToHistory: (index: number) => void;
  onUpdate: (patch: Partial<StudioState>) => void;
  onExportDownload: () => void;
  onExportCopy: () => void;
  onExportMp4: () => void;
  onPreviewSocialPreset: (preset: SocialExportPreset) => void;
  onExportSocialPreset: (preset: SocialExportPreset) => void;
  onExportAllSocialPresets: () => void;
}

const TILT_VALUES: Record<
  TiltPreset,
  { rotateX: number; rotateY: number; rotateZ: number; label: string }
> = {
  flat: { rotateX: 0, rotateY: 0, rotateZ: 0, label: "Flat" },
  left: { rotateX: 6, rotateY: 13, rotateZ: 0, label: "Left" },
  right: { rotateX: 6, rotateY: -13, rotateZ: 0, label: "Right" },
  hero: { rotateX: 13, rotateY: 0, rotateZ: 0, label: "Pitch" },
  editorial: { rotateX: 4, rotateY: -8, rotateZ: -3, label: "Angle" },
};

const PATTERN_OPTIONS: { id: BackdropPattern; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "grid", label: "Grid" },
  { id: "spotlight", label: "Glow" },
  { id: "rings", label: "Rings" },
];

const QUICK_LOOKS: {
  id: string;
  label: string;
  patch: Partial<StudioState>;
}[] = [
  {
    id: "clean-mac",
    label: "Clean Desktop",
    patch: {
      frame: "macos-dark",
      aspectRatio: "16:9",
      backgroundId: "cobalt-eclipse",
      useCustomSolid: false,
      customBgImage: null,
      tiltPreset: "flat",
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      shadow: "elevated",
      scale: 88,
      padding: 52,
      cssAnimation: "entrance-rise",
      captionLightText: true,
    },
  },
  {
    id: "3d-launch",
    label: "3D Showcase",
    patch: {
      frame: "glass",
      aspectRatio: "16:9",
      backgroundId: "midnight-aurora",
      useCustomSolid: false,
      customBgImage: null,
      tiltPreset: "left",
      rotateX: 6,
      rotateY: 13,
      rotateZ: 0,
      shadow: "dramatic",
      scale: 86,
      padding: 56,
      cssAnimation: "tilt-orbit",
      captionLightText: true,
    },
  },
  {
    id: "phone-reel",
    label: "Phone Reel",
    patch: {
      frame: "iphone",
      aspectRatio: "9:16",
      backgroundId: "sunset-ember",
      useCustomSolid: false,
      customBgImage: null,
      tiltPreset: "flat",
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      phoneFit: "showcase",
      padding: 24,
      scale: 105,
      cssAnimation: "float-hover",
      captionLightText: true,
    },
  },
  {
    id: "ss-only-vert",
    label: "SS Only (9:16)",
    patch: {
      frame: "none",
      aspectRatio: "9:16",
      backgroundId: "cobalt-eclipse",
      useCustomSolid: false,
      customBgImage: null,
      tiltPreset: "flat",
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
      borderRadius: 16,
      shadow: "dramatic",
      padding: 28,
      scale: 94,
      cssAnimation: "spring-pop",
      captionLightText: true,
    },
  },
];

export const RightInspector: React.FC<RightInspectorProps> = ({
  state,
  isExporting,
  mp4Progress = null,
  copiedSuccess,
  activePresetExportingId,
  historyEntries,
  historyIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpToHistory,
  onUpdate,
  onExportDownload,
  onExportCopy,
  onExportMp4,
  onPreviewSocialPreset,
  onExportSocialPreset,
  onExportAllSocialPresets,
}) => {
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [showMoreColors, setShowMoreColors] = useState(false);
  const [showAdvanced3D, setShowAdvanced3D] = useState(false);
  const [showFineTilt, setShowFineTilt] = useState(false);
  const [showExportOpts, setShowExportOpts] = useState(false);
  const [activeTab, setActiveTab] = useState<"style" | "depth" | "presets" | "history">("style");

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

  const visibleBackdrops = showMoreColors ? BACKGROUND_PRESETS : BACKGROUND_PRESETS.slice(0, 7);

  return (
    <aside className="w-full lg:w-[304px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] flex flex-col min-h-0">
      {/* Clean 4-Tab Header */}
      <div className="p-3 border-b border-[#1E1E24] bg-[#0D0D11]">
        <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-[#16161C] border border-[#24242E]">
          <button
            type="button"
            onClick={() => setActiveTab("style")}
            className={`py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === "style"
                ? "bg-[#2563EB] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Look
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("depth")}
            className={`py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === "depth"
                ? "bg-[#2563EB] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            3D & Motion
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
              activeTab === "presets"
                ? "bg-[#2563EB] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Social
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`py-1.5 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === "history"
                ? "bg-[#2563EB] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Undo</span>
            {historyEntries.length > 1 && (
              <span
                className={`text-[9px] font-mono-tabular px-1 rounded ${
                  activeTab === "history"
                    ? "bg-white/20 text-white"
                    : "bg-[#242430] text-zinc-400"
                }`}
              >
                {historyEntries.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-5">
        {activeTab === "history" ? (
          <HistoryPanel
            entries={historyEntries}
            currentIndex={historyIndex}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={onUndo}
            onRedo={onRedo}
            onJumpTo={onJumpToHistory}
          />
        ) : activeTab === "presets" ? (
          <PresetExportPanel
            state={state}
            isExporting={isExporting}
            activePresetExportingId={activePresetExportingId}
            onPreviewPreset={onPreviewSocialPreset}
            onExportPreset={onExportSocialPreset}
            onExportAllPresets={onExportAllSocialPresets}
          />
        ) : activeTab === "style" ? (
          <>
            {/* 1. One-Click Quick Looks */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-white">1-Click Quick Looks</h3>
                <span className="text-[10px] text-zinc-500">Instant style</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {QUICK_LOOKS.map((look) => (
                  <button
                    key={look.id}
                    type="button"
                    onClick={() => onUpdate(look.patch)}
                    className="px-2.5 py-2 rounded-lg bg-[#15151C] hover:bg-[#1E1E2A] border border-[#262634] hover:border-[#3B82F6]/60 text-[11px] font-medium text-zinc-100 text-left transition-colors cursor-pointer"
                  >
                    {look.label}
                  </button>
                ))}
              </div>
            </section>

            <div className="h-px bg-[#1E1E24]" />

            {/* 2. Device Frame */}
            <section>
              <h3 className="text-xs font-semibold text-zinc-200 tracking-wide mb-2">
                Device Frame
              </h3>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "macos-dark", label: "macOS Dark" },
                    { id: "macos-light", label: "macOS Light" },
                    { id: "browser", label: "Browser" },
                    { id: "iphone", label: "iPhone" },
                    { id: "tablet", label: "Tablet" },
                    { id: "glass", label: "Glass" },
                    { id: "none", label: "No Frame (SS Only)" },
                  ] as { id: FrameType; label: string }[]
                ).map((f) => {
                  const active = state.frame === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onUpdate({ frame: f.id })}
                      className={`px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                        f.id === "none" ? "col-span-3" : ""
                      } ${
                        active
                          ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200 hover:border-[#30303B]"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {(state.frame === "iphone" || state.aspectRatio === "9:16") && (
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      frame: state.frame === "iphone" ? "none" : "iphone",
                    })
                  }
                  className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md border text-[11px] font-medium cursor-pointer transition-colors ${
                    state.frame !== "iphone" && state.aspectRatio === "9:16"
                      ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                      : "bg-[#16161C] hover:bg-[#20202A] border-[#282834] text-zinc-200"
                  }`}
                >
                  {state.frame === "iphone" ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-[#60A5FA]" />
                      Remove Phone (Show SS Only)
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
                      Show iPhone Frame
                    </>
                  )}
                </button>
              )}

              {state.frame === "iphone" && (
                <div className="mt-3 pt-2.5 border-t border-[#1E1E24] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-300">
                    <span className="font-medium">Desktop SS in Phone</span>
                    <span className="text-[10px] text-zinc-500">Fit style</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {(
                      [
                        { id: "showcase", label: "Pop-Out" },
                        { id: "pan", label: "Fill & Pan" },
                        { id: "fit", label: "Ambient Fit" },
                      ] as { id: PhoneFitMode; label: string }[]
                    ).map((opt) => {
                      const active = (state.phoneFit ?? "showcase") === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onUpdate({ phoneFit: opt.id })}
                          className={`py-1.5 px-1 rounded-md text-[10.5px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                              : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {(state.phoneFit ?? "showcase") === "pan" && (
                    <div>
                      <div className="flex items-center justify-between text-[10.5px] text-zinc-400 mb-1">
                        <span>Horizontal Pan</span>
                        <span className="font-mono-tabular text-zinc-300">
                          {state.phonePanX ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={state.phonePanX ?? 50}
                        onChange={(e) => onUpdate({ phonePanX: Number(e.target.value) })}
                        className="studio-slider"
                      />
                    </div>
                  )}
                </div>
              )}
            </section>

            <div className="h-px bg-[#1E1E24]" />

            {/* 3. Background */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">Background</h3>
                <div className="flex items-center gap-1.5">
                  <input
                    ref={bgFileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBgUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgFileRef.current?.click()}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#16161C] border border-[#262630] hover:border-[#363644] text-[11px] text-zinc-300 whitespace-nowrap cursor-pointer"
                  >
                    <ImageIcon className="w-3 h-3" />
                    Image
                  </button>
                  <label
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#16161C] border border-[#262630] hover:border-[#363644] text-[11px] text-zinc-300 cursor-pointer whitespace-nowrap"
                    title="Pick solid color"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm border border-white/20"
                      style={{ backgroundColor: state.customSolidColor }}
                    />
                    Solid
                    <input
                      type="color"
                      value={state.customSolidColor}
                      onChange={(e) =>
                        onUpdate({
                          customSolidColor: e.target.value,
                          useCustomSolid: true,
                          customBgImage: null,
                        })
                      }
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {visibleBackdrops.map((bg) => {
                  const isSelected =
                    !state.useCustomSolid && !state.customBgImage && state.backgroundId === bg.id;
                  return (
                    <button
                      key={bg.id}
                      type="button"
                      title={bg.name}
                      onClick={() =>
                        onUpdate({
                          backgroundId: bg.id,
                          useCustomSolid: false,
                          customBgImage: null,
                          captionLightText: bg.isDark,
                        })
                      }
                      className={`h-7 rounded-md border transition-transform hover:scale-105 cursor-pointer ${
                        isSelected
                          ? "border-white ring-2 ring-[#3B82F6]/60 scale-105"
                          : "border-white/15"
                      }`}
                      style={{ background: bg.swatch }}
                    />
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowMoreColors((v) => !v)}
                className="mt-2.5 w-full flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span>More Colors, Pattern & Grain</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${showMoreColors ? "rotate-180" : ""}`}
                />
              </button>

              {showMoreColors && (
                <div className="space-y-3 pt-2.5">
                  <div>
                    <span className="block text-[11px] text-zinc-400 mb-1.5">Pattern</span>
                    <div className="grid grid-cols-5 gap-1">
                      {PATTERN_OPTIONS.map((pat) => (
                        <button
                          key={pat.id}
                          type="button"
                          onClick={() => onUpdate({ pattern: pat.id })}
                          className={`py-1.5 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                            state.pattern === pat.id
                              ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                              : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          {pat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Film Grain</span>
                      <span className="font-mono-tabular text-zinc-300">{state.grainOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={35}
                      value={state.grainOpacity}
                      onChange={(e) => onUpdate({ grainOpacity: Number(e.target.value) })}
                      className="studio-slider"
                    />
                  </div>
                </div>
              )}
            </section>
          </>
        ) : (
          /* 3. 3D & Motion Tab (Essential controls upfront, fine sliders tucked neatly) */
          <section className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-white">
                  <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Motion Animation
                </span>
                <span className="text-[10px] font-mono-tabular text-zinc-500">4s MP4</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: "tilt-orbit", label: "3D Sway" },
                    { id: "entrance-rise", label: "Rise In" },
                    { id: "float-hover", label: "Float" },
                    { id: "spring-pop", label: "Spring" },
                    { id: "none", label: "Static" },
                  ] as { id: StudioCssAnimation; label: string }[]
                ).map((anim) => {
                  const active = (state.cssAnimation ?? "tilt-orbit") === anim.id;
                  return (
                    <button
                      key={anim.id}
                      type="button"
                      onClick={() => onUpdate({ cssAnimation: anim.id })}
                      className={`py-1.5 px-1 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {anim.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-[#1E1E24]" />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-white">3D Angle</span>
                {(state.rotateX !== 0 || state.rotateY !== 0 || state.rotateZ !== 0) && (
                  <button
                    type="button"
                    onClick={() => onUpdate({ tiltPreset: "flat", rotateX: 0, rotateY: 0, rotateZ: 0 })}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    Flat
                  </button>
                )}
              </div>
              <div className="grid grid-cols-5 gap-1">
                {(Object.keys(TILT_VALUES) as TiltPreset[]).map((preset) => {
                  const item = TILT_VALUES[preset];
                  const active = state.tiltPreset === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        onUpdate({
                          tiltPreset: preset,
                          rotateX: item.rotateX,
                          rotateY: item.rotateY,
                          rotateZ: item.rotateZ,
                        })
                      }
                      className={`py-1.5 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                        active
                          ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-white mb-1.5">
                <span>Screenshot Size</span>
                <span className="font-mono-tabular text-[11px] text-[#60A5FA]">{state.scale}%</span>
              </div>
              <input
                type="range"
                min={45}
                max={145}
                value={state.scale}
                onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
                className="studio-slider"
              />
            </div>

            <div className="h-px bg-[#1E1E24]" />

            <button
              type="button"
              onClick={() => setShowAdvanced3D((v) => !v)}
              className="w-full flex items-center justify-between py-1 text-xs font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#60A5FA]" />
                Fine Adjust (Padding, Shadow & Loupe)
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showAdvanced3D ? "rotate-180" : ""}`}
              />
            </button>

            {showAdvanced3D && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Padding</span>
                      <span className="font-mono-tabular text-zinc-300">{state.padding}</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={110}
                      value={state.padding}
                      onChange={(e) => onUpdate({ padding: Number(e.target.value) })}
                      className="studio-slider"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                      <span>Corners</span>
                      <span className="font-mono-tabular text-zinc-300">{state.borderRadius}</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={32}
                      value={state.borderRadius}
                      onChange={(e) => onUpdate({ borderRadius: Number(e.target.value) })}
                      className="studio-slider"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-[11px] text-zinc-400 mb-1.5">Shadow</span>
                  <div className="grid grid-cols-4 gap-1">
                    {(["none", "soft", "elevated", "dramatic"] as ShadowLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => onUpdate({ shadow: lvl })}
                        className={`py-1.5 rounded-md text-[11px] font-medium capitalize border transition-colors whitespace-nowrap cursor-pointer ${
                          state.shadow === lvl
                            ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                            : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFineTilt((v) => !v)}
                  className="w-full flex items-center justify-between text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <span>Manual 3D Tilt (X / Y / Z)</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${showFineTilt ? "rotate-180" : ""}`}
                  />
                </button>

                {showFineTilt && (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Tilt X</span>
                          <span className="font-mono-tabular text-zinc-300">{state.rotateX}°</span>
                        </div>
                        <input
                          type="range"
                          min={-25}
                          max={25}
                          value={state.rotateX}
                          onChange={(e) => onUpdate({ rotateX: Number(e.target.value) })}
                          className="studio-slider"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                          <span>Tilt Y</span>
                          <span className="font-mono-tabular text-zinc-300">{state.rotateY}°</span>
                        </div>
                        <input
                          type="range"
                          min={-25}
                          max={25}
                          value={state.rotateY}
                          onChange={(e) => onUpdate({ rotateY: Number(e.target.value) })}
                          className="studio-slider"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                        <span>Roll Z</span>
                        <span className="font-mono-tabular text-zinc-300">{state.rotateZ}°</span>
                      </div>
                      <input
                        type="range"
                        min={-15}
                        max={15}
                        value={state.rotateZ}
                        onChange={(e) => onUpdate({ rotateZ: Number(e.target.value) })}
                        className="studio-slider"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1 border-t border-[#1E1E24]">
                  <label className="flex items-center justify-between text-xs font-medium text-zinc-200 cursor-pointer">
                    <span>Spotlight Zoom Loupe</span>
                    <input
                      type="checkbox"
                      checked={Boolean(state.loupeEnabled)}
                      onChange={(e) =>
                        onUpdate({
                          loupeEnabled: e.target.checked,
                          loupeX: state.loupeX ?? 0.58,
                          loupeY: state.loupeY ?? 0.42,
                          loupeLabel:
                            state.loupeLabel !== undefined ? state.loupeLabel : "⚡ Key Feature",
                        })
                      }
                      className="accent-[#2563EB] cursor-pointer"
                    />
                  </label>

                  {state.loupeEnabled && (
                    <div className="space-y-2">
                      <p className="text-[10.5px] text-zinc-400">
                        Click on your screenshot to move the spotlight lens.
                      </p>
                      <input
                        type="text"
                        value={state.loupeLabel ?? ""}
                        onChange={(e) => onUpdate({ loupeLabel: e.target.value })}
                        placeholder="Optional callout badge text"
                        className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-zinc-100 placeholder-zinc-500"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Calm Export Controls Footer (bottom safe clearance for host preview badges) */}
      <div className="p-4 pb-20 border-t border-[#1E1E24] bg-[#0D0D11] space-y-2.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExportOpts((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <span>
              Quality: {state.exportScale}x · {state.exportFormat.toUpperCase()}
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showExportOpts ? "rotate-180" : ""}`}
            />
          </button>
          <button
            type="button"
            disabled={isExporting || mp4Progress !== null}
            onClick={onExportCopy}
            className="flex items-center gap-1 text-[11px] font-medium text-zinc-300 hover:text-white disabled:opacity-50 cursor-pointer"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-zinc-400" />
                Copy Image
              </>
            )}
          </button>
        </div>

        {showExportOpts && (
          <div className="flex items-center justify-between gap-2 pb-1">
            <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#16161C] border border-[#24242E]">
              {([1, 2, 3] as ExportScale[]).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => onUpdate({ exportScale: sc })}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular font-medium transition-colors cursor-pointer ${
                    state.exportScale === sc
                      ? "bg-[#2563EB] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {sc}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 p-0.5 rounded-md bg-[#16161C] border border-[#24242E]">
              {(["png", "jpeg"] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => onUpdate({ exportFormat: fmt })}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular uppercase font-medium transition-colors cursor-pointer ${
                    state.exportFormat === fmt
                      ? "bg-[#262630] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isExporting || mp4Progress !== null}
            onClick={onExportDownload}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting && mp4Progress === null ? "Saving..." : `Save ${state.exportFormat.toUpperCase()}`}
          </button>

          <button
            type="button"
            disabled={isExporting || mp4Progress !== null}
            onClick={onExportMp4}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#181820] hover:bg-[#22222D] border border-[#2A2A35] text-xs font-semibold text-zinc-100 transition-colors disabled:opacity-60 whitespace-nowrap cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#60A5FA]" />
            {mp4Progress !== null ? `${mp4Progress}%...` : "Save MP4"}
          </button>
        </div>
      </div>
    </aside>
  );
};

