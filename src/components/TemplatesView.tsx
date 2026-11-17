import React, { useMemo, useState } from "react";
import { ArrowRight, Search, Smartphone, X } from "lucide-react";
import { BACKGROUND_PRESETS, SceneTemplate, TemplateCategory } from "../data/presets";
import { SCENE_TEMPLATES } from "../data/templates";
import { FrameType } from "../types/studio";

interface TemplatesViewProps {
  onApplyTemplate: (template: SceneTemplate, asPhoneFormat?: boolean) => void;
}

const CATEGORIES: ("All" | TemplateCategory)[] = [
  "All",
  "Launch",
  "AI & Agents",
  "E-Commerce",
  "Social",
  "Mobile",
  "Engineering",
  "Editorial",
  "Marketing",
];

const FRAME_FILTERS: { id: "all" | FrameType; label: string }[] = [
  { id: "all", label: "All Frames" },
  { id: "macos-dark", label: "macOS Dark" },
  { id: "macos-light", label: "macOS Light" },
  { id: "browser", label: "Browser" },
  { id: "iphone", label: "iPhone" },
  { id: "tablet", label: "Tablet" },
  { id: "glass", label: "Glass" },
  { id: "none", label: "Frameless" },
];

const INITIAL_PAGE_SIZE = 24;

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onApplyTemplate }) => {
  const [selectedCategory, setSelectedCategory] = useState<"All" | TemplateCategory>("All");
  const [selectedFrame, setSelectedFrame] = useState<"all" | FrameType>("all");
  const [phoneFormatMode, setPhoneFormatMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_PAGE_SIZE);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: SCENE_TEMPLATES.length };
    for (const tpl of SCENE_TEMPLATES) {
      counts[tpl.category] = (counts[tpl.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SCENE_TEMPLATES.filter((tpl) => {
      if (selectedCategory !== "All" && tpl.category !== selectedCategory) return false;
      if (selectedFrame !== "all" && tpl.patch.frame !== selectedFrame) return false;
      if (!q) return true;
      const haystack = `${tpl.name} ${tpl.category} ${tpl.description} ${tpl.patch.aspectRatio ?? ""} ${tpl.patch.frame ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [selectedCategory, selectedFrame, searchQuery]);

  const isFiltering =
    selectedCategory !== "All" || selectedFrame !== "all" || searchQuery.trim().length > 0;

  const displayedTemplates = isFiltering
    ? filteredTemplates
    : filteredTemplates.slice(0, visibleLimit);

  const hasMore = !isFiltering && visibleLimit < filteredTemplates.length;

  return (
    <div className="flex-1 overflow-y-auto studio-scroll bg-[#0A0A0C]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
              <span className="font-mono-tabular text-zinc-300">{SCENE_TEMPLATES.length} Templates</span>
              <span aria-hidden="true">·</span>
              <span>8 Categories</span>
              <span aria-hidden="true">·</span>
              <span>{BACKGROUND_PRESETS.length} Curated Backdrops</span>
            </div>
            <h1
              className="font-display font-bold tracking-tight text-white text-balance"
              style={{ fontSize: "clamp(1.75rem, 3vw, 2.35rem)" }}
            >
              Ready-to-publish launch templates
            </h1>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Click any composition to load its aspect ratio, device frame, lighting gradient, and
              3D angle straight into the studio.
            </p>
          </div>

          <div className="w-full md:w-72 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search templates, ratios..."
                className="w-full pl-9 pr-8 py-2.5 rounded-lg bg-[#121217] border border-[#24242E] text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#3B82F6]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Category & Frame Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-8 pb-5 border-b border-[#1E1E24]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? "bg-[#2563EB] text-white"
                      : "bg-[#141419] border border-[#22222A] text-zinc-400 hover:text-zinc-100 hover:border-[#32323E]"
                  }`}
                >
                  {cat}{" "}
                  <span className={`font-mono-tabular ml-1 ${active ? "text-white/80" : "text-zinc-500"}`}>
                    {categoryCounts[cat] ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setPhoneFormatMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                phoneFormatMode
                  ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                  : "bg-[#141419] border-[#22222A] text-zinc-300 hover:border-[#343442]"
              }`}
              title="Preview & open every template in vertical iPhone 9:16 format"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
              Phone Format (9:16)
            </button>
            <label htmlFor="frame-filter" className="text-xs text-zinc-500 whitespace-nowrap">
              Frame
            </label>
            <select
              id="frame-filter"
              value={selectedFrame}
              onChange={(e) => setSelectedFrame(e.target.value as "all" | FrameType)}
              className="px-3 py-1.5 rounded-md bg-[#141419] border border-[#22222A] text-xs text-zinc-200 focus:outline-none focus:border-[#3B82F6]"
            >
              {FRAME_FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-5">
          <span>
            Showing{" "}
            <span className="font-mono-tabular text-zinc-300">{displayedTemplates.length}</span> of{" "}
            <span className="font-mono-tabular text-zinc-300">{filteredTemplates.length}</span>{" "}
            matching templates
          </span>
          {isFiltering && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedFrame("all");
                setSearchQuery("");
              }}
              className="text-xs text-[#60A5FA] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Empty State */}
        {displayedTemplates.length === 0 ? (
          <div className="py-16 px-6 rounded-xl bg-[#111115] border border-[#22222A] text-center">
            <p className="font-display text-base font-semibold text-white">
              No templates match your filter
            </p>
            <p className="mt-1.5 text-xs text-zinc-400">
              Try clearing your search query or switching to All Frames.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedFrame("all");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedTemplates.map((tpl) => {
                const bg =
                  BACKGROUND_PRESETS.find((b) => b.id === tpl.patch.backgroundId) ||
                  BACKGROUND_PRESETS[0];
                const isPhone = phoneFormatMode || tpl.patch.frame === "iphone";
                const isTablet = !phoneFormatMode && tpl.patch.frame === "tablet";
                const isGlass = !phoneFormatMode && tpl.patch.frame === "glass";
                const pat = tpl.patch.pattern;

                const miniPatternStyle: React.CSSProperties | undefined =
                  pat === "dots"
                    ? {
                        backgroundImage: `radial-gradient(${
                          bg.isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.16)"
                        } 1px, transparent 1px)`,
                        backgroundSize: "12px 12px",
                      }
                    : pat === "grid"
                      ? {
                          backgroundImage: `linear-gradient(to right, ${
                            bg.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"
                          } 1px, transparent 1px), linear-gradient(to bottom, ${
                            bg.isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"
                          } 1px, transparent 1px)`,
                          backgroundSize: "20px 20px",
                        }
                      : pat === "spotlight"
                        ? {
                            backgroundImage: `radial-gradient(circle at 50% 45%, ${
                              bg.isDark ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.55)"
                            } 0%, transparent 65%)`,
                          }
                        : pat === "rings"
                          ? {
                              backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 22px, ${
                                bg.isDark ? "rgba(255,255,255,0.09)" : "rgba(15,23,42,0.09)"
                              } 23px, transparent 24px)`,
                            }
                          : undefined;

                return (
                  <div
                    key={tpl.id}
                    className="group flex flex-col rounded-xl bg-[#111115] border border-[#22222A] hover:border-[#383846] overflow-hidden transition-colors"
                  >
                    {/* Live Mini Preview */}
                    <div
                      className="h-44 p-5 flex items-center justify-center overflow-hidden relative"
                      style={{ backgroundImage: bg.style }}
                    >
                      {miniPatternStyle && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0"
                          style={miniPatternStyle}
                        />
                      )}
                      <div
                        className={`relative z-10 overflow-hidden shadow-2xl transition-transform duration-200 group-hover:scale-[1.03] ${
                          isPhone
                            ? "w-20 rounded-2xl p-1 bg-[#121215] border border-white/15"
                            : isTablet
                              ? "w-[80%] rounded-xl p-1.5 bg-[#101115] border border-white/15"
                              : isGlass
                                ? "w-[78%] rounded-xl p-1.5 bg-white/10 backdrop-blur-sm border border-white/25"
                                : "w-[78%] rounded-lg border border-white/15"
                        }`}
                        style={{
                          transform: `perspective(900px) rotateX(${tpl.patch.rotateX ?? 0}deg) rotateY(${tpl.patch.rotateY ?? 0}deg) rotateZ(${tpl.patch.rotateZ ?? 0}deg)`,
                        }}
                      >
                        {tpl.patch.imageSrc && (
                          <img
                            src={tpl.patch.imageSrc}
                            alt={tpl.name}
                            referrerPolicy="no-referrer"
                            className={`${
                              isPhone
                                ? "h-32 rounded-xl"
                                : isTablet || isGlass
                                  ? "h-28 rounded-md"
                                  : "h-28"
                            } w-full object-cover object-top block`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1.5">
                          <span>{tpl.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono-tabular">
                            {phoneFormatMode ? "9:16" : tpl.patch.aspectRatio}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">
                            {phoneFormatMode ? "iphone" : tpl.patch.frame}
                          </span>
                        </div>
                        <h2 className="font-display text-base font-semibold text-white">
                          {tpl.name}
                        </h2>
                        <p className="mt-1.5 text-xs text-zinc-400 leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onApplyTemplate(tpl, phoneFormatMode)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1A1A22] hover:bg-[#2563EB] border border-[#2A2A35] hover:border-[#3B82F6] text-xs font-medium text-white transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {phoneFormatMode ? "Open as Phone" : "Open in Studio"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        {!phoneFormatMode && tpl.patch.frame !== "iphone" && (
                          <button
                            type="button"
                            onClick={() => onApplyTemplate(tpl, true)}
                            title="Convert & open this template in vertical Phone format (iPhone · 9:16)"
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#15151C] hover:bg-[#1F2433] border border-[#2A2A36] hover:border-[#3B82F6]/60 text-xs font-medium text-zinc-200 transition-colors whitespace-nowrap cursor-pointer shrink-0"
                          >
                            <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
                            Phone
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Bar */}
            {hasMore && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 24)}
                  className="px-5 py-2.5 rounded-lg bg-[#16161C] hover:bg-[#1E1E26] border border-[#282834] text-xs font-semibold text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  Load More ({filteredTemplates.length - visibleLimit} remaining)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleLimit(filteredTemplates.length)}
                  className="px-4 py-2.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  Show All {filteredTemplates.length}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
