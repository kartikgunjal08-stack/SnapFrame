import React, { useRef } from "react";
import { X, Upload, RotateCcw, Check, Undo2, Redo2 } from "lucide-react";
import { FontMood } from "../config";
import { BrandKit } from "../types/studio";
import { getDefaultBrandKit, sanitizeHexColor } from "../utils/brandKitStorage";

interface BrandKitPanelProps {
  open: boolean;
  brandKit: BrandKit;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onChange: (next: BrandKit) => void;
  onApplyToWorkspace: () => void;
  onClose: () => void;
}

const COLOR_SWATCHES = [
  "#2563EB",
  "#10B981",
  "#6366F1",
  "#F97316",
  "#E11D48",
  "#06B6D4",
  "#0EA5E9",
  "#18181B",
];

const FONT_MOODS: { id: FontMood; label: string; sample: string }[] = [
  { id: "modern", label: "Modern Sans", sample: "Plus Jakarta" },
  { id: "editorial", label: "Editorial Serif", sample: "Serif Display" },
  { id: "technical", label: "Technical Mono", sample: "JetBrains Mono" },
  { id: "bold", label: "Bold Geometric", sample: "High-Impact" },
];

export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({
  open,
  brandKit,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onChange,
  onApplyToWorkspace,
  onClose,
}) => {
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ ...brandKit, logoDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-[#111116] border border-[#262632] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[#1E1E26] flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-sm font-bold text-white">Brand Kit DNA</h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Saved locally in your browser. Reskins static, carousel & 108 motion templates.
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onUndo && onRedo && (
              <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[#16161C] border border-[#24242E] mr-1">
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={onUndo}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded text-zinc-300 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!canRedo}
                  onClick={onRedo}
                  title="Redo (Ctrl+Shift+Z)"
                  className="p-1.5 rounded text-zinc-300 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto studio-scroll">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Brand Name</label>
              <input
                type="text"
                value={brandKit.brandName}
                onChange={(e) => onChange({ ...brandKit, brandName: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-[#16161C] border border-[#262630] text-xs text-white focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1">Domain URL Badge</label>
              <input
                type="text"
                value={brandKit.domainBadge}
                onChange={(e) => onChange({ ...brandKit, domainBadge: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-[#16161C] border border-[#262630] text-xs font-mono-tabular text-white focus:outline-none focus:border-[#3B82F6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Primary Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(brandKit.primaryColor.trim())
                      ? brandKit.primaryColor.trim()
                      : sanitizeHexColor(brandKit.primaryColor, "#2563EB").length === 7
                      ? sanitizeHexColor(brandKit.primaryColor, "#2563EB")
                      : "#2563EB"
                  }
                  onChange={(e) => onChange({ ...brandKit, primaryColor: e.target.value })}
                  className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={brandKit.primaryColor}
                  onChange={(e) => onChange({ ...brandKit, primaryColor: e.target.value })}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] text-xs font-mono-tabular text-zinc-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-zinc-400 mb-1.5">Secondary Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={
                    /^#[0-9A-Fa-f]{6}$/.test(brandKit.secondaryAccent.trim())
                      ? brandKit.secondaryAccent.trim()
                      : sanitizeHexColor(brandKit.secondaryAccent, "#60A5FA").length === 7
                      ? sanitizeHexColor(brandKit.secondaryAccent, "#60A5FA")
                      : "#60A5FA"
                  }
                  onChange={(e) => onChange({ ...brandKit, secondaryAccent: e.target.value })}
                  className="w-8 h-8 rounded border border-white/20 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={brandKit.secondaryAccent}
                  onChange={(e) => onChange({ ...brandKit, secondaryAccent: e.target.value })}
                  className="flex-1 min-w-0 px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] text-xs font-mono-tabular text-zinc-200"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {COLOR_SWATCHES.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => onChange({ ...brandKit, primaryColor: hex })}
                className={`w-6 h-6 rounded-md border cursor-pointer ${
                  brandKit.primaryColor.toLowerCase() === hex.toLowerCase()
                    ? "border-white scale-110"
                    : "border-white/15"
                }`}
                style={{ backgroundColor: hex }}
                title={`Set primary to ${hex}`}
              />
            ))}
          </div>

          {/* Logo Upload */}
          <div>
            <span className="block text-[11px] text-zinc-400 mb-1.5">Brand Logo (Optional)</span>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              {brandKit.logoDataUrl ? (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#16161C] border border-[#262630] flex-1">
                  <img
                    src={brandKit.logoDataUrl}
                    alt="Brand logo"
                    className="w-6 h-6 rounded object-contain"
                  />
                  <span className="text-xs text-zinc-200 truncate">Custom Logo Loaded</span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...brandKit, logoDataUrl: null })}
                    className="ml-auto text-xs text-zinc-400 hover:text-red-400 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#16161C] hover:bg-[#1E1E28] border border-[#262630] text-xs font-medium text-zinc-200 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Upload PNG / SVG Logo
                </button>
              )}
            </div>
          </div>

          {/* Font Mood */}
          <div>
            <span className="block text-[11px] text-zinc-400 mb-1.5">Font Mood</span>
            <div className="grid grid-cols-2 gap-1.5">
              {FONT_MOODS.map((fm) => (
                <button
                  key={fm.id}
                  type="button"
                  onClick={() => onChange({ ...brandKit, fontMood: fm.id })}
                  className={`p-2 rounded-md text-left border cursor-pointer transition-colors ${
                    brandKit.fontMood === fm.id
                      ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-xs font-semibold">{fm.label}</div>
                  <div className="text-[10px] text-zinc-500">{fm.sample}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
              <span>Show Domain Badge & Logo on Exports</span>
              <input
                type="checkbox"
                checked={brandKit.showDomainBadge}
                onChange={(e) => onChange({ ...brandKit, showDomainBadge: e.target.checked })}
                className="accent-[#2563EB]"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer">
              <span>Auto-Skin Templates on Apply</span>
              <input
                type="checkbox"
                checked={brandKit.autoApplyTemplates}
                onChange={(e) => onChange({ ...brandKit, autoApplyTemplates: e.target.checked })}
                className="accent-[#2563EB]"
              />
            </label>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-[#1E1E26] bg-[#0D0D11] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onChange(getDefaultBrandKit())}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyToWorkspace();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            Apply Brand DNA
          </button>
        </div>
      </div>
    </div>
  );
};
