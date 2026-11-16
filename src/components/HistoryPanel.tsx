import React from "react";
import { History, Undo2, Redo2, RotateCcw, Check } from "lucide-react";
import { HistoryEntry } from "../hooks/useGlobalHistory";

interface HistoryPanelProps {
  entries: HistoryEntry[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpTo: (index: number) => void;
}

function formatTimeLabel(timestamp: number): string {
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  entries,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpTo,
}) => {
  // Show newest state at the top so recent edits & future redo states are immediately visible
  const reversed = [...entries].map((entry, index) => ({ entry, index })).reverse();

  return (
    <section className="space-y-3.5">
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-[#60A5FA]" />
            <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">
              Studio History
            </h3>
          </div>
          <span className="text-[10px] font-mono-tabular text-zinc-400">
            {currentIndex + 1} / {entries.length}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Click any state below to revert the canvas, positions, and brand kit to that moment.
        </p>
      </div>

      {/* Quick Step Bar */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#16161C] hover:bg-[#1E1E28] border border-[#262632] text-[11px] font-medium text-zinc-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
        >
          <Undo2 className="w-3 h-3" />
          Undo
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#16161C] hover:bg-[#1E1E28] border border-[#262632] text-[11px] font-medium text-zinc-200 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
        >
          <Redo2 className="w-3 h-3" />
          Redo
        </button>
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => onJumpTo(0)}
          className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-[#16161C] hover:bg-[#1E1E28] border border-[#262632] text-[11px] font-medium text-zinc-300 disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
          title="Revert to initial studio snapshot"
        >
          <RotateCcw className="w-3 h-3" />
          Initial
        </button>
      </div>

      {/* Interactive Timeline Stack */}
      <div className="space-y-1.5">
        {reversed.map(({ entry, index }) => {
          const isCurrent = index === currentIndex;
          const isFuture = index > currentIndex;
          const { studioState, brandKit } = entry.snapshot;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => onJumpTo(index)}
              disabled={isCurrent}
              className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors flex items-start gap-2.5 ${
                isCurrent
                  ? "bg-[#2563EB]/15 border-[#3B82F6]/65 cursor-default"
                  : isFuture
                    ? "bg-[#121217] border-dashed border-[#262632] opacity-60 hover:opacity-100 hover:border-[#3A3A4A] cursor-pointer"
                    : "bg-[#14141A] border-[#22222C] hover:border-[#363646] hover:bg-[#181822] cursor-pointer"
              }`}
            >
              {/* Step Indicator */}
              <div
                className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono-tabular font-semibold shrink-0 border ${
                  isCurrent
                    ? "bg-[#2563EB] border-[#60A5FA] text-white"
                    : isFuture
                      ? "bg-[#191922] border-[#2E2E3A] text-zinc-500"
                      : "bg-[#1A1A23] border-[#2B2B36] text-zinc-400"
                }`}
              >
                {isCurrent ? <Check className="w-3 h-3" /> : index}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-medium truncate ${
                      isCurrent ? "text-white" : isFuture ? "text-zinc-400" : "text-zinc-200"
                    }`}
                  >
                    {entry.label}
                  </span>
                  <span className="text-[10px] font-mono-tabular text-zinc-500 shrink-0">
                    {isCurrent ? "Current" : formatTimeLabel(entry.timestamp)}
                  </span>
                </div>

                {/* Snapshot Summary */}
                <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono-tabular text-zinc-500">
                  <span
                    className="w-2 h-2 rounded-full border border-white/25 shrink-0"
                    style={{ backgroundColor: brandKit.primaryColor }}
                    title={`Brand color: ${brandKit.primaryColor}`}
                  />
                  <span className="truncate">
                    {studioState.aspectRatio} · {studioState.frame}
                    {studioState.rotateX !== 0 || studioState.rotateY !== 0
                      ? ` · 3D`
                      : ""}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
