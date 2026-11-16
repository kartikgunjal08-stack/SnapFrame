import React from "react";
import { Download, Eye, ShieldCheck, Layers, Sparkles } from "lucide-react";
import { SOCIAL_EXPORT_PRESETS } from "../data/presets";
import { SocialExportPreset, SocialExportPresetId, StudioState } from "../types/studio";

interface PresetExportPanelProps {
  state: StudioState;
  isExporting: boolean;
  activePresetExportingId: SocialExportPresetId | "all" | null;
  onPreviewPreset: (preset: SocialExportPreset) => void;
  onExportPreset: (preset: SocialExportPreset) => void;
  onExportAllPresets: () => void;
}

export const PresetExportPanel: React.FC<PresetExportPanelProps> = ({
  state,
  isExporting,
  activePresetExportingId,
  onPreviewPreset,
  onExportPreset,
  onExportAllPresets,
}) => {
  return (
    <section className="space-y-3.5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">
            Social Preset Export
          </h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            Auto Safe-Zone
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          One click resizes your canvas, applies platform safe-zone guides, and exports exact pixel dimensions.
        </p>
      </div>

      {/* Single-Click Export All Pack */}
      <button
        type="button"
        disabled={isExporting}
        onClick={onExportAllPresets}
        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Layers className="w-3.5 h-3.5 shrink-0" />
        {activePresetExportingId === "all"
          ? "Generating All 3..."
          : "Export All 3 Social Sizes"}
      </button>

      {/* Individual Platform Presets */}
      <div className="space-y-2">
        {SOCIAL_EXPORT_PRESETS.map((preset) => {
          const isActiveOnCanvas =
            state.aspectRatio === preset.aspectRatio &&
            state.safeZoneId === preset.safeZoneId &&
            state.showSafeZone;
          const isThisExporting = activePresetExportingId === preset.id;

          return (
            <div
              key={preset.id}
              className={`p-2.5 rounded-lg border transition-colors ${
                isActiveOnCanvas
                  ? "bg-[#2563EB]/12 border-[#3B82F6]/60"
                  : "bg-[#14141A] border-[#23232D] hover:border-[#343442]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Proportional Mini Aspect Icon */}
                  <div className="w-8 h-8 rounded-md bg-[#1B1B24] border border-[#2C2C38] flex items-center justify-center shrink-0">
                    <div
                      className={`rounded-[2px] border ${
                        isActiveOnCanvas
                          ? "border-[#60A5FA] bg-[#3B82F6]/25"
                          : "border-zinc-500 bg-zinc-700/30"
                      }`}
                      style={{
                        width:
                          preset.id === "x-twitter"
                            ? "18px"
                            : preset.id === "linkedin"
                              ? "13px"
                              : "10px",
                        height:
                          preset.id === "x-twitter"
                            ? "10px"
                            : preset.id === "linkedin"
                              ? "16px"
                              : "18px",
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {preset.name}
                      </span>
                      {isActiveOnCanvas && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[10px] font-mono-tabular text-zinc-400">
                      {preset.formatLabel} · {preset.pixelSpec.width}×{preset.pixelSpec.height}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-emerald-300/90 mb-2.5">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{preset.safeZoneSummary}</span>
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-1.5">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => onExportPreset(preset)}
                  className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#F4F4F6] hover:bg-white text-[11px] font-semibold text-[#0A0A0C] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  {isThisExporting ? "Exporting..." : `Export ${preset.name}`}
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => onPreviewPreset(preset)}
                  className={`flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-colors disabled:opacity-50 cursor-pointer ${
                    isActiveOnCanvas
                      ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                      : "bg-[#1A1A22] hover:bg-[#23232E] border-[#2A2A36] text-zinc-300"
                  }`}
                  title="Preview dimensions & safe-zone on canvas"
                >
                  <Eye className="w-3 h-3" />
                  Guide
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
