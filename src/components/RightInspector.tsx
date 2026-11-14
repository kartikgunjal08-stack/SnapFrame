import React, { useRef } from "react";
import { Download, Copy, Check, Image as ImageIcon, RotateCw } from "lucide-react";
import { BACKGROUND_PRESETS } from "../data/presets";
import {
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

const TILT_VALUES: Record<TiltPreset, { rotateX: number; rotateY: number; label: string }> = {
  flat: { rotateX: 0, rotateY: 0, label: "Flat" },
  left: { rotateX: 6, rotateY: 14, label: "Left" },
  right: { rotateX: 6, rotateY: -14, label: "Right" },
  hero: { rotateX: 14, rotateY: 0, label: "Pitch" },
};

export const RightInspector: React.FC<RightInspectorProps> = ({
  state,
  isExporting,
  copiedSuccess,
  onUpdate,
  onExportDownload,
  onExportCopy,
}) => {
  const bgFileRef = useRef<HTMLInputElement>(null);

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
    <aside className="w-full lg:w-[300px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] flex flex-col justify-between overflow-y-auto studio-scroll">
      <div className="p-4 space-y-6">
        {/* Device / Window Frame */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-300 tracking-wide mb-2.5">
            Device Frame
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: "none", label: "None" },
                { id: "macos-dark", label: "macOS Dark" },
                { id: "macos-light", label: "macOS Light" },
                { id: "browser", label: "Browser" },
                { id: "iphone", label: "iPhone" },
              ] as { id: FrameType; label: string }[]
            ).map((f) => {
              const active = state.frame === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => onUpdate({ frame: f.id })}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap ${
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

          {state.frame === "browser" && (
            <div className="mt-2.5">
              <label className="block text-[11px] text-zinc-400 mb-1">Address Bar URL</label>
              <input
                type="text"
                value={state.browserUrl}
                onChange={(e) => onUpdate({ browserUrl: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] text-xs font-mono-tabular text-zinc-100 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          )}

          {(state.frame === "macos-dark" || state.frame === "macos-light") && (
            <div className="mt-2.5">
              <label className="block text-[11px] text-zinc-400 mb-1">Window Title</label>
              <input
                type="text"
                value={state.windowTitle}
                onChange={(e) => onUpdate({ windowTitle: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] text-xs text-zinc-100 focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          )}
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* Background Studio */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">Background</h3>
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
                className="flex items-center gap-1 px-2 py-1 rounded bg-[#16161C] border border-[#262630] hover:border-[#363644] text-[11px] text-zinc-300 whitespace-nowrap"
              >
                <ImageIcon className="w-3 h-3" />
                Custom
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

          <div className="grid grid-cols-6 gap-2">
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
                  className={`h-8 rounded-md border transition-transform hover:scale-105 ${
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

        {/* Geometry & Shadow */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">
            Geometry & Depth
          </h3>

          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
              <span>Padding</span>
              <span className="font-mono-tabular text-zinc-300">{state.padding}px</span>
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
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
              <span>Corner Radius</span>
              <span className="font-mono-tabular text-zinc-300">{state.borderRadius}px</span>
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

          {state.frame !== "iphone" && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
                <span>Frame Scale</span>
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
                  className={`py-1.5 rounded-md text-[11px] font-medium capitalize border transition-colors whitespace-nowrap ${
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
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 3D Perspective */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">3D Perspective</h3>
            {(state.rotateX !== 0 || state.rotateY !== 0) && (
              <button
                type="button"
                onClick={() => onUpdate({ tiltPreset: "flat", rotateX: 0, rotateY: 0 })}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white"
              >
                <RotateCw className="w-3 h-3" />
                Zero
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1">
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
                    })
                  }
                  className={`py-1.5 rounded-md text-[11px] font-medium border transition-colors whitespace-nowrap ${
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
                className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular font-medium transition-colors ${
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
                className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular uppercase font-medium transition-colors ${
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
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#181820] hover:bg-[#22222D] border border-[#2A2A35] text-xs font-medium text-zinc-100 transition-colors disabled:opacity-50 whitespace-nowrap"
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
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#F4F4F6] hover:bg-white text-xs font-semibold text-[#0A0A0C] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? "Rendering..." : "Download"}
          </button>
        </div>
      </div>
    </aside>
  );
};
