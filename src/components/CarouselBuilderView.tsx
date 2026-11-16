import React, { useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Palette,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toPng } from "html-to-image";
import { BACKGROUND_PRESETS, SAMPLE_MOCKUPS } from "../data/presets";
import {
  BackdropPattern,
  BrandKit,
  CarouselFormat,
  CarouselSlide,
  FrameType,
  MockupContentData,
  SampleId,
} from "../types/studio";
import { getFontMoodClasses } from "../utils/brandKitStorage";
import { InlineEditable } from "./InlineEditable";
import { LiveSceneRenderer } from "./LiveSceneRenderer";

interface CarouselBuilderViewProps {
  brandKit: BrandKit;
  mockupData: MockupContentData;
  onUpdateMockupData: <K extends keyof MockupContentData>(
    scene: K,
    patch: Partial<MockupContentData[K]>
  ) => void;
  onOpenBrandKit: () => void;
  onNotify: (msg: string, type?: "info" | "error") => void;
}

const CAROUSEL_FORMATS: Record<
  CarouselFormat,
  { label: string; platform: string; width: number; height: number }
> = {
  "linkedin-4x5": { label: "4:5", platform: "LinkedIn Carousel", width: 432, height: 540 },
  "product-hunt": { label: "1270×760", platform: "Product Hunt", width: 520, height: 311 },
  "x-16x9": { label: "16:9", platform: "X / Twitter", width: 520, height: 293 },
  "square-1x1": { label: "1:1", platform: "Square Deck", width: 440, height: 440 },
};

function createInitialSlides(brandName: string): CarouselSlide[] {
  return [
    {
      id: "slide-1",
      eyebrow: "01 · The Problem",
      headline: "Stop posting flat screenshots.",
      subtitle: `${brandName} turns raw product captures into launch-ready visuals in seconds.`,
      frame: "macos-dark",
      imageSrc: SAMPLE_MOCKUPS.saas.src,
      activeSampleId: "saas",
      scale: 92,
      rotateX: 4,
      rotateY: 10,
      rotateZ: 0,
    },
    {
      id: "slide-2",
      eyebrow: "02 · Click-to-Edit",
      headline: "Edit every metric & chart live.",
      subtitle: "Click directly on KPIs, charts, or UI labels — no Figma or upload needed.",
      frame: "browser",
      imageSrc: SAMPLE_MOCKUPS.ai.src,
      activeSampleId: "ai",
      scale: 94,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
    },
    {
      id: "slide-3",
      eyebrow: "03 · Launch Ready",
      headline: "Export 3x assets in one click.",
      subtitle: "Zero watermarks, zero server costs, and consistent Brand DNA across every slide.",
      frame: "glass",
      imageSrc: SAMPLE_MOCKUPS.ecommerce.src,
      activeSampleId: "ecommerce",
      scale: 92,
      rotateX: 4,
      rotateY: -10,
      rotateZ: 0,
    },
  ];
}

export const CarouselBuilderView: React.FC<CarouselBuilderViewProps> = ({
  brandKit,
  mockupData,
  onUpdateMockupData,
  onOpenBrandKit,
  onNotify,
}) => {
  const [format, setFormat] = useState<CarouselFormat>("linkedin-4x5");
  const [backgroundId, setBackgroundId] = useState("cobalt-eclipse");
  const [pattern, setPattern] = useState<BackdropPattern>("spotlight");
  const [useBrandTint, setUseBrandTint] = useState(true);
  const [slides, setSlides] = useState<CarouselSlide[]>(() =>
    createInitialSlides(brandKit.brandName)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExportingAll, setIsExportingAll] = useState(false);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const spec = CAROUSEL_FORMATS[format];
  const bgPreset = BACKGROUND_PRESETS.find((b) => b.id === backgroundId) || BACKGROUND_PRESETS[0];
  const activeSlide = slides[Math.min(activeIndex, slides.length - 1)];
  const fonts = getFontMoodClasses(brandKit.fontMood);

  const updateSlide = (index: number, patch: Partial<CarouselSlide>) => {
    setSlides((prev) => prev.map((s, idx) => (idx === index ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    if (slides.length >= 5) {
      onNotify("Carousel supports up to 5 continuous slides.", "error");
      return;
    }
    const nextNum = slides.length + 1;
    const newSlide: CarouselSlide = {
      id: `slide-${Date.now()}`,
      eyebrow: `0${nextNum} · Feature`,
      headline: `Slide ${nextNum}: Highlight key impact.`,
      subtitle: "Seamless gradient flow connects this frame to adjacent slides.",
      frame: "macos-dark",
      imageSrc: SAMPLE_MOCKUPS.saas.src,
      activeSampleId: "saas",
      scale: 92,
      rotateX: 0,
      rotateY: 0,
      rotateZ: 0,
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveIndex(slides.length);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 3) {
      onNotify("Continuous carousels require at least 3 slides.", "error");
      return;
    }
    setSlides((prev) => prev.filter((_, idx) => idx !== index));
    setActiveIndex((prev) => Math.max(0, Math.min(prev, slides.length - 2)));
  };

  const handleSlideUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateSlide(activeIndex, { imageSrc: reader.result, activeSampleId: null });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportAllSlides = async () => {
    setIsExportingAll(true);
    try {
      await new Promise((r) => setTimeout(r, 40));
      for (let i = 0; i < slides.length; i++) {
        const el = slideRefs.current[i];
        if (!el) continue;
        const dataUrl = await toPng(el, {
          pixelRatio: 2,
          cacheBust: false,
          quality: 0.96,
        });
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `snapframy-carousel-slide-${i + 1}-of-${slides.length}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        await new Promise((r) => setTimeout(r, 140));
      }
      onNotify(`Exported all ${slides.length} seamless carousel slides (2x PNG)`);
    } catch {
      onNotify("Failed to export carousel slides.", "error");
    } finally {
      setIsExportingAll(false);
    }
  };

  const totalPanoramaW = spec.width * slides.length;

  const getContinuousBackdropStyle = (slideIndex: number): React.CSSProperties => {
    const offsetX = -slideIndex * spec.width;
    const brandMesh = useBrandTint
      ? `radial-gradient(circle at 18% 22%, ${brandKit.primaryColor}88 0%, transparent 45%), radial-gradient(circle at 82% 78%, ${brandKit.secondaryAccent}66 0%, transparent 48%), `
      : "";
    return {
      width: `${totalPanoramaW}px`,
      height: `${spec.height}px`,
      transform: `translateX(${offsetX}px)`,
      backgroundImage: `${brandMesh}${bgPreset.style}`,
    };
  };

  const getContinuousPatternStyle = (): React.CSSProperties | null => {
    if (pattern === "none") return null;
    const color = bgPreset.isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)";
    if (pattern === "dots") {
      return {
        backgroundImage: `radial-gradient(${color} 1.2px, transparent 1.2px)`,
        backgroundSize: "18px 18px",
      };
    }
    if (pattern === "grid") {
      return {
        backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
        backgroundSize: "34px 34px",
      };
    }
    if (pattern === "rings") {
      return {
        backgroundImage: `repeating-radial-gradient(circle at 50% 50%, transparent 0px, transparent 58px, ${color} 59px, transparent 60px)`,
      };
    }
    return {
      backgroundImage: `radial-gradient(ellipse at 50% 45%, rgba(255,255,255,0.16) 0%, transparent 65%)`,
    };
  };

  const patternStyle = getContinuousPatternStyle();

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#0A0A0C]">
      {/* Left Controls: Format, Slides, Backdrop */}
      <aside className="w-full lg:w-[270px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#1E1E24] bg-[#101014] p-4 space-y-5 overflow-y-auto studio-scroll">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-white">Carousel Format</h2>
            <span className="text-[11px] font-mono-tabular text-zinc-400">
              {slides.length} slides
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(CAROUSEL_FORMATS) as CarouselFormat[]).map((id) => {
              const opt = CAROUSEL_FORMATS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormat(id)}
                  className={`p-2 rounded-md text-left border cursor-pointer transition-colors ${
                    format === id
                      ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <div className="text-xs font-mono-tabular font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{opt.platform}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[#1E1E24]" />

        {/* Slide List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-zinc-200">Slides (3–5)</h3>
            <button
              type="button"
              onClick={addSlide}
              disabled={slides.length >= 5}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#181820] hover:bg-[#22222D] border border-[#282834] text-[11px] font-medium text-zinc-200 cursor-pointer disabled:opacity-40"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>

          <div className="space-y-1.5">
            {slides.map((s, idx) => (
              <div
                key={s.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border cursor-pointer transition-colors ${
                  activeIndex === idx
                    ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                    : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold truncate">
                    Slide {idx + 1}: {s.headline}
                  </div>
                  <div className="text-[10px] text-zinc-500">{s.frame}</div>
                </div>
                {slides.length > 3 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSlide(idx);
                    }}
                    className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                    title="Remove slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-[#1E1E24]" />

        {/* Seamless Panorama Backdrop */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-zinc-200">Seamless Flow Backdrop</h3>
            <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={useBrandTint}
                onChange={(e) => setUseBrandTint(e.target.checked)}
                className="accent-[#2563EB]"
              />
              Brand Tint
            </label>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {BACKGROUND_PRESETS.slice(0, 14).map((bg) => (
              <button
                key={bg.id}
                type="button"
                title={bg.name}
                onClick={() => setBackgroundId(bg.id)}
                className={`h-6 rounded border cursor-pointer ${
                  backgroundId === bg.id ? "border-white ring-1 ring-[#3B82F6]" : "border-white/15"
                }`}
                style={{ background: bg.swatch }}
              />
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1 mt-2.5">
            {(["none", "dots", "grid", "spotlight", "rings"] as BackdropPattern[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPattern(p)}
                className={`py-1 rounded text-[10px] font-medium capitalize border cursor-pointer ${
                  pattern === p
                    ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                    : "bg-[#141419] border-[#22222A] text-zinc-400"
                }`}
              >
                {p === "spotlight" ? "Glow" : p}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Center Continuous Strip Preview */}
      <section className="flex-1 flex flex-col min-w-0 studio-canvas-grid overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1E1E24] bg-[#0D0D10]/90">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span className="text-zinc-200 font-medium">
              Continuous Panorama ({slides.length} seamless slides)
            </span>
            <span className="hidden sm:inline text-zinc-500">
              · Click any slide text to edit inline
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenBrandKit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: brandKit.primaryColor }} />
              Brand Kit
            </button>
            <button
              type="button"
              disabled={isExportingAll}
              onClick={handleExportAllSlides}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              {isExportingAll ? "Exporting Slides..." : `Export All ${slides.length} Slides`}
            </button>
          </div>
        </div>

        {/* Horizontal Seamless Strip */}
        <div className="flex-1 overflow-auto studio-scroll p-6 flex items-center">
          <div className="mx-auto flex items-center gap-1.5">
            {slides.map((slide, idx) => {
              const isSelected = idx === activeIndex;
              const lightText = bgPreset.isDark;
              return (
                <div
                  key={slide.id}
                  onClick={() => setActiveIndex(idx)}
                  className={`relative shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-[#3B82F6] ring-offset-2 ring-offset-[#0D0D10]"
                      : "opacity-90 hover:opacity-100"
                  }`}
                >
                  {/* Exportable Slide Viewport */}
                  <div
                    ref={(el) => {
                      slideRefs.current[idx] = el;
                    }}
                    className="relative overflow-hidden flex flex-col justify-between p-6 select-none"
                    style={{
                      width: `${spec.width}px`,
                      height: `${spec.height}px`,
                    }}
                  >
                    {/* Continuous Background Slice */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 left-0"
                      style={getContinuousBackdropStyle(idx)}
                    />
                    {patternStyle && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 left-0"
                        style={{
                          ...patternStyle,
                          width: `${totalPanoramaW}px`,
                          height: `${spec.height}px`,
                          transform: `translateX(${-idx * spec.width}px)`,
                        }}
                      />
                    )}

                    {/* Slide Header Copy */}
                    <div className="relative z-10 space-y-1 text-left">
                      <InlineEditable
                        lightSurface={!lightText}
                        value={slide.eyebrow}
                        onChange={(v) => updateSlide(idx, { eyebrow: v })}
                        className={`text-[10px] font-mono-tabular font-semibold uppercase tracking-widest ${
                          lightText ? "text-white/75" : "text-zinc-600"
                        }`}
                      />
                      <div>
                        <InlineEditable
                          as="h2"
                          lightSurface={!lightText}
                          value={slide.headline}
                          onChange={(v) => updateSlide(idx, { headline: v })}
                          className={`text-lg font-bold leading-snug ${
                            lightText ? "text-white" : "text-zinc-900"
                          }`}
                          style={fonts.displayStyle}
                        />
                      </div>
                      <div>
                        <InlineEditable
                          as="p"
                          lightSurface={!lightText}
                          value={slide.subtitle}
                          onChange={(v) => updateSlide(idx, { subtitle: v })}
                          className={`text-[11px] leading-relaxed ${
                            lightText ? "text-white/75" : "text-zinc-600"
                          }`}
                          style={fonts.bodyStyle}
                        />
                      </div>
                    </div>

                    {/* Framed Product Visual */}
                    <div
                      className="relative z-10 my-auto flex items-center justify-center"
                      style={{
                        transform: `perspective(1000px) scale(${slide.scale / 100}) rotateX(${slide.rotateX}deg) rotateY(${slide.rotateY}deg) rotateZ(${slide.rotateZ}deg)`,
                      }}
                    >
                      <div className="w-full rounded-xl overflow-hidden border border-white/15 bg-[#0B0D12] shadow-2xl">
                        {slide.frame !== "none" && slide.frame !== "glass" && (
                          <div className="px-3 py-1.5 bg-[#191B22] border-b border-white/10 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                            <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                            <span className="w-2 h-2 rounded-full bg-[#27C93F]" />
                            <span className="ml-2 text-[9px] font-mono-tabular text-zinc-400 truncate">
                              {brandKit.domainBadge}
                            </span>
                          </div>
                        )}
                        <div className="max-h-[260px] overflow-hidden">
                          {slide.activeSampleId ? (
                            <LiveSceneRenderer
                              sampleId={slide.activeSampleId}
                              data={mockupData}
                              isExporting={isExportingAll}
                              onUpdateData={onUpdateMockupData}
                            />
                          ) : (
                            <img
                              src={slide.imageSrc}
                              alt={`Slide ${idx + 1}`}
                              referrerPolicy="no-referrer"
                              className="w-full h-auto block"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Swipe / Brand Indicator */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono-tabular">
                      <span className={lightText ? "text-white/65" : "text-zinc-600"}>
                        {brandKit.showDomainBadge ? brandKit.domainBadge : brandKit.brandName}
                      </span>
                      <span className={lightText ? "text-white/75" : "text-zinc-700"}>
                        {idx + 1} / {slides.length} {idx < slides.length - 1 ? "→" : ""}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Right Slide Inspector */}
      <aside className="w-full lg:w-[264px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] p-4 space-y-4 overflow-y-auto studio-scroll">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white">
            Editing Slide {activeIndex + 1}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="p-1 rounded bg-[#181820] border border-[#262630] text-zinc-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={activeIndex === slides.length - 1}
              onClick={() => setActiveIndex((i) => Math.min(slides.length - 1, i + 1))}
              className="p-1 rounded bg-[#181820] border border-[#262630] text-zinc-300 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleSlideUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#181820] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-100 cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5 text-[#60A5FA]" />
          Upload Slide Image
        </button>

        <div>
          <span className="block text-[11px] text-zinc-400 mb-1.5">Or Live Scene</span>
          <div className="grid grid-cols-3 gap-1">
            {(["saas", "ai", "ecommerce", "code", "mobile", "social"] as SampleId[]).map((sid) => (
              <button
                key={sid}
                type="button"
                onClick={() =>
                  updateSlide(activeIndex, {
                    activeSampleId: sid,
                    imageSrc: SAMPLE_MOCKUPS[sid].src,
                  })
                }
                className={`py-1.5 rounded text-[10px] font-medium capitalize border cursor-pointer ${
                  activeSlide.activeSampleId === sid
                    ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                    : "bg-[#141419] border-[#22222A] text-zinc-400"
                }`}
              >
                {sid}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-[11px] text-zinc-400 mb-1.5">Slide Frame</span>
          <div className="grid grid-cols-3 gap-1">
            {(["macos-dark", "browser", "glass", "none"] as FrameType[]).map((fr) => (
              <button
                key={fr}
                type="button"
                onClick={() => updateSlide(activeIndex, { frame: fr })}
                className={`py-1.5 rounded text-[10px] font-medium border cursor-pointer ${
                  activeSlide.frame === fr
                    ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                    : "bg-[#141419] border-[#22222A] text-zinc-400"
                }`}
              >
                {fr === "macos-dark" ? "macOS" : fr === "none" ? "Clean" : fr}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span>Tilt Y</span>
            <span className="font-mono-tabular text-zinc-300">{activeSlide.rotateY}°</span>
          </div>
          <input
            type="range"
            min={-20}
            max={20}
            value={activeSlide.rotateY}
            onChange={(e) => updateSlide(activeIndex, { rotateY: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span>Scale</span>
            <span className="font-mono-tabular text-zinc-300">{activeSlide.scale}%</span>
          </div>
          <input
            type="range"
            min={70}
            max={100}
            value={activeSlide.scale}
            onChange={(e) => updateSlide(activeIndex, { scale: Number(e.target.value) })}
            className="studio-slider"
          />
        </div>
      </aside>
    </div>
  );
};
