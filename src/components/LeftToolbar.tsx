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
} from "lucide-react";
import { APP_CONFIG } from "../config";
import { ASPECT_RATIO_OPTIONS } from "../data/presets";
import { SCENE_TEMPLATES } from "../data/templates";
import { SampleId, StudioState } from "../types/studio";
import { DEFAULT_MOCKUP_DATA } from "../utils/sampleSvgBuilder";

interface LeftToolbarProps {
  state: StudioState;
  onUpdate: (patch: Partial<StudioState>) => void;
  onUploadFile: (file: File) => void;
  onSelectSample: (sampleId: SampleId) => void;
  onOpenTemplates: () => void;
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
  onUpdate,
  onUploadFile,
  onSelectSample,
  onOpenTemplates,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <div className="p-4 space-y-6">
        {/* 1. Content Source */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-zinc-200 tracking-wide">Content</h3>
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#18181F] hover:bg-[#1F1F28] border border-[#282832] text-xs font-medium text-zinc-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <ImagePlus className="w-4 h-4 text-[#60A5FA] shrink-0" />
            Upload Screenshot
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

          {state.activeSampleId && (
            <p className="mt-2.5 text-[11px] text-zinc-400 leading-relaxed">
              Click any text, metric, or chart right on the canvas to edit it directly.
            </p>
          )}
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 2. Canvas Size */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-200 tracking-wide mb-2.5">Canvas Size</h3>
          <div className="grid grid-cols-2 gap-1.5">
            {ASPECT_RATIO_OPTIONS.map((ratio) => {
              const active = state.aspectRatio === ratio.id;
              return (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => onUpdate({ aspectRatio: ratio.id })}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200 hover:border-[#30303B]"
                  } ${ratio.id === "auto" ? "col-span-2" : ""}`}
                >
                  <span className="font-mono-tabular font-medium whitespace-nowrap">
                    {ratio.label}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate ml-2">{ratio.platform}</span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 3. Headline Overlay */}
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
            <div className="space-y-2">
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
                  Position: {state.captionPosition === "top" ? "Top" : "Bottom"}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ captionLightText: !state.captionLightText })}
                  className="px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] hover:border-[#383846] text-[11px] text-zinc-300 font-medium whitespace-nowrap cursor-pointer"
                >
                  Text: {state.captionLightText ? "Light" : "Dark"}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Click the eyebrow, title, or subtitle on the stage to edit.
              </p>
            </div>
          )}
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* 4. Browse Templates CTA */}
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
