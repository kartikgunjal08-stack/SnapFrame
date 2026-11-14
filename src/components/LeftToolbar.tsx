import React, { useRef } from "react";
import { ImagePlus, Layers, Type, ExternalLink, Monitor, Smartphone, Code2 } from "lucide-react";
import { APP_CONFIG } from "../config";
import { ASPECT_RATIO_OPTIONS, SAMPLE_MOCKUPS } from "../data/presets";
import { SCENE_TEMPLATES } from "../data/templates";
import { SampleId, StudioState } from "../types/studio";

interface LeftToolbarProps {
  state: StudioState;
  onUpdate: (patch: Partial<StudioState>) => void;
  onUploadFile: (file: File) => void;
  onSelectSample: (sampleId: SampleId) => void;
  onOpenTemplates: () => void;
}

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

  return (
    <aside className="w-full lg:w-[276px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#1E1E24] bg-[#101014] flex flex-col justify-between overflow-y-auto studio-scroll">
      <div className="p-4 space-y-6">
        {/* Source Media */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">Source Media</h3>
            <span className="text-[11px] text-zinc-500 font-mono-tabular">Ctrl+V</span>
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
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#18181F] hover:bg-[#1F1F28] border border-[#282832] text-xs font-medium text-zinc-100 transition-colors whitespace-nowrap"
          >
            <ImagePlus className="w-4 h-4 text-[#60A5FA] shrink-0" />
            Upload Screenshot
          </button>

          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {(
              [
                { id: "saas", label: "SaaS", icon: Monitor },
                { id: "mobile", label: "Mobile", icon: Smartphone },
                { id: "code", label: "Code", icon: Code2 },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const isSelected = state.imageSrc === SAMPLE_MOCKUPS[id].src;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectSample(id)}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
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

        {/* Canvas Aspect Ratio */}
        <section>
          <h3 className="text-xs font-semibold text-zinc-300 tracking-wide mb-2.5">
            Output Size
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {ASPECT_RATIO_OPTIONS.map((ratio) => {
              const active = state.aspectRatio === ratio.id;
              return (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => onUpdate({ aspectRatio: ratio.id })}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs border transition-colors ${
                    active
                      ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200 hover:border-[#30303B]"
                  } ${ratio.id === "auto" ? "col-span-2" : ""}`}
                >
                  <span className="font-mono-tabular font-medium whitespace-nowrap">
                    {ratio.label}
                  </span>
                  <span className="text-[11px] text-zinc-500 truncate ml-2">
                    {ratio.platform}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* Quick Scene Presets */}
        <section>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">Quick Scenes</h3>
            </div>
            <button
              type="button"
              onClick={onOpenTemplates}
              className="text-[11px] font-medium text-[#60A5FA] hover:text-white transition-colors whitespace-nowrap"
            >
              All {SCENE_TEMPLATES.length}
            </button>
          </div>
          <div className="space-y-1.5">
            {SCENE_TEMPLATES.slice(0, 4).map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onUpdate(tpl.patch)}
                className="w-full text-left px-3 py-2 rounded-lg bg-[#141419] hover:bg-[#1A1A22] border border-[#22222A] hover:border-[#32323E] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-zinc-200 truncate">{tpl.name}</span>
                  <span className="text-[11px] text-zinc-500 shrink-0">{tpl.category}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="h-px bg-[#1E1E24]" />

        {/* Headline & Caption Overlay */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-zinc-400" />
              <h3 className="text-xs font-semibold text-zinc-300 tracking-wide">
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
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Title</label>
                <input
                  type="text"
                  value={state.captionTitle}
                  onChange={(e) => onUpdate({ captionTitle: e.target.value })}
                  placeholder="Enter launch headline..."
                  className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] text-xs text-zinc-100 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={state.captionSubtitle}
                  onChange={(e) => onUpdate({ captionSubtitle: e.target.value })}
                  placeholder="Short supporting line..."
                  className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] text-xs text-zinc-100 focus:outline-none focus:border-[#3B82F6]"
                />
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    onUpdate({
                      captionPosition: state.captionPosition === "top" ? "bottom" : "top",
                    })
                  }
                  className="px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] hover:border-[#383846] text-[11px] text-zinc-300 font-medium whitespace-nowrap"
                >
                  Pos: {state.captionPosition === "top" ? "Top" : "Bottom"}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdate({ captionLightText: !state.captionLightText })}
                  className="px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#262630] hover:border-[#383846] text-[11px] text-zinc-300 font-medium whitespace-nowrap"
                >
                  Text: {state.captionLightText ? "Light" : "Dark"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Configurable Sponsor Slot (Monetization Ready) */}
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
