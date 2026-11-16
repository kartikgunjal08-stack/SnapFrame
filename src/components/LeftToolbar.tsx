import React, { useRef } from "react";
import {
  ImagePlus,
  Layers,
  Type,
  ExternalLink,
  Monitor,
  Smartphone,
  Code2,
  ShoppingBag,
  Bot,
  MessageSquareQuote,
  ArrowRight,
  RotateCcw,
  Palette,
  ShieldCheck,
} from "lucide-react";
import { APP_CONFIG } from "../config";
import { ASPECT_RATIO_OPTIONS } from "../data/presets";
import { SCENE_TEMPLATES } from "../data/templates";
import { BrandKit, SampleId, StudioState } from "../types/studio";
import { DEFAULT_MOCKUP_DATA } from "../utils/sampleSvgBuilder";

interface LeftToolbarProps {
  state: StudioState;
  brandKit: BrandKit;
  onUpdate: (patch: Partial<StudioState>) => void;
  onUploadFile: (file: File) => void;
  onSelectSample: (sampleId: SampleId) => void;
  onOpenTemplates: () => void;
  onOpenBrandKit: () => void;
}

const SAMPLE_BUTTONS: {
  id: SampleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "saas", label: "SaaS", icon: Monitor },
  { id: "mobile", label: "Mobile", icon: Smartphone },
  { id: "code", label: "Code", icon: Code2 },
  { id: "ecommerce", label: "Store", icon: ShoppingBag },
  { id: "ai", label: "AI Chat", icon: Bot },
  { id: "social", label: "Social", icon: MessageSquareQuote },
];

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  state,
  brandKit,
  onUpdate,
  onUploadFile,
  onSelectSample,
  onOpenTemplates,
  onOpenBrandKit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sizeMode, setSizeMode] = React.useState<"standard" | "store">(() => {
    const activeOpt = ASPECT_RATIO_OPTIONS.find((r) => r.id === state.aspectRatio);
    return activeOpt?.isStoreSpec ? "store" : "standard";
  });

  const standardRatios = ASPECT_RATIO_OPTIONS.filter((r) => !r.isStoreSpec);
  const storeRatios = ASPECT_RATIO_OPTIONS.filter((r) => Boolean(r.isStoreSpec));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
    e.target.value = "";
  };

  const resetActiveSceneText = () => {
    if (!state.activeSampleId) return;
    const key = state.activeSampleId;
    onUpdate({
      mockupData: {
        ...state.mockupData,
        [key]: DEFAULT_MOCKUP_DATA[key],
      },
    });
  };

  return (
    <aside className="w-full lg:w-[256px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#1E1E24] bg-[#101014] flex flex-col justify-between overflow-y-auto studio-scroll">
      <div className="p-4 space-y-5">
        {/* 1. Brand Kit DNA */}
        <section>
          <button
            type="button"
            onClick={onOpenBrandKit}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#14141A] hover:bg-[#1B1B24] border border-[#24242E] hover:border-[#3B82F6]/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="w-5 h-5 rounded-md border border-white/20 shrink-0 flex items-center justify-center"
                style={{ backgroundColor: brandKit.primaryColor }}
              >
                <Palette className="w-3 h-3 text-white" />
              </span>
              <div className="text-left min-w-0">
                <div className="text-xs font-semibold text-zinc-100 truncate">
                  {brandKit.brandName} DNA
                </div>
                <div className="text-[10px] text-zinc-500 truncate">
                  Brand colors, logo & font
                </div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          </button>
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 2. Content Source */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">1. Screenshot</h3>
            {state.activeSampleId && (
              <button
                type="button"
                onClick={resetActiveSceneText}
                className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                title="Reset sample text"
              >
                <RotateCcw className="w-3 h-3" />
                Reset text
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
          >
            <ImagePlus className="w-4 h-4 shrink-0" />
            Upload or Paste (Ctrl+V)
          </button>

          <div className="grid grid-cols-3 gap-1.5 mt-2.5">
            {SAMPLE_BUTTONS.map(({ id, label, icon: Icon }) => {
              const isSelected = state.activeSampleId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectSample(id)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isSelected
                      ? "bg-[#2563EB]/15 border-[#3B82F6]/50 text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200 hover:border-[#30303B]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 3. Canvas Size — Clean Segmented Mode */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">2. Size</h3>
            {sizeMode === "store" && state.safeZoneId !== "none" && (
              <button
                type="button"
                onClick={() => onUpdate({ showSafeZone: !state.showSafeZone })}
                className={`text-[10px] font-medium px-2 py-0.5 rounded border cursor-pointer ${
                  state.showSafeZone
                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300"
                    : "bg-[#18181F] border-[#2A2A34] text-zinc-400"
                }`}
              >
                {state.showSafeZone ? "Guides On" : "Guides Off"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#16161C] border border-[#24242E]">
            <button
              type="button"
              onClick={() => setSizeMode("standard")}
              className={`py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                sizeMode === "standard" ? "bg-[#2563EB] text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Social & Web
            </button>
            <button
              type="button"
              onClick={() => setSizeMode("store")}
              className={`flex items-center justify-center gap-1 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                sizeMode === "store" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              App & Store
            </button>
          </div>

          {sizeMode === "standard" ? (
            <div className="grid grid-cols-2 gap-1.5">
              {standardRatios.map((ratio) => {
                const active = state.aspectRatio === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        aspectRatio: ratio.id,
                        safeZoneId: "none",
                        showSafeZone: false,
                      })
                    }
                    className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs border transition-colors cursor-pointer ${
                      active
                        ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                        : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200 hover:border-[#30303B]"
                    }`}
                  >
                    <span className="font-mono-tabular font-medium whitespace-nowrap">
                      {ratio.label}
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate ml-2">{ratio.platform}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">
              {storeRatios.map((ratio) => {
                const active = state.aspectRatio === ratio.id;
                return (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() =>
                      onUpdate({
                        aspectRatio: ratio.id,
                        safeZoneId: ratio.safeZoneId || "none",
                        showSafeZone: true,
                      })
                    }
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] border transition-colors cursor-pointer ${
                      active
                        ? "bg-emerald-500/12 border-emerald-500/50 text-white"
                        : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200 hover:border-[#30303B]"
                    }`}
                  >
                    <span className="font-medium truncate">{ratio.label}</span>
                    <span className="font-mono-tabular text-[10px] text-zinc-500 shrink-0 ml-2">
                      {ratio.platform}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 4. Headline Overlay */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">
                Headline Overlay
              </h3>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={state.showCaption}
              onClick={() => onUpdate({ showCaption: !state.showCaption })}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                state.showCaption
                  ? "bg-[#2563EB] border-[#3B82F6]"
                  : "bg-[#1C1C22] border-[#2C2C36]"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  state.showCaption ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {state.showCaption && (
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    captionPosition: state.captionPosition === "top" ? "bottom" : "top",
                  })
                }
                className="px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] hover:border-[#383846] text-[11px] text-zinc-300 font-medium whitespace-nowrap cursor-pointer"
              >
                Pos: {state.captionPosition === "top" ? "Top" : "Bottom"}
              </button>
              <button
                type="button"
                onClick={() => onUpdate({ captionLightText: !state.captionLightText })}
                className="px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] hover:border-[#383846] text-[11px] text-zinc-300 font-medium whitespace-nowrap cursor-pointer"
              >
                Text: {state.captionLightText ? "Light" : "Dark"}
              </button>
            </div>
          )}
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 5. Browse Templates CTA */}
        <section>
          <button
            type="button"
            onClick={onOpenTemplates}
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-lg bg-[#14141A] hover:bg-[#1B1B24] border border-[#24242E] hover:border-[#3B82F6]/50 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#60A5FA]" />
              <div className="text-left">
                <div className="text-xs font-semibold text-zinc-100">
                  {SCENE_TEMPLATES.length} Templates
                </div>
                <div className="text-[11px] text-zinc-500">8 categories · 1-click apply</div>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
          </button>
        </section>
      </div>

      {/* Configurable Sponsor Slot */}
      {APP_CONFIG.sponsorSlot.enabled && (
        <div className="p-4 border-t border-[#1E1E24] bg-[#0D0D11]">
          <a
            href={APP_CONFIG.sponsorSlot.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg bg-[#14141A] border border-[#24242E] hover:border-[#363644] transition-colors group"
          >
            <div className="flex items-center justify-between text-[11px] text-zinc-500 mb-1">
              <span>{APP_CONFIG.sponsorSlot.label}</span>
              <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </div>
            <p className="text-xs font-semibold text-zinc-200">{APP_CONFIG.sponsorSlot.name}</p>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
              {APP_CONFIG.sponsorSlot.description}
            </p>
          </a>
        </div>
      )}
    </aside>
  );
};
