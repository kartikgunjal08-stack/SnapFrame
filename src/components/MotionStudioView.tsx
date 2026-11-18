import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Video,
  Film,
  Search,
  Upload,
  Palette,
  Repeat,
  Square,
  Smartphone,
  Eye,
  EyeOff,
  Shuffle,
  Crosshair,
  Sparkles,
  Maximize2,
  Minimize2,
  Lock,
  Crop,
  ChevronDown,
} from "lucide-react";
import { ImageCropModal } from "./ImageCropModal";
import { MOTION_CATEGORIES, MOTION_PRESETS } from "../data/motionPresets";
import {
  BrandKit,
  MotionAspectId,
  MotionCategory,
  MotionDuration,
  MotionEasing,
  MotionPreset,
  PhoneFitMode,
} from "../types/studio";
import { encodeGifFrames } from "../utils/gifEncoder";
import { MOTION_ASPECT_DIMENSIONS, renderMotionFrame } from "../utils/motionRenderer";

interface MotionStudioViewProps {
  imageSrc: string;
  imageName: string;
  brandKit: BrandKit;
  onUploadFile: (file: File) => void;
  onOpenBrandKit: () => void;
  onNotify: (msg: string, type?: "info" | "error") => void;
  onApplyCroppedImage?: (croppedUrl: string, croppedRatio: number) => void;
  isPreviewLocked?: boolean;
  onRequireAuthForUpload?: () => void;
}

const EASING_OPTIONS: { id: MotionEasing; label: string }[] = [
  { id: "easeOut", label: "Ease Out" },
  { id: "spring", label: "Spring" },
  { id: "easeInOut", label: "Smooth" },
  { id: "expoOut", label: "Snap Expo" },
  { id: "linear", label: "Linear" },
];

export const MotionStudioView: React.FC<MotionStudioViewProps> = ({
  imageSrc,
  imageName,
  brandKit,
  onUploadFile,
  onOpenBrandKit,
  onNotify,
  onApplyCroppedImage,
  isPreviewLocked = false,
  onRequireAuthForUpload,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const loadedLogoRef = useRef<HTMLImageElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<"All" | MotionCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState<MotionPreset>(MOTION_PRESETS[0]);
  const [aspectId, setAspectId] = useState<MotionAspectId>("16:9");
  const [phoneFormatMode, setPhoneFormatMode] = useState(false);
  const [hidePhoneShell, setHidePhoneShell] = useState(false);
  const [phoneFitMode, setPhoneFitMode] = useState<PhoneFitMode>("showcase");
  const [mockupScale, setMockupScale] = useState(100);
  const [duration, setDuration] = useState<MotionDuration>(MOTION_PRESETS[0].defaultDuration);
  const [easing, setEasing] = useState<MotionEasing>(MOTION_PRESETS[0].defaultEasing);
  const [loop, setLoop] = useState(true);
  const [showHeadline, setShowHeadline] = useState(true);
  const [showFrameHeader, setShowFrameHeader] = useState(true);
  const [eyebrow, setEyebrow] = useState(MOTION_PRESETS[0].eyebrowDefault);
  const [headline, setHeadline] = useState(MOTION_PRESETS[0].headlineDefault);
  const [useBrandKit, setUseBrandKit] = useState(true);
  const [cursorSpotlight, setCursorSpotlight] = useState(true);
  const [zoomLoupe, setZoomLoupe] = useState(false);
  const [focusX, setFocusX] = useState(0.58);
  const [focusY, setFocusY] = useState(0.42);
  const [floatingBadge, setFloatingBadge] = useState("⚡ +340% Faster");
  const [ambientAura, setAmbientAura] = useState(true);
  const [floorReflection, setFloorReflection] = useState(true);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [motionTab, setMotionTab] = useState<"basic" | "effects">("basic");
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);
  const currentTimeRef = useRef(0);
  const startClockRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const [exportState, setExportState] = useState<{
    active: boolean;
    kind: "webm" | "mp4" | "gif" | null;
    pct: number;
  }>({ active: false, kind: null, pct: 0 });
  const cancelExportRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  // Load current screenshot image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImgRef.current = img;
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Load Brand Kit logo if provided
  useEffect(() => {
    if (!brandKit.logoDataUrl) {
      loadedLogoRef.current = null;
      return;
    }
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.onload = () => {
      loadedLogoRef.current = logo;
    };
    logo.src = brandKit.logoDataUrl;
  }, [brandKit.logoDataUrl]);

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return MOTION_PRESETS.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      if (!q) return true;
      return `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q);
    });
  }, [selectedCategory, searchQuery]);

  const dims = MOTION_ASPECT_DIMENSIONS[aspectId];

  const isPhoneContext = phoneFormatMode || activePreset.frameStyle === "iphone";

  const effectivePreset: MotionPreset = useMemo(
    () => ({
      ...activePreset,
      frameStyle:
        hidePhoneShell && isPhoneContext
          ? "frameless"
          : phoneFormatMode
            ? "iphone"
            : activePreset.frameStyle,
    }),
    [activePreset, hidePhoneShell, isPhoneContext, phoneFormatMode]
  );

  const drawAtTime = useCallback(
    (tSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const progress = duration > 0 ? Math.min(1, Math.max(0, tSec / duration)) : 0;
      renderMotionFrame({
        ctx,
        width: dims.width,
        height: dims.height,
        progress,
        preset: effectivePreset,
        easing,
        img: loadedImgRef.current,
        logoImg: loadedLogoRef.current,
        eyebrow,
        headline,
        showHeadline,
        brandKit,
        useBrandKit,
        mockupScale,
        showFrameHeader,
        cursorSpotlight,
        zoomLoupe,
        focusX,
        focusY,
        floatingBadge,
        floorReflection,
        ambientAura,
        phoneFitMode,
      });
    },
    [
      ambientAura,
      brandKit,
      cursorSpotlight,
      dims.height,
      dims.width,
      duration,
      easing,
      effectivePreset,
      eyebrow,
      floatingBadge,
      floorReflection,
      focusX,
      focusY,
      headline,
      mockupScale,
      phoneFitMode,
      showFrameHeader,
      showHeadline,
      useBrandKit,
      zoomLoupe,
    ]
  );

  useEffect(() => {
    currentTimeRef.current = currentTime;
    drawAtTime(currentTime);
  }, [currentTime, drawAtTime]);

  useEffect(() => {
    if (!isPlaying || exportState.active) return;
    startClockRef.current = performance.now() - currentTimeRef.current * 1000;

    const tick = (now: number) => {
      const elapsed = (now - startClockRef.current) / 1000;
      if (elapsed >= duration) {
        if (loop) {
          startClockRef.current = now;
          currentTimeRef.current = 0;
          setCurrentTime(0);
        } else {
          currentTimeRef.current = duration;
          setCurrentTime(duration);
          setIsPlaying(false);
          return;
        }
      } else {
        currentTimeRef.current = elapsed;
        setCurrentTime(elapsed);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [duration, exportState.active, isPlaying, loop]);

  const selectPreset = (preset: MotionPreset) => {
    setActivePreset(preset);
    setDuration(preset.defaultDuration);
    setEasing(preset.defaultEasing);
    setEyebrow(preset.eyebrowDefault);
    setHeadline(preset.headlineDefault);
    if (preset.defaultAspect) {
      setAspectId(preset.defaultAspect);
      if (preset.defaultAspect === "9:16" && preset.frameStyle === "iphone") {
        setPhoneFormatMode(true);
      }
    } else if (phoneFormatMode) {
      setAspectId("9:16");
    }
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const togglePhoneFormat = () => {
    setPhoneFormatMode((prev) => {
      const next = !prev;
      setAspectId(next ? "9:16" : activePreset.defaultAspect || "16:9");
      if (!next) setHidePhoneShell(false);
      return next;
    });
  };

  const togglePhoneShell = () => {
    setHidePhoneShell((prev) => {
      const next = !prev;
      onNotify(
        next
          ? "Removed Phone frame — showcasing screenshot independently"
          : "Restored iPhone frame"
      );
      return next;
    });
  };

  const handleRemixMotion = () => {
    const pool = filteredPresets.length > 1 ? filteredPresets : MOTION_PRESETS;
    const candidates = pool.filter((p) => p.id !== activePreset.id);
    const pick = candidates[Math.floor(Math.random() * candidates.length)] || MOTION_PRESETS[0];
    selectPreset(pick);
    onNotify(`Remixed motion to "${pick.name}"`);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (isPreviewLocked && onRequireAuthForUpload) {
        onRequireAuthForUpload();
        return;
      }
      onUploadFile(file);
    }
  };

  const handleVideoExport = async (kind: "webm" | "mp4") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      onNotify("MediaRecorder is not supported in this browser. Try GIF export instead.", "error");
      return;
    }

    const candidates =
      kind === "mp4"
        ? ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9", "video/webm"]
        : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];

    const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
      onNotify("No supported video encoder found in this browser.", "error");
      return;
    }

    const actualExt = mimeType.includes("mp4") ? "mp4" : "webm";
    if (kind === "mp4" && actualExt !== "mp4") {
      onNotify("Native MP4 muxing unavailable in this browser — exporting crisp WebM instead.");
    }

    cancelExportRef.current = false;
    setIsPlaying(false);
    setExportState({ active: true, kind, pct: 0 });
    currentTimeRef.current = 0;
    setCurrentTime(0);

    const stream = canvas.captureStream(30);
    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 6_000_000,
    });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      setExportState({ active: false, kind: null, pct: 0 });
      if (cancelExportRef.current || chunks.length === 0) return;

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activePreset.id}-${duration}s.${actualExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify(`Exported ${actualExt.toUpperCase()} (${dims.width}×${dims.height})`);
      setIsPlaying(true);
    };

    recorder.start(200);
    const startMs = performance.now();

    const step = (now: number) => {
      if (cancelExportRef.current) {
        recorder.stop();
        return;
      }
      const elapsed = (now - startMs) / 1000;
      const clamped = Math.min(duration, elapsed);
      currentTimeRef.current = clamped;
      setCurrentTime(clamped);
      drawAtTime(clamped);
      setExportState({
        active: true,
        kind,
        pct: Math.min(100, Math.round((clamped / duration) * 100)),
      });

      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        recorder.stop();
      }
    };
    requestAnimationFrame(step);
  };

  const handleGifExport = async () => {
    cancelExportRef.current = false;
    setIsPlaying(false);
    setExportState({ active: true, kind: "gif", pct: 0 });

    const scaleDown = Math.min(1, 640 / dims.width);
    const gw = Math.round(dims.width * scaleDown);
    const gh = Math.round(dims.height * scaleDown);
    const offCanvas = document.createElement("canvas");
    offCanvas.width = gw;
    offCanvas.height = gh;
    const offCtx = offCanvas.getContext("2d", { willReadFrequently: true });
    if (!offCtx) {
      setExportState({ active: false, kind: null, pct: 0 });
      return;
    }

    const fps = 15;
    const totalFrames = Math.max(12, Math.round(duration * fps));
    const frameDelayMs = Math.round(1000 / fps);
    const frames: ImageData[] = [];

    for (let i = 0; i < totalFrames; i++) {
      if (cancelExportRef.current) {
        setExportState({ active: false, kind: null, pct: 0 });
        return;
      }
      const progress = i / Math.max(1, totalFrames - 1);
      renderMotionFrame({
        ctx: offCtx,
        width: gw,
        height: gh,
        progress,
        preset: effectivePreset,
        easing,
        img: loadedImgRef.current,
        logoImg: loadedLogoRef.current,
        eyebrow,
        headline,
        showHeadline,
        brandKit,
        useBrandKit,
        mockupScale,
        showFrameHeader,
        cursorSpotlight,
        zoomLoupe,
        focusX,
        focusY,
        floatingBadge,
        floorReflection,
        ambientAura,
        phoneFitMode,
      });
      frames.push(offCtx.getImageData(0, 0, gw, gh));
      setExportState({
        active: true,
        kind: "gif",
        pct: Math.round(((i + 1) / totalFrames) * 90),
      });
      // Yield frame to keep UI responsive
      if (i % 6 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    const gifBlob = encodeGifFrames(frames, gw, gh, frameDelayMs, loop);
    const url = URL.createObjectURL(gifBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activePreset.id}-${duration}s.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportState({ active: false, kind: null, pct: 0 });
    onNotify(`Exported looping GIF (${gw}×${gh}, ${totalFrames} frames)`);
    setIsPlaying(true);
  };

  const cancelExport = () => {
    cancelExportRef.current = true;
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setExportState({ active: false, kind: null, pct: 0 });
    setIsPlaying(true);
  };

  return (
    <div
      className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#0A0A0C]"
      onDrop={handleDropFile}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Left Rail: Motion Templates Browser (shows below canvas on phones) */}
      <aside className="order-2 lg:order-1 w-full lg:w-[300px] shrink-0 max-h-[260px] sm:max-h-[300px] lg:max-h-none border-t lg:border-t-0 lg:border-r border-[#1E1E24] bg-[#101014] flex flex-col min-h-0">
        <div className="p-4 border-b border-[#1E1E24] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white tracking-wide">
              Motion Templates ({MOTION_PRESETS.length})
            </h2>
            <span className="text-[11px] font-mono-tabular text-zinc-400">60fps</span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flips, Ken Burns, parallax..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 studio-scroll">
            {MOTION_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 border transition-colors cursor-pointer ${
                    active
                      ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                      : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {cat === "All" ? "All" : cat.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto studio-scroll p-3 space-y-1.5">
          {filteredPresets.map((preset) => {
            const isSelected = activePreset.id === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={exportState.active}
                onClick={() => selectPreset(preset)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                  isSelected
                    ? "bg-[#2563EB]/12 border-[#3B82F6]/60"
                    : "bg-[#131318] border-[#1F1F27] hover:border-[#32323E]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center -space-x-1 shrink-0">
                      {preset.backdropColors.slice(0, 3).map((hex, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full border border-black/60"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                    <span className="text-xs font-semibold text-zinc-100 truncate">
                      {preset.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-tabular text-zinc-400 shrink-0">
                    {preset.defaultDuration}s
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                  {preset.category} · {preset.frameStyle}
                </div>
              </button>
            );
          })}
          {filteredPresets.length === 0 && (
            <div className="py-10 text-center text-xs text-zinc-500">
              No motion templates match "{searchQuery}".
            </div>
          )}
        </div>
      </aside>

      {/* Center Stage: Live 60fps Canvas Player + Timeline (first on phones) */}
      <section
        className={
          isFullscreen
            ? "fixed inset-0 z-50 flex flex-col bg-[#060608] overflow-hidden"
            : "order-1 lg:order-2 flex-1 flex flex-col min-w-0 studio-canvas-grid lg:overflow-hidden"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#1E1E24] bg-[#0D0D10]/95">
          <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
            <span className="font-semibold text-zinc-200 truncate">{activePreset.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-zinc-400 whitespace-nowrap">
              {dims.width}×{dims.height}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate hidden sm:inline">
              {isFullscreen ? "Full Screen Preview (Esc to exit)" : `${imageName} (Ctrl+V supported)`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap relative">
            <button
              type="button"
              disabled={exportState.active}
              onClick={togglePhoneFormat}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                phoneFormatMode
                  ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                  : "bg-[#18181F] hover:bg-[#22222C] border-[#282834] text-zinc-200"
              }`}
              title="Convert selected Motion template into vertical 9:16 format"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
              Phone
            </button>
            {isPhoneContext && (
              <button
                type="button"
                disabled={exportState.active}
                onClick={togglePhoneShell}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium cursor-pointer whitespace-nowrap transition-colors ${
                  hidePhoneShell
                    ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                    : "bg-[#18181F] hover:bg-[#22222C] border-[#282834] text-zinc-200"
                }`}
                title={
                  hidePhoneShell
                    ? "Show iPhone device frame around screenshot"
                    : "Remove phone body and showcase screenshot independently"
                }
              >
                {hidePhoneShell ? (
                  <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-[#60A5FA]" />
                )}
                {hidePhoneShell ? "Show Phone" : "Remove Phone"}
              </button>
            )}
            {!isFullscreen && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadFile(file);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (isPreviewLocked && onRequireAuthForUpload) {
                      onRequireAuthForUpload();
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                >
                  {isPreviewLocked ? (
                    <Lock className="w-3.5 h-3.5" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {isPreviewLocked ? "Sign In" : "Replace SS"}
                </button>
                <button
                  type="button"
                  onClick={() => setCropOpen(true)}
                  title="Crop screenshot so it automatically fits inside the Motion frame"
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
                        disabled={exportState.active}
                        onClick={() => {
                          handleRemixMotion();
                          setMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 hover:bg-[#20202C] cursor-pointer"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-[#60A5FA]" />
                        Remix Motion
                      </button>
                      <button
                        type="button"
                        disabled={exportState.active}
                        onClick={() => {
                          setShowHeadline((v) => !v);
                          setMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 hover:bg-[#20202C] cursor-pointer"
                      >
                        {showHeadline ? (
                          <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        {showHeadline ? "Hide Headline" : "Show Headline"}
                      </button>
                      <button
                        type="button"
                        disabled={exportState.active}
                        onClick={() => {
                          setShowFrameHeader((v) => !v);
                          setMoreMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-200 hover:bg-[#20202C] cursor-pointer"
                      >
                        {showFrameHeader ? (
                          <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        {showFrameHeader ? "Hide Brand Bar" : "Show Brand Bar"}
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
              </>
            )}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? "Exit Full Screen (Esc)" : "Watch Motion Full Screen"}
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

        {/* Canvas Preview */}
        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 overflow-auto studio-scroll">
          <canvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            className={`max-w-full w-auto h-auto rounded-lg border border-white/10 shadow-2xl bg-[#07080C] ${
              isFullscreen ? "max-h-[78vh] sm:max-h-[82vh]" : "max-h-[46vh] sm:max-h-[520px]"
            }`}
          />
        </div>

        {/* Timeline Transport Bar */}
        <div className="px-3 sm:px-5 py-2.5 sm:py-3 border-t border-[#1E1E24] bg-[#0D0D11] flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            disabled={exportState.active}
            onClick={() => {
              if (!isPlaying && currentTime >= duration) {
                currentTimeRef.current = 0;
                setCurrentTime(0);
              }
              setIsPlaying((p) => !p);
            }}
            className="p-2 rounded-md bg-[#18181F] hover:bg-[#24242E] border border-[#282834] text-white cursor-pointer disabled:opacity-50"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            disabled={exportState.active}
            onClick={() => {
              currentTimeRef.current = 0;
              setCurrentTime(0);
              setIsPlaying(true);
            }}
            className="p-2 rounded-md bg-[#18181F] hover:bg-[#24242E] border border-[#282834] text-zinc-300 hover:text-white cursor-pointer disabled:opacity-50"
            title="Restart"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            disabled={exportState.active}
            onClick={() => setLoop((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer whitespace-nowrap ${
              loop
                ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                : "bg-[#18181F] border-[#282834] text-zinc-400"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            Loop
          </button>

          <input
            type="range"
            min={0}
            max={duration}
            step={0.02}
            disabled={exportState.active}
            value={currentTime}
            onChange={(e) => {
              const v = Number(e.target.value);
              setIsPlaying(false);
              currentTimeRef.current = v;
              setCurrentTime(v);
            }}
            className="studio-slider flex-1 min-w-[100px] sm:min-w-[140px]"
          />

          <span className="text-xs font-mono-tabular text-zinc-300 w-24 text-right shrink-0">
            {currentTime.toFixed(2)}s / {duration}.0s
          </span>
        </div>
      </section>

      {/* Right Rail: Clean 2-Tab Motion Controls & Export */}
      <aside className="order-3 w-full lg:w-[276px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] flex flex-col justify-between min-h-0">
        <div className="p-3 border-b border-[#1E1E24] bg-[#0D0D11]">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-[#16161C] border border-[#24242E]">
            <button
              type="button"
              onClick={() => setMotionTab("basic")}
              className={`py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                motionTab === "basic"
                  ? "bg-[#2563EB] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Basic Setup
            </button>
            <button
              type="button"
              onClick={() => setMotionTab("effects")}
              className={`py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                motionTab === "effects"
                  ? "bg-[#2563EB] text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Effects & Polish
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-5">
          {motionTab === "basic" ? (
            <>
              <div>
                <h3 className="text-xs font-semibold text-zinc-200 mb-2">Duration</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {([3, 5, 8] as MotionDuration[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={exportState.active}
                      onClick={() => {
                        setDuration(d);
                        currentTimeRef.current = 0;
                        setCurrentTime(0);
                      }}
                      className={`py-1.5 rounded-md text-xs font-mono-tabular font-medium border cursor-pointer ${
                        duration === d
                          ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-200 mb-1.5">
                  <span>Screenshot Size</span>
                  <span className="font-mono-tabular text-[11px] text-[#60A5FA]">{mockupScale}%</span>
                </div>
                <input
                  type="range"
                  min={55}
                  max={145}
                  disabled={exportState.active}
                  value={mockupScale}
                  onChange={(e) => setMockupScale(Number(e.target.value))}
                  className="studio-slider"
                />
              </div>

              {isPhoneContext && (
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={exportState.active}
                    onClick={togglePhoneShell}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md border text-[11px] font-medium cursor-pointer transition-colors ${
                      hidePhoneShell
                        ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                        : "bg-[#16161C] hover:bg-[#20202A] border-[#282834] text-zinc-200"
                    }`}
                  >
                    {hidePhoneShell ? (
                      <>
                        <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
                        Show iPhone Frame
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-[#60A5FA]" />
                        Remove Phone (SS Only)
                      </>
                    )}
                  </button>

                  {!hidePhoneShell && effectivePreset.frameStyle === "iphone" && (
                    <>
                      <div className="flex items-center justify-between text-[11px] text-zinc-300">
                        <span className="font-semibold">Desktop SS in Phone</span>
                        <span className="text-[10px] text-zinc-500">Fit</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {(
                          [
                            { id: "showcase", label: "Pop-Out" },
                            { id: "fit", label: "Full Card" },
                            { id: "pan", label: "Fill & Pan" },
                          ] as { id: PhoneFitMode; label: string }[]
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={exportState.active}
                            onClick={() => setPhoneFitMode(opt.id)}
                            className={`py-1.5 px-1 rounded-md text-[10.5px] font-medium border cursor-pointer whitespace-nowrap transition-colors ${
                              phoneFitMode === opt.id
                                ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                                : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-zinc-200 mb-2">Aspect Ratio</h3>
                <div className="grid grid-cols-3 gap-1.5">
                  {(Object.keys(MOTION_ASPECT_DIMENSIONS) as MotionAspectId[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      disabled={exportState.active}
                      onClick={() => setAspectId(id)}
                      className={`py-1.5 rounded-md text-[11px] font-mono-tabular font-medium border cursor-pointer ${
                        aspectId === id
                          ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#1E1E24]" />

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Headline Text</span>
                  <input
                    type="checkbox"
                    checked={showHeadline}
                    onChange={(e) => setShowHeadline(e.target.checked)}
                    className="accent-[#2563EB] cursor-pointer"
                  />
                </div>

                {showHeadline && (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={eyebrow}
                      onChange={(e) => setEyebrow(e.target.value)}
                      placeholder="Eyebrow"
                      className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-zinc-100 focus:outline-none focus:border-[#3B82F6]"
                    />
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="Headline"
                      className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-zinc-100 focus:outline-none focus:border-[#3B82F6]"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-xs font-semibold text-zinc-200 mb-2">Motion Style</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {EASING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={exportState.active}
                      onClick={() => setEasing(opt.id)}
                      className={`py-1.5 px-2 rounded-md text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
                        easing === opt.id
                          ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-[#1E1E24]" />

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Apply Brand Colors</span>
                  <input
                    type="checkbox"
                    checked={useBrandKit}
                    onChange={(e) => setUseBrandKit(e.target.checked)}
                    className="accent-[#2563EB] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Show Brand / URL Bar</span>
                  <input
                    type="checkbox"
                    checked={showFrameHeader}
                    onChange={(e) => setShowFrameHeader(e.target.checked)}
                    className="accent-[#2563EB] cursor-pointer"
                  />
                </div>
              </div>

              <div className="h-px bg-[#1E1E24]" />

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Visual Effects
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !(cursorSpotlight || zoomLoupe || Boolean(floatingBadge));
                      setCursorSpotlight(next);
                      setZoomLoupe(next);
                      setAmbientAura(next);
                      setFloorReflection(next);
                      setFloatingBadge(next ? "⚡ +340% Faster" : "");
                    }}
                    className="text-[10px] text-[#60A5FA] hover:text-white cursor-pointer"
                  >
                    {cursorSpotlight || zoomLoupe ? "Clean Mode" : "All Effects"}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">Animated Cursor Click</span>
                  <input
                    type="checkbox"
                    checked={cursorSpotlight}
                    onChange={(e) => setCursorSpotlight(e.target.checked)}
                    className="accent-[#2563EB] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">1.85× Magnifier Loupe</span>
                  <input
                    type="checkbox"
                    checked={zoomLoupe}
                    onChange={(e) => setZoomLoupe(e.target.checked)}
                    className="accent-[#2563EB] cursor-pointer"
                  />
                </div>

                {(cursorSpotlight || zoomLoupe) && (
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3 text-[#60A5FA]" />
                        Click focus point
                      </span>
                      <span className="font-mono-tabular">
                        {Math.round(focusX * 100)}%, {Math.round(focusY * 100)}%
                      </span>
                    </div>
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setFocusX(Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width)));
                        setFocusY(Math.max(0.08, Math.min(0.92, (e.clientY - rect.top) / rect.height)));
                      }}
                      className="relative rounded-md overflow-hidden border border-[#2C2C38] bg-[#07080C] cursor-crosshair aspect-video"
                    >
                      <img src={imageSrc} alt="Focus target" className="w-full h-full object-contain" />
                      <span
                        className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full border-2 border-[#60A5FA] bg-[#2563EB]/35 shadow-lg pointer-events-none"
                        style={{ left: `${focusX * 100}%`, top: `${focusY * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-300">
                    <span>Floating Stat Pill</span>
                    {floatingBadge && (
                      <button
                        type="button"
                        onClick={() => setFloatingBadge("")}
                        className="text-[10px] text-zinc-500 hover:text-zinc-200 cursor-pointer"
                      >
                        Hide
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={floatingBadge}
                    onChange={(e) => setFloatingBadge(e.target.value)}
                    placeholder="Optional stat pill"
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#3B82F6]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">Ambient Aura Glow</span>
                  <input
                    type="checkbox"
                    checked={ambientAura}
                    onChange={(e) => setAmbientAura(e.target.checked)}
                    className="accent-[#2563EB] cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">Stage Floor Reflection</span>
                  <input
                    type="checkbox"
                    checked={floorReflection}
                    onChange={(e) => setFloorReflection(e.target.checked)}
                    className="accent-[#2563EB] cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Browser Export Actions (bottom safe clearance for host preview badges) */}
        <div className="p-4 pb-20 border-t border-[#1E1E24] bg-[#0D0D11] space-y-2">
          {exportState.active ? (
            <button
              type="button"
              onClick={cancelExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              Rendering {exportState.kind?.toUpperCase()} ({exportState.pct}%) · Stop
            </button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleVideoExport("webm")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                >
                  <Video className="w-3.5 h-3.5" />
                  WebM
                </button>
                <button
                  type="button"
                  onClick={() => handleVideoExport("mp4")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#181820] hover:bg-[#22222D] border border-[#2A2A35] text-xs font-semibold text-zinc-100 cursor-pointer whitespace-nowrap"
                >
                  <Video className="w-3.5 h-3.5 text-[#60A5FA]" />
                  MP4
                </button>
              </div>
              <button
                type="button"
                onClick={handleGifExport}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#F4F4F6] hover:bg-white text-xs font-semibold text-[#0A0A0C] cursor-pointer whitespace-nowrap"
              >
                <Film className="w-3.5 h-3.5" />
                Export Animated GIF
              </button>
            </>
          )}
        </div>
      </aside>

      <ImageCropModal
        open={cropOpen}
        imageSrc={imageSrc}
        title="Crop & Auto-Fit Motion Screenshot"
        targetFrameAspect={effectivePreset.frameStyle === "iphone" ? 0.495 : 16 / 10}
        targetFrameLabel={effectivePreset.frameStyle === "iphone" ? "iPhone" : "Frame"}
        onApplyCrop={(croppedUrl, croppedRatio) => {
          onApplyCroppedImage?.(croppedUrl, croppedRatio);
          setMockupScale(100);
          if (phoneFormatMode || effectivePreset.frameStyle === "iphone") {
            setPhoneFitMode(croppedRatio <= 1.08 ? "pan" : "fit");
          }
          onNotify("Cropped & auto-fitted screenshot into Motion frame");
        }}
        onClose={() => setCropOpen(false)}
      />
    </div>
  );
};
