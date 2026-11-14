import React, { useRef, useState } from "react";
import { Download, Copy, Check, Image as ImageIcon, RotateCw, ChevronDown } from "lucide-react";
import { BACKGROUND_PRESETS } from "../data/presets";
import {
  BackdropPattern,
  ExportFormat,
  ExportScale,
  FrameType,
  ShadowLevel,
  StudioState,
  TiltPreset,
} from "../types/studio";

interface RightInspectorProps {
  state: StudioState;
  isExporting: boolean;
  copiedSuccess: boolean;
  onUpdate: (patch: Partial<StudioState>) => void;
  onExportDownload: () => void;
  onExportCopy: () => void;
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

export const RightInspector: React.FC<RightInspectorProps> = ({
  state,
  isExporting,
  copiedSuccess,
  onUpdate,
  onExportDownload,
  onExportCopy,
}) => {
  const bgFileRef = useRef<HTMLInputElement>(null);
  const [showFineTilt, setShowFineTilt] = useState(false);

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
    <aside className="w-full lg:w-[276px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] flex flex-col justify-between overflow-y-auto studio-scroll">
      <div className="p-4 space-y-6">
        {/* 1. Device Frame */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-200 tracking-wide mb-2.5">
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
                { id: "none", label: "Frameless" },
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
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 2. Backdrop */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">Backdrop</h3>
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
            {BACKGROUND_PRESETS.map((bg) => {
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

          <div className="mt-3">
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

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
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
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 3. Depth & 3D */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">Depth & 3D</h3>
            {(state.rotateX !== 0 || state.rotateY !== 0 || state.rotateZ !== 0) && (
              <button
                type="button"
                onClick={() => onUpdate({ tiltPreset: "flat", rotateX: 0, rotateY: 0, rotateZ: 0 })}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
              >
                <RotateCw className="w-3 h-3" />
                Zero 3D
              </button>
            )}
          </div>

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
                <span>Radius</span>
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

          {state.frame !== "iphone" && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                <span>Scale</span>
                <span className="font-mono-tabular text-zinc-300">{state.scale}%</span>
              </div>
              <input
                type="range"
                min={65}
                max={100}
                value={state.scale}
                onChange={(e) => onUpdate({ scale: Number(e.target.value) })}
                className="studio-slider"
              />
            </div>
          )}

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

          <div>
            <span className="block text-[11px] text-zinc-400 mb-1.5">3D Angle</span>
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

          <button
            type="button"
            onClick={() => setShowFineTilt((v) => !v)}
            className="w-full flex items-center justify-between pt-1 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <span>Fine 3D Sliders (X / Y / Z)</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showFineTilt ? "rotate-180" : ""}`}
            />
          </button>

          {showFineTilt && (
            <div className="space-y-2.5 pt-1">
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
        </section>
      </div>

      {/* Export Controls Footer */}
      <div className="p-4 border-t border-[#1E1E24] bg-[#0D0D11] space-y-3">
        <div className="flex items-center justify-between gap-2">
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
                title={`${sc}x Resolution`}
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

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={onExportCopy}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#181820] hover:bg-[#22222D] border border-[#2A2A35] text-xs font-medium text-zinc-100 transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                Copy PNG
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={onExportDownload}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#F4F4F6] hover:bg-white text-xs font-semibold text-[#0A0A0C] transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Rendering..." : "Download"}
          </button>
        </div>
      </div>
    </aside>
  );
};
