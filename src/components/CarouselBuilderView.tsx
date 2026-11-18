import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Download,
  Upload,
  Palette,
  Layers,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Eye,
  EyeOff,
  Shuffle,
  Copy,
  Crosshair,
  ZoomIn,
  Maximize2,
  Minimize2,
  Lock,
  Crop,
  ChevronDown,
} from "lucide-react";
import { ImageCropModal } from "./ImageCropModal";
import { toPng } from "html-to-image";
import { BACKGROUND_PRESETS, SAMPLE_MOCKUPS } from "../data/presets";
import {
  BackdropPattern,
  BrandKit,
  CarouselFormat,
  CarouselSlide,
  FrameType,
  MockupContentData,
  PhoneFitMode,
  SampleId,
} from "../types/studio";
import { getFontMoodClasses } from "../utils/brandKitStorage";
import { InlineEditable } from "./InlineEditable";
import { LiveSceneRenderer } from "./LiveSceneRenderer";

interface CarouselBuilderViewProps {
  brandKit: BrandKit;
  mockupData: MockupContentData;
  activeStudioImageSrc?: string;
  onUpdateMockupData: <K extends keyof MockupContentData>(
    scene: K,
    patch: Partial<MockupContentData[K]>
  ) => void;
  onOpenBrandKit: () => void;
  onNotify: (msg: string, type?: "info" | "error") => void;
  isPreviewLocked?: boolean;
  onRequireAuthForUpload?: () => void;
}

const CAROUSEL_FORMATS: Record<
  CarouselFormat,
  { label: string; platform: string; width: number; height: number }
> = {
  "linkedin-4x5": { label: "4:5", platform: "LinkedIn Carousel", width: 432, height: 540 },
  "mobile-9x16": { label: "9:16", platform: "Phone / Stories", width: 312, height: 554 },
  "product-hunt": { label: "1270×760", platform: "Product Hunt", width: 520, height: 311 },
  "x-16x9": { label: "16:9", platform: "X / Twitter", width: 520, height: 293 },
  "square-1x1": { label: "1:1", platform: "Square Deck", width: 440, height: 440 },
};

interface CarouselDeckTemplate {
  id: string;
  name: string;
  tag: string;
  format: CarouselFormat;
  backgroundId: string;
  pattern: BackdropPattern;
  isPhone?: boolean;
  buildSlides: (brandName: string) => CarouselSlide[];
}

const CAROUSEL_TEMPLATES: CarouselDeckTemplate[] = [
  {
    id: "saas-launch-4x5",
    name: "SaaS Launch Deck",
    tag: "4:5 · LinkedIn",
    format: "linkedin-4x5",
    backgroundId: "cobalt-eclipse",
    pattern: "spotlight",
    buildSlides: (brandName) => [
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
    ],
  },
  {
    id: "mobile-app-tour-9x16",
    name: "Mobile App Tour (Phone)",
    tag: "9:16 · iPhone",
    format: "mobile-9x16",
    backgroundId: "cobalt-eclipse",
    pattern: "dots",
    isPhone: true,
    buildSlides: (brandName) => [
      {
        id: "m-slide-1",
        eyebrow: "01 · Mobile First",
        headline: `${brandName} in your pocket.`,
        subtitle: "Built for iOS & Android speed with instant sync everywhere.",
        frame: "iphone",
        imageSrc: SAMPLE_MOCKUPS.mobile.src,
        activeSampleId: "mobile",
        scale: 95,
        rotateX: 0,
        rotateY: 6,
        rotateZ: 0,
      },
      {
        id: "m-slide-2",
        eyebrow: "02 · Live Insights",
        headline: "Track growth on the go.",
        subtitle: "Real-time alerts, conversion funnels, and smart summaries.",
        frame: "iphone",
        imageSrc: SAMPLE_MOCKUPS.saas.src,
        activeSampleId: "saas",
        scale: 95,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      },
      {
        id: "m-slide-3",
        eyebrow: "03 · AI Copilot",
        headline: "Ship answers in one tap.",
        subtitle: "Swipe up or tap the link in bio to try free today.",
        frame: "iphone",
        imageSrc: SAMPLE_MOCKUPS.ai.src,
        activeSampleId: "ai",
        scale: 95,
        rotateX: 0,
        rotateY: -6,
        rotateZ: 0,
      },
    ],
  },
  {
    id: "mobile-stories-hook-9x16",
    name: "Stories & Reels Phone Deck",
    tag: "9:16 · iPhone",
    format: "mobile-9x16",
    backgroundId: "sunset-ember",
    pattern: "spotlight",
    isPhone: true,
    buildSlides: (brandName) => [
      {
        id: "st-slide-1",
        eyebrow: "01 · Quick Hook",
        headline: "3 features you missed.",
        subtitle: `Swipe through how ${brandName} saves 6+ hours every week.`,
        frame: "iphone",
        imageSrc: SAMPLE_MOCKUPS.social.src,
        activeSampleId: "social",
        scale: 96,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      },
      {
        id: "st-slide-2",
        eyebrow: "02 · Storefront",
        headline: "Checkout in 2 seconds.",
        subtitle: "Apple Pay & one-tap mobile flows tuned for conversion.",
        frame: "iphone",
        imageSrc: SAMPLE_MOCKUPS.ecommerce.src,
        activeSampleId: "ecommerce",
        scale: 96,
        rotateX: 0,
        rotateY: 4,
        rotateZ: 0,
      },
      {
        id: "st-slide-3",
        eyebrow: "03 · Try Free",
        headline: "Start free in 30 seconds.",
        subtitle: "No setup fees. Export branded assets immediately.",
        frame: "iphone",
        imageSrc: SAMPLE_MOCKUPS.mobile.src,
        activeSampleId: "mobile",
        scale: 96,
        rotateX: 0,
        rotateY: -4,
        rotateZ: 0,
      },
    ],
  },
  {
    id: "product-hunt-gallery",
    name: "Product Hunt Gallery",
    tag: "1270×760 · Launch",
    format: "product-hunt",
    backgroundId: "midnight-aurora",
    pattern: "grid",
    buildSlides: (brandName) => [
      {
        id: "ph-1",
        eyebrow: "Introducing",
        headline: `${brandName} 2.0 Launch`,
        subtitle: "Create product launches, reels, and decks from a single screenshot.",
        frame: "macos-dark",
        imageSrc: SAMPLE_MOCKUPS.saas.src,
        activeSampleId: "saas",
        scale: 90,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      },
      {
        id: "ph-2",
        eyebrow: "Workflow",
        headline: "Instant AI Storytelling",
        subtitle: "Zero editing bottlenecks for founders and growth teams.",
        frame: "glass",
        imageSrc: SAMPLE_MOCKUPS.ai.src,
        activeSampleId: "ai",
        scale: 90,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      },
      {
        id: "ph-3",
        eyebrow: "Developer Ready",
        headline: "Clean Code & Fast Ship",
        subtitle: "Export crisp 2x/3x visuals ready for any launch page.",
        frame: "browser",
        imageSrc: SAMPLE_MOCKUPS.code.src,
        activeSampleId: "code",
        scale: 90,
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
      },
    ],
  },
];

function createInitialSlides(brandName: string): CarouselSlide[] {
  return CAROUSEL_TEMPLATES[0].buildSlides(brandName);
}

export const CarouselBuilderView: React.FC<CarouselBuilderViewProps> = ({
  brandKit,
  mockupData,
  activeStudioImageSrc,
  onUpdateMockupData,
  onOpenBrandKit,
  onNotify,
  isPreviewLocked = false,
  onRequireAuthForUpload,
}) => {
  const [activeTemplateId, setActiveTemplateId] = useState(CAROUSEL_TEMPLATES[0].id);
  const [format, setFormat] = useState<CarouselFormat>("linkedin-4x5");
  const [backgroundId, setBackgroundId] = useState("cobalt-eclipse");
  const [pattern, setPattern] = useState<BackdropPattern>("spotlight");
  const [useBrandTint, setUseBrandTint] = useState(true);
  const [showBrandHeader, setShowBrandHeader] = useState(true);
  const [showSlideText, setShowSlideText] = useState(true);
  const [stripZoom, setStripZoom] = useState<0.55 | 0.78 | 1>(0.78);
  const [slides, setSlides] = useState<CarouselSlide[]>(() =>
    createInitialSlides(brandKit.brandName)
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideAspectMap, setSlideAspectMap] = useState<Record<string, number>>({});
  const [isExportingAll, setIsExportingAll] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const spec = CAROUSEL_FORMATS[format];
  const bgPreset = BACKGROUND_PRESETS.find((b) => b.id === backgroundId) || BACKGROUND_PRESETS[0];
  const activeSlide = slides[Math.min(activeIndex, slides.length - 1)];
  const fonts = getFontMoodClasses(brandKit.fontMood);
  const isPhoneDeck = format === "mobile-9x16";
  const hasAnyPhoneSlide = slides.some((s) => s.frame === "iphone");

  const applyCarouselTemplate = (tpl: CarouselDeckTemplate) => {
    setActiveTemplateId(tpl.id);
    setFormat(tpl.format);
    setBackgroundId(tpl.backgroundId);
    setPattern(tpl.pattern);
    setSlides(tpl.buildSlides(brandKit.brandName || "SnapFramy"));
    setActiveIndex(0);
    onNotify(`Applied "${tpl.name}" carousel template`);
  };

  const togglePhoneDeckFormat = () => {
    if (isPhoneDeck) {
      setFormat("linkedin-4x5");
      setSlides((prev) =>
        prev.map((s) => ({
          ...s,
          frame: "macos-dark",
          scale: 92,
        }))
      );
      onNotify("Switched Carousel back to 4:5 Desktop format");
    } else {
      setFormat("mobile-9x16");
      setSlides((prev) =>
        prev.map((s) => ({
          ...s,
          frame: "iphone",
          phoneFit: s.phoneFit ?? "showcase",
          scale: Math.max(94, Math.min(115, s.scale)),
        }))
      );
      onNotify("Converted Carousel to Phone Format (9:16 · iPhone)");
    }
  };

  const togglePhoneShellAll = () => {
    if (hasAnyPhoneSlide) {
      setSlides((prev) =>
        prev.map((s) => (s.frame === "iphone" ? { ...s, frame: "none" } : s))
      );
      onNotify("Removed Phone frame — showcasing screenshots independently");
    } else {
      setSlides((prev) =>
        prev.map((s) => ({
          ...s,
          frame: "iphone",
          phoneFit: s.phoneFit ?? "showcase",
        }))
      );
      onNotify("Restored iPhone frame on all slides");
    }
  };

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

  const moveSlide = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= slides.length) return;
    setSlides((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setActiveIndex(target);
  };

  const duplicateSlide = (index: number) => {
    if (slides.length >= 5) {
      onNotify("Carousel supports up to 5 continuous slides.", "error");
      return;
    }
    const srcSlide = slides[index];
    const cloned: CarouselSlide = {
      ...srcSlide,
      id: `slide-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setSlides((prev) => [...prev.slice(0, index + 1), cloned, ...prev.slice(index + 1)]);
    setActiveIndex(index + 1);
    onNotify(`Duplicated Slide ${index + 1}`);
  };

  const handleDropOnSlide = (idx: number, e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (isPreviewLocked && onRequireAuthForUpload) {
      onRequireAuthForUpload();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateSlide(idx, { imageSrc: reader.result, activeSampleId: null });
        setActiveIndex(idx);
        onNotify(`Dropped screenshot onto Slide ${idx + 1}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemixLook = () => {
    const bgPool = BACKGROUND_PRESETS.slice(0, 14);
    const nextBg = bgPool[Math.floor(Math.random() * bgPool.length)] || BACKGROUND_PRESETS[0];
    const patterns: BackdropPattern[] = ["spotlight", "dots", "grid", "rings"];
    const nextPat = patterns[Math.floor(Math.random() * patterns.length)];
    setBackgroundId(nextBg.id);
    setPattern(nextPat);
    onNotify(`Remixed backdrop: ${nextBg.name}`);
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
      {/* Left Controls: Templates, Format, Slides, Backdrop */}
      <aside className="w-full lg:w-[270px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#1E1E24] bg-[#101014] p-4 space-y-5 overflow-y-auto studio-scroll">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-semibold text-white">Deck Templates</h2>
            <span className="text-[10px] font-mono-tabular text-zinc-400">
              {CAROUSEL_TEMPLATES.length} decks
            </span>
          </div>
          <div className="space-y-1.5">
            {CAROUSEL_TEMPLATES.map((tpl) => {
              const active = activeTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyCarouselTemplate(tpl)}
                  className={`w-full text-left px-2.5 py-2 rounded-md border cursor-pointer transition-colors ${
                    active
                      ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-300 hover:border-[#32323E]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold truncate">{tpl.name}</span>
                    {tpl.isPhone && (
                      <Smartphone className="w-3 h-3 text-[#60A5FA] shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{tpl.tag}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[#1E1E24]" />

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
                className={`flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-md border cursor-pointer transition-colors ${
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
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(idx, -1);
                    }}
                    className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move earlier"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      moveSlide(idx, 1);
                    }}
                    className="p-0.5 text-zinc-500 hover:text-white disabled:opacity-30 cursor-pointer"
                    title="Move later"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  {slides.length < 5 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateSlide(idx);
                      }}
                      className="p-0.5 text-zinc-500 hover:text-[#60A5FA] cursor-pointer"
                      title="Duplicate slide"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                  {slides.length > 3 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlide(idx);
                      }}
                      className="p-0.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                      title="Remove slide"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
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
      <section
        className={
          isFullscreen
            ? "fixed inset-0 z-50 flex flex-col bg-[#060608] overflow-hidden"
            : "flex-1 flex flex-col min-w-0 studio-canvas-grid overflow-hidden"
        }
      >
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

          <div className="flex items-center gap-2 flex-wrap relative">
            <div className="flex items-center gap-0.5 p-0.5 rounded-md bg-[#18181F] border border-[#282834]">
              <ZoomIn className="w-3 h-3 text-zinc-400 ml-1.5 mr-0.5" />
              {[
                { label: "Fit", val: 0.55 as const },
                { label: "78%", val: 0.78 as const },
                { label: "100%", val: 1 as const },
              ].map((z) => (
                <button
                  key={z.label}
                  type="button"
                  onClick={() => setStripZoom(z.val)}
                  className={`px-2 py-1 rounded text-[11px] font-mono-tabular cursor-pointer transition-colors ${
                    stripZoom === z.val
                      ? "bg-[#2563EB] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={togglePhoneDeckFormat}
              title="Convert all slides to Mobile Phone Format (9:16 · iPhone)"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                isPhoneDeck
                  ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                  : "bg-[#18181F] hover:bg-[#22222C] border-[#282834] text-zinc-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
              Phone
            </button>
            {(isPhoneDeck || hasAnyPhoneSlide) && (
              <button
                type="button"
                onClick={togglePhoneShellAll}
                title={
                  hasAnyPhoneSlide
                    ? "Remove the iPhone frame from slides and showcase screenshots independently"
                    : "Restore the iPhone frame on all slides"
                }
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                  !hasAnyPhoneSlide
                    ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                    : "bg-[#18181F] hover:bg-[#22222C] border-[#282834] text-zinc-200"
                }`}
              >
                {hasAnyPhoneSlide ? (
                  <EyeOff className="w-3.5 h-3.5 text-[#60A5FA]" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
                )}
                {hasAnyPhoneSlide ? "Remove Phone" : "Show Phone"}
              </button>
            )}
            {!isFullscreen && (
              <>
                <button
                  type="button"
                  onClick={() => setCropOpen(true)}
                  title="Crop current slide screenshot so it fits cleanly inside the frame"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
                >
                  <Crop className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Crop
                </button>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMoreMenuOpen((v) => !v)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
                  >
                    More
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>
                  {moreMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-44 rounded-lg bg-[#14141B] border border-[#282836] shadow-2xl p-1.5 z-40 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleRemixLook();
                          setMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 hover:bg-[#20202C] cursor-pointer"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-[#60A5FA]" />
                        Remix Backdrop
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowSlideText((v) => !v);
                          setMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 hover:bg-[#20202C] cursor-pointer"
                      >
                        {showSlideText ? (
                          <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        {showSlideText ? "Hide Headings" : "Show Headings"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowBrandHeader((v) => !v);
                          setMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 hover:bg-[#20202C] cursor-pointer"
                      >
                        {showBrandHeader ? (
                          <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        {showBrandHeader ? "Hide Brand Bar" : "Show Brand Bar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenBrandKit();
                          setMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 hover:bg-[#20202C] cursor-pointer"
                      >
                        <Palette className="w-3.5 h-3.5" style={{ color: brandKit.primaryColor }} />
                        Brand Kit
                      </button>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isExportingAll}
                  onClick={handleExportAllSlides}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isExportingAll ? "Saving..." : `Export ${slides.length} Slides`}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? "Exit Fullscreen Preview (Esc)" : "Fullscreen Preview"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                isFullscreen
                  ? "bg-[#2563EB] border-[#3B82F6] text-white"
                  : "bg-[#18181F] hover:bg-[#22222C] border-[#282834] text-zinc-200"
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  Exit
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Fullscreen
                </>
              )}
            </button>
          </div>
        </div>

        {/* Horizontal Seamless Strip */}
        <div className="flex-1 overflow-auto studio-scroll p-6 flex items-center">
          <div
            className="mx-auto flex items-center gap-2 origin-left transition-transform duration-150"
            style={
              isExportingAll || stripZoom === 1
                ? undefined
                : { zoom: stripZoom }
            }
          >
            {slides.map((slide, idx) => {
              const isSelected = idx === activeIndex;
              const lightText = bgPreset.isDark;
              return (
                <div
                  key={slide.id}
                  onClick={() => setActiveIndex(idx)}
                  onDrop={(e) => handleDropOnSlide(idx, e)}
                  onDragOver={(e) => e.preventDefault()}
                  className={`relative shrink-0 transition-all cursor-pointer ${
                    isFullscreen
                      ? ""
                      : isSelected
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
                    {showSlideText && (
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
                    )}

                    {/* Framed Product Visual */}
                    <div
                      className="relative z-10 my-auto flex items-center justify-center"
                      style={{
                        transform: `perspective(1000px) scale(${slide.scale / 100}) rotateX(${slide.rotateX}deg) rotateY(${slide.rotateY}deg) rotateZ(${slide.rotateZ}deg)`,
                      }}
                    >
                      {slide.frame === "iphone" ? (
                        (() => {
                          const isWideDesktop = slide.activeSampleId
                            ? slide.activeSampleId !== "mobile"
                            : (slideAspectMap[slide.id] ?? 1.6) > 1.12;
                          const fitMode = slide.phoneFit ?? (isWideDesktop ? "showcase" : "pan");
                          const panPct = slide.phonePanX ?? 50;
                          const popWidth = Math.min(spec.width - 28, isWideDesktop ? 316 : 224);

                          const renderSlideInner = (imgClass = "w-full h-auto block", imgStyle?: React.CSSProperties) =>
                            slide.activeSampleId ? (
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
                                onLoad={(e) => {
                                  const el = e.currentTarget;
                                  if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                                    const ratio = el.naturalWidth / el.naturalHeight;
                                    setSlideAspectMap((prev) =>
                                      prev[slide.id] === ratio ? prev : { ...prev, [slide.id]: ratio }
                                    );
                                  }
                                }}
                                style={imgStyle}
                                className={imgClass}
                              />
                            );

                          return (
                            <div className="relative flex items-center justify-center">
                              <div className="w-[218px] rounded-[30px] p-[8px] bg-gradient-to-b from-[#3A3D47] via-[#1B1D24] to-[#2B2E38] shadow-2xl border border-white/15">
                                <div className="relative rounded-[23px] overflow-hidden bg-[#0B0D12] aspect-[9/16] flex flex-col justify-center">
                                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-16 h-4 rounded-full bg-black border border-white/10" />

                                  {/* Ambient blurred echo for desktop media */}
                                  {isWideDesktop && !slide.activeSampleId && (
                                    <img
                                      src={slide.imageSrc}
                                      alt=""
                                      aria-hidden="true"
                                      className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-35 blur-md scale-125"
                                    />
                                  )}
                                  {isWideDesktop && slide.activeSampleId && (
                                    <div
                                      aria-hidden="true"
                                      className="pointer-events-none absolute inset-0 opacity-45"
                                      style={{
                                        background: `radial-gradient(circle at 30% 25%, ${brandKit.primaryColor}66 0%, transparent 55%), radial-gradient(circle at 75% 75%, ${brandKit.secondaryAccent}44 0%, transparent 60%)`,
                                      }}
                                    />
                                  )}

                                  <div className="relative z-10 flex-1 overflow-hidden flex items-center justify-center">
                                    {!isWideDesktop ? (
                                      renderSlideInner("w-full h-full object-cover block")
                                    ) : fitMode === "pan" ? (
                                      slide.activeSampleId ? (
                                        <div className="w-full h-full overflow-hidden flex items-center">
                                          <div
                                            className="w-[410px] shrink-0 origin-left"
                                            style={{
                                              transform: `translateX(-${Math.round((panPct / 100) * 195)}px) scale(0.86)`,
                                            }}
                                          >
                                            {renderSlideInner()}
                                          </div>
                                        </div>
                                      ) : (
                                        renderSlideInner("w-full h-full object-cover block", {
                                          objectPosition: `${panPct}% 50%`,
                                        })
                                      )
                                    ) : fitMode === "fit" ? (
                                      <div className="w-full px-1.5">
                                        <div className="rounded-lg overflow-hidden border border-white/20 shadow-xl bg-[#0B0D12]">
                                          {slide.activeSampleId ? (
                                            <div className="w-[380px] origin-top-left" style={{ transform: "scale(0.49)", marginBottom: "-52%" }}>
                                              {renderSlideInner()}
                                            </div>
                                          ) : (
                                            renderSlideInner()
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-auto mb-3 text-[8px] font-mono-tabular text-white/45">
                                        {brandKit.brandName || "Desktop"}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Pop-Out Wide Desktop Card over Phone Bezel */}
                              {isWideDesktop && fitMode === "showcase" && (
                                <div
                                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 rounded-xl overflow-hidden border border-white/25 bg-[#0B0D12]"
                                  style={{
                                    width: `${popWidth}px`,
                                    boxShadow: "0 22px 48px -10px rgba(0,0,0,0.85)",
                                  }}
                                >
                                  {showBrandHeader && (
                                    <div className="px-2.5 py-1 bg-[#191B22] border-b border-white/10 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#FF5F56]" />
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFBD2E]" />
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F]" />
                                      <span className="ml-1.5 text-[8px] font-mono-tabular text-zinc-400 truncate">
                                        {brandKit.domainBadge}
                                      </span>
                                    </div>
                                  )}
                                  <div className="max-h-[245px] overflow-hidden">
                                    {renderSlideInner()}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      ) : (
                        <div
                          className={`${
                            format === "mobile-9x16" && slide.frame === "none"
                              ? "w-auto max-w-full rounded-2xl"
                              : "w-full rounded-xl"
                          } overflow-hidden border border-white/15 bg-[#0B0D12] shadow-2xl`}
                        >
                          {showBrandHeader && slide.frame !== "none" && slide.frame !== "glass" && (
                            <div className="px-3 py-1.5 bg-[#191B22] border-b border-white/10 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-[#FF5F56]" />
                              <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
                              <span className="w-2 h-2 rounded-full bg-[#27C93F]" />
                              <span className="ml-2 text-[9px] font-mono-tabular text-zinc-400 truncate">
                                {brandKit.domainBadge}
                              </span>
                            </div>
                          )}
                          <div
                            className={`${
                              format === "mobile-9x16" ? "max-h-[360px]" : "max-h-[260px]"
                            } overflow-hidden relative`}
                          >
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
                                className={
                                  format === "mobile-9x16" && slide.frame === "none"
                                    ? "max-h-[360px] w-auto max-w-full h-auto block object-contain"
                                    : "w-full h-auto block"
                                }
                              />
                            )}
                            {slide.spotlightEnabled && (
                              <div
                                className="pointer-events-none absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-2 shadow-xl"
                                style={{
                                  left: `${(slide.spotlightX ?? 0.58) * 100}%`,
                                  top: `${(slide.spotlightY ?? 0.44) * 100}%`,
                                  borderColor: brandKit.secondaryAccent || "#60A5FA",
                                  backgroundColor: `${brandKit.primaryColor}30`,
                                  boxShadow: `0 0 0 4px ${brandKit.primaryColor}25`,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      )}

                      {slide.badgeText && slide.badgeText.trim() && (
                        <div
                          className="absolute -top-2.5 -right-1 z-30 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xl border"
                          style={{
                            background: "rgba(13, 16, 26, 0.92)",
                            borderColor: brandKit.secondaryAccent || "#60A5FA",
                          }}
                        >
                          {slide.badgeText}
                        </div>
                      )}
                    </div>

                    {/* Footer Swipe / Brand Indicator */}
                    <div className="relative z-10 flex items-center justify-between text-[10px] font-mono-tabular">
                      <span className={lightText ? "text-white/65" : "text-zinc-600"}>
                        {showBrandHeader
                          ? brandKit.showDomainBadge
                            ? brandKit.domainBadge
                            : brandKit.brandName
                          : ""}
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
      <aside className="w-full lg:w-[264px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] p-4 pb-24 space-y-4 overflow-y-auto studio-scroll">
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
        <div className="grid grid-cols-1 gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (isPreviewLocked && onRequireAuthForUpload) {
                onRequireAuthForUpload();
                return;
              }
              fileInputRef.current?.click();
            }}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#181820] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-100 cursor-pointer"
          >
            {isPreviewLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-[#60A5FA]" />
            )}
            {isPreviewLocked ? "Upload Slide Image (Sign In)" : "Upload Slide Image"}
          </button>
          <button
            type="button"
            onClick={() => setCropOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md bg-[#16161C] hover:bg-[#20202A] border border-[#282834] text-[11px] font-medium text-zinc-200 cursor-pointer"
          >
            <Crop className="w-3.5 h-3.5 text-[#60A5FA]" />
            Crop & Auto-Fit Slide Image
          </button>
          {activeStudioImageSrc && (
            <button
              type="button"
              onClick={() => {
                updateSlide(activeIndex, {
                  imageSrc: activeStudioImageSrc,
                  activeSampleId: null,
                });
                onNotify(`Synced Studio screenshot onto Slide ${activeIndex + 1}`);
              }}
              className="w-full py-1.5 px-3 rounded-md bg-[#2563EB]/15 hover:bg-[#2563EB]/25 border border-[#3B82F6]/40 text-[11px] font-medium text-blue-200 cursor-pointer"
            >
              Use Active Studio Screenshot
            </button>
          )}
        </div>

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
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-zinc-400">Slide Frame</span>
            <button
              type="button"
              onClick={() => {
                setSlides((prev) => prev.map((s) => ({ ...s, frame: activeSlide.frame })));
                onNotify(`Applied ${activeSlide.frame} frame to all slides`);
              }}
              className="text-[10px] text-[#60A5FA] hover:text-white cursor-pointer"
            >
              Apply to All
            </button>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(["macos-dark", "browser", "iphone", "glass", "none"] as FrameType[]).map((fr) => (
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
                {fr === "macos-dark" ? "macOS" : fr === "none" ? "Clean" : fr === "iphone" ? "iPhone" : fr}
              </button>
            ))}
          </div>
          {(isPhoneDeck || activeSlide.frame === "iphone") && (
            <button
              type="button"
              onClick={() =>
                updateSlide(activeIndex, {
                  frame: activeSlide.frame === "iphone" ? "none" : "iphone",
                })
              }
              className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md border text-[11px] font-medium cursor-pointer transition-colors ${
                activeSlide.frame !== "iphone"
                  ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                  : "bg-[#16161C] hover:bg-[#20202A] border-[#282834] text-zinc-200"
              }`}
            >
              {activeSlide.frame === "iphone" ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Remove Phone on This Slide
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Show Phone on This Slide
                </>
              )}
            </button>
          )}
        </div>

        {activeSlide.frame === "iphone" && (
          <div className="space-y-2 pt-1 border-t border-[#1E1E24]">
            <div className="flex items-center justify-between text-[11px] text-zinc-300">
              <span className="font-semibold">Desktop SS in Phone</span>
              <button
                type="button"
                onClick={() => {
                  const fit = activeSlide.phoneFit ?? "showcase";
                  setSlides((prev) =>
                    prev.map((s) => ({ ...s, phoneFit: fit, phonePanX: activeSlide.phonePanX ?? 50 }))
                  );
                  onNotify("Applied phone screen fit to all slides");
                }}
                className="text-[10px] text-[#60A5FA] hover:text-white cursor-pointer"
              >
                Apply to All
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  { id: "showcase", label: "Pop-Out" },
                  { id: "pan", label: "Fill & Pan" },
                  { id: "fit", label: "Ambient Fit" },
                ] as { id: PhoneFitMode; label: string }[]
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => updateSlide(activeIndex, { phoneFit: opt.id })}
                  className={`py-1.5 px-1 rounded text-[10px] font-medium border cursor-pointer whitespace-nowrap ${
                    (activeSlide.phoneFit ?? "showcase") === opt.id
                      ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {(activeSlide.phoneFit ?? "showcase") === "pan" && (
              <div>
                <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                  <span>Horizontal Focus Pan</span>
                  <span className="font-mono-tabular text-zinc-300">
                    {activeSlide.phonePanX ?? 50}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={activeSlide.phonePanX ?? 50}
                  onChange={(e) => updateSlide(activeIndex, { phonePanX: Number(e.target.value) })}
                  className="studio-slider"
                />
              </div>
            )}
          </div>
        )}

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
            <span>Screenshot Size (SS)</span>
            <span className="font-mono-tabular text-zinc-200">{activeSlide.scale}%</span>
          </div>
          <input
            type="range"
            min={50}
            max={140}
            value={activeSlide.scale}
            onChange={(e) => updateSlide(activeIndex, { scale: Number(e.target.value) })}
            className="studio-slider"
          />
          <button
            type="button"
            onClick={() => {
              setSlides((prev) => prev.map((s) => ({ ...s, scale: activeSlide.scale })));
              onNotify(`Applied ${activeSlide.scale}% SS size to all slides`);
            }}
            className="mt-1.5 w-full py-1 rounded bg-[#181820] hover:bg-[#22222C] border border-[#282834] text-[10px] font-medium text-zinc-300 cursor-pointer"
          >
            Apply Size ({activeSlide.scale}%) to All Slides
          </button>
        </div>

        <div className="h-px bg-[#1E1E24]" />

        {/* Eye-Catch Callout Pill & Spotlight Highlight */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-zinc-200">Floating Callout Badge</span>
            {activeSlide.badgeText && (
              <button
                type="button"
                onClick={() => updateSlide(activeIndex, { badgeText: "" })}
                className="text-[10px] text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <input
            type="text"
            value={activeSlide.badgeText || ""}
            onChange={(e) => updateSlide(activeIndex, { badgeText: e.target.value })}
            placeholder="e.g. ⚡ +340% ROI"
            className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-zinc-100 placeholder-zinc-500"
          />
          <div className="flex flex-wrap gap-1">
            {["⚡ +340% ROI", "★ 4.9 Rated", "PRO TIP", "LIVE DEMO"].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => updateSlide(activeIndex, { badgeText: chip })}
                className="px-1.5 py-0.5 rounded bg-[#16161C] hover:bg-[#22222C] border border-[#262632] text-[10px] text-zinc-300 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer pt-1">
            <span className="flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-[#60A5FA]" />
              Spotlight Ring Target
            </span>
            <input
              type="checkbox"
              checked={Boolean(activeSlide.spotlightEnabled)}
              onChange={(e) =>
                updateSlide(activeIndex, {
                  spotlightEnabled: e.target.checked,
                  spotlightX: activeSlide.spotlightX ?? 0.58,
                  spotlightY: activeSlide.spotlightY ?? 0.44,
                })
              }
              className="accent-[#2563EB]"
            />
          </label>

          {activeSlide.spotlightEnabled && (
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const sx = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
                const sy = Math.max(0.08, Math.min(0.92, (e.clientY - rect.top) / rect.height));
                updateSlide(activeIndex, { spotlightX: sx, spotlightY: sy });
              }}
              className="relative rounded-md overflow-hidden border border-[#2C2C38] bg-[#07080C] cursor-crosshair aspect-video"
              title="Click where to highlight"
            >
              <img
                src={activeSlide.imageSrc}
                alt="Spotlight target"
                className="w-full h-full object-contain"
              />
              <span
                className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-[#60A5FA] bg-[#2563EB]/35 pointer-events-none"
                style={{
                  left: `${(activeSlide.spotlightX ?? 0.58) * 100}%`,
                  top: `${(activeSlide.spotlightY ?? 0.44) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      </aside>

      <ImageCropModal
        open={cropOpen}
        imageSrc={activeSlide.imageSrc}
        title={`Crop & Auto-Fit Slide ${activeIndex + 1}`}
        targetFrameAspect={activeSlide.frame === "iphone" ? 9 / 16 : 16 / 10}
        targetFrameLabel={activeSlide.frame === "iphone" ? "iPhone" : "Frame"}
        onApplyCrop={(croppedUrl, croppedRatio) => {
          updateSlide(activeIndex, {
            imageSrc: croppedUrl,
            activeSampleId: null,
            scale: Math.min(96, Math.max(88, activeSlide.scale)),
            ...(activeSlide.frame === "iphone"
              ? { phoneFit: croppedRatio <= 1.08 ? "pan" : "fit", phonePanX: 50 }
              : {}),
          });
          onNotify(`Cropped Slide ${activeIndex + 1} & auto-fitted into frame`);
        }}
        onClose={() => setCropOpen(false)}
      />
    </div>
  );
};
