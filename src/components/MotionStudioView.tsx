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
} from "lucide-react";
import { MOTION_CATEGORIES, MOTION_PRESETS } from "../data/motionPresets";
import {
  BrandKit,
  MotionAspectId,
  MotionCategory,
  MotionDuration,
  MotionEasing,
  MotionPreset,
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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);
  const loadedLogoRef = useRef<HTMLImageElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<"All" | MotionCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePreset, setActivePreset] = useState<MotionPreset>(MOTION_PRESETS[0]);
  const [aspectId, setAspectId] = useState<MotionAspectId>("16:9");
  const [duration, setDuration] = useState<MotionDuration>(MOTION_PRESETS[0].defaultDuration);
  const [easing, setEasing] = useState<MotionEasing>(MOTION_PRESETS[0].defaultEasing);
  const [loop, setLoop] = useState(true);
  const [showHeadline, setShowHeadline] = useState(true);
  const [eyebrow, setEyebrow] = useState(MOTION_PRESETS[0].eyebrowDefault);
  const [headline, setHeadline] = useState(MOTION_PRESETS[0].headlineDefault);
  const [useBrandKit, setUseBrandKit] = useState(true);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
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
        preset: activePreset,
        easing,
        img: loadedImgRef.current,
        logoImg: loadedLogoRef.current,
        eyebrow,
        headline,
        showHeadline,
        brandKit,
        useBrandKit,
      });
    },
    [
      activePreset,
      brandKit,
      dims.height,
      dims.width,
      duration,
      easing,
      eyebrow,
      headline,
      showHeadline,
      useBrandKit,
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
    currentTimeRef.current = 0;
    setCurrentTime(0);
    setIsPlaying(true);
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
        preset: activePreset,
        easing,
        img: loadedImgRef.current,
        logoImg: loadedLogoRef.current,
        eyebrow,
        headline,
        showHeadline,
        brandKit,
        useBrandKit,
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
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#0A0A0C]">
      {/* Left Rail: 108 Motion Templates Browser */}
      <aside className="w-full lg:w-[300px] shrink-0 border-b lg:border-b-0 lg:border-r border-[#1E1E24] bg-[#101014] flex flex-col min-h-0">
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
                  <span className="text-xs font-semibold text-zinc-100 truncate">
                    {preset.name}
                  </span>
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

      {/* Center Stage: Live 60fps Canvas Player + Timeline */}
      <section className="flex-1 flex flex-col min-w-0 studio-canvas-grid overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#1E1E24] bg-[#0D0D10]/90">
          <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
            <span className="font-semibold text-zinc-200 truncate">{activePreset.name}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular text-zinc-400 whitespace-nowrap">
              {dims.width}×{dims.height}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate hidden sm:inline">{imageName} (Ctrl+V supported)</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-[#60A5FA]" />
              Replace Screenshot
            </button>
            <button
              type="button"
              onClick={onOpenBrandKit}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
            >
              <Palette className="w-3.5 h-3.5" style={{ color: brandKit.primaryColor }} />
              Brand Kit
            </button>
          </div>
        </div>

        {/* Canvas Preview */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto studio-scroll">
          <canvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            className="max-w-full max-h-[520px] w-auto h-auto rounded-lg border border-white/10 shadow-2xl bg-[#07080C]"
          />
        </div>

        {/* Timeline Transport Bar */}
        <div className="px-5 py-3 border-t border-[#1E1E24] bg-[#0D0D11] flex flex-wrap items-center gap-3">
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
            className="studio-slider flex-1 min-w-[140px]"
          />

          <span className="text-xs font-mono-tabular text-zinc-300 w-24 text-right shrink-0">
            {currentTime.toFixed(2)}s / {duration}.0s
          </span>
        </div>
      </section>

      {/* Right Rail: Motion Controls & Export */}
      <aside className="w-full lg:w-[276px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] flex flex-col justify-between overflow-y-auto studio-scroll">
        <div className="p-4 space-y-5">
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

          <div>
            <h3 className="text-xs font-semibold text-zinc-200 mb-2">Easing Curve</h3>
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
              <span className="text-xs font-semibold text-zinc-200">Apply Brand Kit DNA</span>
              <input
                type="checkbox"
                checked={useBrandKit}
                onChange={(e) => setUseBrandKit(e.target.checked)}
                className="accent-[#2563EB] cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200">Headline Overlay</span>
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
        </div>

        {/* Browser Export Actions */}
        <div className="p-4 border-t border-[#1E1E24] bg-[#0D0D11] space-y-2">
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
    </div>
  );
};
