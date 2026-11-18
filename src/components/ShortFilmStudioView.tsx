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
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Square,
  Sparkles,
  Aperture,
  BookmarkPlus,
  Crosshair,
  Smartphone,
  Eye,
  EyeOff,
  Shuffle,
  Copy,
  Maximize2,
  Minimize2,
  Lock,
  Crop,
} from "lucide-react";
import { ImageCropModal } from "./ImageCropModal";
import { SAMPLE_MOCKUPS } from "../data/presets";
import { SHORT_FILM_CATEGORIES, SHORT_FILM_PRESETS } from "../data/shortFilmPresets";
import {
  BrandDealScript,
  BrandKit,
  FilmLookConfig,
  MotionAspectId,
  PhoneFitMode,
  SavedBrandDealProfile,
  ShortFilmCategory,
  ShortFilmDuration,
  ShortFilmPreset,
  ShortFilmShot,
} from "../types/studio";
import { encodeGifFrames } from "../utils/gifEncoder";
import {
  buildFilmLookCssFilter,
  DEFAULT_FILM_LOOK,
  FILM_ASPECTS,
  FILM_LOOK_PRESETS,
  renderShortFilmFrame,
  scheduleShortFilmAudioStep,
} from "../utils/shortFilmRenderer";

interface ShortFilmStudioViewProps {
  brandKit: BrandKit;
  shots: ShortFilmShot[];
  onChangeShots: React.Dispatch<React.SetStateAction<ShortFilmShot[]>>;
  onOpenBrandKit: () => void;
  onNotify: (msg: string, type?: "info" | "error") => void;
  isPreviewLocked?: boolean;
  onRequireAuthForUpload?: () => void;
}

type FilmAspect = Exclude<MotionAspectId, "4:5">;
type InspectorTab = "deal" | "look" | "shot";

const PROFILES_STORAGE_KEY = "snapframy_brand_deal_profiles_v1";

const CHAPTER_MARKERS = [
  { label: "1. Hook", pct: 0.02 },
  { label: "2. Reveal", pct: 0.12 },
  { label: "3. Cuts", pct: 0.25 },
  { label: "4. Suite", pct: 0.6 },
  { label: "5. KPIs", pct: 0.76 },
  { label: "6. Offer", pct: 0.89 },
];

export function createDefaultShortFilmShots(): ShortFilmShot[] {
  return [
    {
      id: "shot-1",
      imageSrc: SAMPLE_MOCKUPS.saas.src,
      label: "Analytics",
      caption: "Real-time revenue & cohort intelligence in one view.",
      focusX: 0.62,
      focusY: 0.42,
    },
    {
      id: "shot-2",
      imageSrc: SAMPLE_MOCKUPS.ai.src,
      label: "AI Copilot",
      caption: "Instant answers & automated workflows without manual ops.",
      focusX: 0.5,
      focusY: 0.46,
    },
    {
      id: "shot-3",
      imageSrc: SAMPLE_MOCKUPS.ecommerce.src,
      label: "Storefront",
      caption: "Conversion-engineered product pages built to close deals.",
      focusX: 0.68,
      focusY: 0.54,
    },
    {
      id: "shot-4",
      imageSrc: SAMPLE_MOCKUPS.mobile.src,
      label: "Mobile App",
      caption: "Seamless performance across desktop and iOS everywhere.",
      focusX: 0.5,
      focusY: 0.36,
    },
  ];
}

const DEAL_SCRIPT_PACKS: { label: string; script: Omit<BrandDealScript, "clientName" | "ctaUrl"> }[] = [
  {
    label: "SaaS",
    script: {
      problemHook: "Static decks don't close software deals.",
      heroHeadline: "Turn every workflow into measurable ROI.",
      proofStat1: "10x Faster Setup",
      proofStat2: "+340% Conversion",
      proofStat3: "50K+ Teams",
      offerBadge: "FOUNDING OFFER · 30% OFF",
      ctaSubtitle: "Book a live walkthrough in 60 seconds.",
    },
  },
  {
    label: "Mobile App",
    script: {
      problemHook: "Slow apps lose users in 3 seconds.",
      heroHeadline: "Your entire pocket workflow, reimagined.",
      proofStat1: "4.9★ App Store",
      proofStat2: "2M+ Downloads",
      proofStat3: "0.2s Sync",
      offerBadge: "FREE ON IOS & ANDROID",
      ctaSubtitle: "Download now and claim 14 days Pro free.",
    },
  },
  {
    label: "AI Tool",
    script: {
      problemHook: "Stop burning 10 hours on manual work.",
      heroHeadline: "Automate research, drafts & ops in 1 click.",
      proofStat1: "14 hrs Saved/Wk",
      proofStat2: "99.4% Accuracy",
      proofStat3: "Zero Code",
      offerBadge: "TRY FREE · NO CARD NEEDED",
      ctaSubtitle: "Launch your first AI workflow today.",
    },
  },
  {
    label: "Agency",
    script: {
      problemHook: "Generic creatives kill paid ad ROAS.",
      heroHeadline: "High-converting launches shipped in 48h.",
      proofStat1: "4.2x Avg ROAS",
      proofStat2: "120+ Brands",
      proofStat3: "48h Delivery",
      offerBadge: "Q4 AUDIT · LIMITED SLOTS",
      ctaSubtitle: "Reply or visit below for a free creative audit.",
    },
  },
];

function loadSavedProfiles(): SavedBrandDealProfile[] {
  try {
    const raw = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedBrandDealProfile[]) : [];
  } catch {
    return [];
  }
}

export const ShortFilmStudioView: React.FC<ShortFilmStudioViewProps> = ({
  brandKit,
  shots,
  onChangeShots,
  onOpenBrandKit,
  onNotify,
  isPreviewLocked = false,
  onRequireAuthForUpload,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const multiUploadRef = useRef<HTMLInputElement | null>(null);
  const imageMapRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const logoImgRef = useRef<HTMLImageElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<"All" | ShortFilmCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [preset, setPreset] = useState<ShortFilmPreset>(SHORT_FILM_PRESETS[0]);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("deal");

  const [aspectId, setAspectId] = useState<FilmAspect>("16:9");
  const [phoneFormatMode, setPhoneFormatMode] = useState(false);
  const [phoneFitMode, setPhoneFitMode] = useState<PhoneFitMode>("showcase");
  const [mockupScale, setMockupScale] = useState(100);
  const [showBrandHeader, setShowBrandHeader] = useState(true);
  const [duration, setDuration] = useState<ShortFilmDuration>(SHORT_FILM_PRESETS[0].defaultDuration);
  const [useBrandKit, setUseBrandKit] = useState(true);
  const [activeShotIndex, setActiveShotIndex] = useState(0);

  const [dealScript, setDealScript] = useState<BrandDealScript>(() => ({
    clientName: brandKit.brandName || "Acme Cloud",
    problemHook: "Static decks don't close brand deals.",
    heroHeadline: "Turn every click into high-converting momentum.",
    proofStat1: "10x Faster Workflow",
    proofStat2: "+340% Engagement",
    proofStat3: "50K+ Teams",
    offerBadge: "PARTNER OFFER · CODE: LAUNCH25",
    ctaUrl: brandKit.domainBadge || "snapframy.app",
    ctaSubtitle: "Book a demo or start your free trial today.",
  }));
  const [savedProfiles, setSavedProfiles] = useState<SavedBrandDealProfile[]>(() =>
    loadSavedProfiles()
  );

  // Pro FX overrides
  const [commercialArc, setCommercialArc] = useState(SHORT_FILM_PRESETS[0].commercialArc);
  const [motionBlurTrails, setMotionBlurTrails] = useState(SHORT_FILM_PRESETS[0].motionBlurTrails);
  const [flashBeats, setFlashBeats] = useState(SHORT_FILM_PRESETS[0].flashBeats);
  const [chromaticSplit, setChromaticSplit] = useState(SHORT_FILM_PRESETS[0].chromaticSplit);
  const [floorReflection, setFloorReflection] = useState(SHORT_FILM_PRESETS[0].floorReflection);
  const [kineticText, setKineticText] = useState(SHORT_FILM_PRESETS[0].kineticText);
  const [particlesEnabled, setParticlesEnabled] = useState(SHORT_FILM_PRESETS[0].particlesEnabled);
  const [cursorSpotlight, setCursorSpotlight] = useState(SHORT_FILM_PRESETS[0].cursorSpotlight);
  const [cinemaBars, setCinemaBars] = useState(SHORT_FILM_PRESETS[0].cinemaBars);
  const [filmLook, setFilmLook] = useState<FilmLookConfig>(DEFAULT_FILM_LOOK);

  // Playback & Beat Synth Audio
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const currentTimeRef = useRef(0);
  const startClockRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cropShotIndex, setCropShotIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const lastStepRef = useRef(-1);

  const [exportState, setExportState] = useState<{
    active: boolean;
    kind: "webm" | "mp4" | "gif" | null;
    pct: number;
  }>({ active: false, kind: null, pct: 0 });
  const cancelExportRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    shots.forEach((shot) => {
      const existing = imageMapRef.current.get(shot.id);
      if (existing && existing.src === shot.imageSrc) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = shot.imageSrc;
      imageMapRef.current.set(shot.id, img);
    });
  }, [shots]);

  useEffect(() => {
    if (!brandKit.logoDataUrl) {
      logoImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      logoImgRef.current = img;
    };
    img.src = brandKit.logoDataUrl;
  }, [brandKit.logoDataUrl]);

  const effectivePreset: ShortFilmPreset = useMemo(
    () => ({
      ...preset,
      frameStyle: phoneFormatMode ? "iphone" : preset.frameStyle,
      commercialArc,
      motionBlurTrails,
      flashBeats,
      chromaticSplit,
      floorReflection,
      kineticText,
      particlesEnabled,
      cursorSpotlight,
      cinemaBars,
    }),
    [
      chromaticSplit,
      cinemaBars,
      commercialArc,
      cursorSpotlight,
      flashBeats,
      floorReflection,
      kineticText,
      motionBlurTrails,
      particlesEnabled,
      phoneFormatMode,
      preset,
    ]
  );

  const filteredPresets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SHORT_FILM_PRESETS.filter((p) => {
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
      if (!q) return true;
      return `${p.name} ${p.category} ${p.description} ${p.choreography}`.toLowerCase().includes(q);
    });
  }, [selectedCategory, searchQuery]);

  const dims = FILM_ASPECTS[aspectId];
  const filmLookCssFilter = useMemo(() => buildFilmLookCssFilter(filmLook), [filmLook]);

  const drawAt = useCallback(
    (tSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      renderShortFilmFrame({
        ctx,
        width: dims.width,
        height: dims.height,
        progress: duration > 0 ? Math.min(1, Math.max(0, tSec / duration)) : 0,
        preset: effectivePreset,
        shots,
        imageMap: imageMapRef.current,
        logoImg: logoImgRef.current,
        dealScript,
        filmLook,
        brandKit,
        useBrandKit,
        mockupScale,
        showBrandHeader,
        phoneFitMode,
      });
    },
    [
      brandKit,
      dealScript,
      dims.height,
      dims.width,
      duration,
      effectivePreset,
      filmLook,
      mockupScale,
      phoneFitMode,
      shots,
      showBrandHeader,
      useBrandKit,
    ]
  );

  useEffect(() => {
    currentTimeRef.current = currentTime;
    drawAt(currentTime);
  }, [currentTime, drawAt]);

  useEffect(() => {
    if (!isPlaying || exportState.active) return;
    startClockRef.current = performance.now() - currentTimeRef.current * 1000;

    const tick = (now: number) => {
      const elapsed = (now - startClockRef.current) / 1000;
      if (elapsed >= duration) {
        startClockRef.current = now;
        lastStepRef.current = -1;
        currentTimeRef.current = 0;
        setCurrentTime(0);
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
  }, [duration, exportState.active, isPlaying]);

  useEffect(() => {
    if (!isPlaying || exportState.active || !audioEnabled) return;
    const ctx = audioCtxRef.current;
    const gain = masterGainRef.current;
    if (!ctx || !gain || ctx.state !== "running") return;

    const timer = window.setInterval(() => {
      const totalSteps = Math.floor(duration / 0.25);
      const step = Math.floor(currentTimeRef.current / 0.25) % Math.max(1, totalSteps);
      if (step !== lastStepRef.current) {
        lastStepRef.current = step;
        scheduleShortFilmAudioStep(ctx, gain, step, ctx.currentTime + 0.02, duration, shots.length);
      }
    }, 45);

    return () => window.clearInterval(timer);
  }, [audioEnabled, duration, exportState.active, isPlaying, shots.length]);

  const toggleAudio = async () => {
    if (!audioEnabled) {
      try {
        if (!audioCtxRef.current) {
          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          const ctx = new AudioCtx();
          const gain = ctx.createGain();
          gain.gain.value = 0.85;
          gain.connect(ctx.destination);
          audioCtxRef.current = ctx;
          masterGainRef.current = gain;
        }
        if (audioCtxRef.current.state === "suspended") {
          await audioCtxRef.current.resume();
        }
        lastStepRef.current = -1;
        setAudioEnabled(true);
      } catch {
        onNotify("Browser audio could not be initialized.", "error");
      }
    } else {
      setAudioEnabled(false);
    }
  };

  const applyPreset = (p: ShortFilmPreset) => {
    setPreset(p);
    setDuration(p.defaultDuration);
    if (p.defaultAspect === "9:16" || p.category === "Mobile Phone & Reels") {
      setPhoneFormatMode(true);
      setAspectId("9:16");
    } else if (phoneFormatMode) {
      setAspectId("9:16");
    }
    setCommercialArc(p.commercialArc);
    setMotionBlurTrails(p.motionBlurTrails);
    setFlashBeats(p.flashBeats);
    setChromaticSplit(p.chromaticSplit);
    setFloorReflection(p.floorReflection);
    setKineticText(p.kineticText);
    setParticlesEnabled(p.particlesEnabled);
    setCursorSpotlight(p.cursorSpotlight);
    setCinemaBars(p.cinemaBars);
    currentTimeRef.current = 0;
    lastStepRef.current = -1;
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const togglePhoneFormat = () => {
    setPhoneFormatMode((prev) => {
      const next = !prev;
      if (next) {
        setAspectId("9:16");
        onNotify("Converted Short Film to Mobile Phone Format (9:16 · iPhone)");
      } else {
        setAspectId("16:9");
      }
      return next;
    });
  };

  const saveCurrentClientProfile = () => {
    const label = dealScript.clientName.trim() || "Client Deal";
    const profile: SavedBrandDealProfile = {
      id: `deal-${Date.now()}`,
      name: label,
      script: dealScript,
      filmLook,
      presetId: preset.id,
      duration,
    };
    const next = [profile, ...savedProfiles.filter((p) => p.name !== label)].slice(0, 12);
    setSavedProfiles(next);
    try {
      window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage quota
    }
    onNotify(`Saved client preset "${label}"`);
  };

  const applySavedProfile = (profile: SavedBrandDealProfile) => {
    setDealScript(profile.script);
    setFilmLook(profile.filmLook);
    const found = SHORT_FILM_PRESETS.find((p) => p.id === profile.presetId);
    if (found) applyPreset(found);
    setDuration(profile.duration);
    onNotify(`Loaded client preset "${profile.name}"`);
  };

  const deleteSavedProfile = (id: string) => {
    const next = savedProfiles.filter((p) => p.id !== id);
    setSavedProfiles(next);
    try {
      window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleMultiFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (isPreviewLocked && onRequireAuthForUpload) {
      onRequireAuthForUpload();
      return;
    }
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;

    Promise.all(
      imageFiles.map(
        (file, idx) =>
          new Promise<ShortFilmShot>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                id: `shot-${Date.now()}-${idx}`,
                imageSrc: typeof reader.result === "string" ? reader.result : SAMPLE_MOCKUPS.saas.src,
                label: file.name.replace(/\.[^/.]+$/, "").slice(0, 18) || `Screen ${idx + 1}`,
                caption: "Showcasing key partner product feature in motion.",
              });
            };
            reader.readAsDataURL(file);
          })
      )
    ).then((newShots) => {
      onChangeShots((prev) => [...prev, ...newShots]);
      setActiveShotIndex(shots.length);
      onNotify(`Added ${newShots.length} screenshot${newShots.length > 1 ? "s" : ""} to Short Film`);
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleMultiFileUpload(e.dataTransfer.files);
  };

  const moveShot = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= shots.length) return;
    onChangeShots((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
    setActiveShotIndex(target);
  };

  const removeShot = (index: number) => {
    if (shots.length <= 1) {
      onNotify("Keep at least 1 screenshot in the Short Film storyboard.", "error");
      return;
    }
    onChangeShots((prev) => prev.filter((_, i) => i !== index));
    setActiveShotIndex((prev) => Math.max(0, Math.min(prev, shots.length - 2)));
  };

  const handleVideoExport = async (kind: "webm" | "mp4") => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      onNotify("Video export unavailable in this browser. Try GIF export.", "error");
      return;
    }

    const candidates =
      kind === "mp4"
        ? [
            "video/mp4;codecs=avc1",
            "video/mp4",
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp9",
            "video/webm",
          ]
        : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp9", "video/webm"];

    const mimeType = candidates.find((m) => MediaRecorder.isTypeSupported(m));
    if (!mimeType) {
      onNotify("No supported video codec found.", "error");
      return;
    }
    const actualExt = mimeType.includes("mp4") ? "mp4" : "webm";
    if (kind === "mp4" && actualExt !== "mp4") {
      onNotify("Browser lacks native MP4 MediaRecorder — exporting crisp WebM.");
    }

    cancelExportRef.current = false;
    setIsPlaying(false);
    setExportState({ active: true, kind, pct: 0 });
    currentTimeRef.current = 0;
    setCurrentTime(0);

    const videoStream = canvas.captureStream(30);
    const tracks: MediaStreamTrack[] = [...videoStream.getVideoTracks()];
    let recAudioCtx: AudioContext | null = null;

    if (audioEnabled) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        recAudioCtx = new AudioCtx();
        if (recAudioCtx.state === "suspended") await recAudioCtx.resume();
        const dest = recAudioCtx.createMediaStreamDestination();
        const gain = recAudioCtx.createGain();
        gain.gain.value = 0.85;
        gain.connect(dest);
        const totalSteps = Math.floor(duration / 0.25);
        for (let s = 0; s < totalSteps; s++) {
          scheduleShortFilmAudioStep(
            recAudioCtx,
            gain,
            s,
            recAudioCtx.currentTime + 0.05 + s * 0.25,
            duration,
            shots.length
          );
        }
        dest.stream.getAudioTracks().forEach((t) => tracks.push(t));
      } catch {
        // continue video-only
      }
    }

    const recorder = new MediaRecorder(new MediaStream(tracks), {
      mimeType,
      videoBitsPerSecond: 7_000_000,
    });
    recorderRef.current = recorder;
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      setExportState({ active: false, kind: null, pct: 0 });
      if (recAudioCtx) recAudioCtx.close().catch(() => undefined);
      if (cancelExportRef.current || chunks.length === 0) return;
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `snapframy-${preset.id}-${duration}s.${actualExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify(`Exported ${duration}s Brand Commercial (${actualExt.toUpperCase()})`);
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
      drawAt(clamped);
      setExportState({
        active: true,
        kind,
        pct: Math.min(100, Math.round((clamped / duration) * 100)),
      });
      if (elapsed < duration) requestAnimationFrame(step);
      else recorder.stop();
    };
    requestAnimationFrame(step);
  };

  const handleGifExport = async () => {
    cancelExportRef.current = false;
    setIsPlaying(false);
    setExportState({ active: true, kind: "gif", pct: 0 });

    const scale = Math.min(1, 520 / dims.width);
    const gw = Math.round(dims.width * scale);
    const gh = Math.round(dims.height * scale);
    const off = document.createElement("canvas");
    off.width = gw;
    off.height = gh;
    const offCtx = off.getContext("2d", { willReadFrequently: true });
    if (!offCtx) {
      setExportState({ active: false, kind: null, pct: 0 });
      return;
    }

    const fps = duration >= 30 ? 8 : 12;
    const totalFrames = Math.max(24, Math.round(duration * fps));
    const frames: ImageData[] = [];

    for (let i = 0; i < totalFrames; i++) {
      if (cancelExportRef.current) {
        setExportState({ active: false, kind: null, pct: 0 });
        return;
      }
      renderShortFilmFrame({
        ctx: offCtx,
        width: gw,
        height: gh,
        progress: i / Math.max(1, totalFrames - 1),
        preset: effectivePreset,
        shots,
        imageMap: imageMapRef.current,
        logoImg: logoImgRef.current,
        dealScript,
        filmLook,
        brandKit,
        useBrandKit,
        mockupScale,
        showBrandHeader,
        phoneFitMode,
      });
      frames.push(offCtx.getImageData(0, 0, gw, gh));
      setExportState({
        active: true,
        kind: "gif",
        pct: Math.round(((i + 1) / totalFrames) * 90),
      });
      if (i % 6 === 0) await new Promise((r) => setTimeout(r, 0));
    }

    const blob = encodeGifFrames(frames, gw, gh, Math.round(1000 / fps), true);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snapframy-${preset.id}-${duration}s.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportState({ active: false, kind: null, pct: 0 });
    onNotify(`Exported Short Film GIF (${gw}×${gh})`);
    setIsPlaying(true);
  };

  const activeShot = shots[Math.min(activeShotIndex, shots.length - 1)];

  return (
    <div
      className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#0A0A0C]"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Left Rail: Clean Commercial Templates List (shows below canvas on phones) */}
      <aside className="order-2 lg:order-1 w-full lg:w-[272px] shrink-0 max-h-[250px] sm:max-h-[300px] lg:max-h-none border-t lg:border-t-0 lg:border-r border-[#1E1E24] bg-[#101014] flex flex-col min-h-0">
        <div className="p-3.5 border-b border-[#1E1E24] space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-white">
              1. Pick Film Cut ({SHORT_FILM_PRESETS.length})
            </h2>
            <span className="text-[11px] font-mono-tabular text-zinc-400">
              {duration}s · {aspectId}
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 30s, whip, bento, orbit..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 studio-scroll">
            {SHORT_FILM_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 border cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                    : "bg-[#141419] border-[#22222A] text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat === "All" ? "All" : cat.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto studio-scroll p-2.5 space-y-1.5">
          {filteredPresets.map((item) => {
            const active = preset.id === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={exportState.active}
                onClick={() => applyPreset(item)}
                className={`w-full text-left p-2.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                  active
                    ? "bg-[#2563EB]/12 border-[#3B82F6]/60"
                    : "bg-[#131318] border-[#1F1F27] hover:border-[#32323E]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex items-center -space-x-1 shrink-0">
                      {item.palette.slice(0, 3).map((hex, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full border border-black/60"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                    <span className="text-xs font-semibold text-zinc-100 truncate">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-tabular text-zinc-400 shrink-0">
                    {item.defaultDuration}s
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5 truncate">
                  {item.commercialArc ? "6-Act Brand Spot" : "Fast Reel"} · {item.choreography}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Center Stage: Cinema Preview + Chapters + Storyboard (first on phones) */}
      <section
        className={
          isFullscreen
            ? "fixed inset-0 z-50 flex flex-col bg-[#060608] overflow-hidden"
            : "order-1 lg:order-2 flex-1 flex flex-col min-w-0 studio-canvas-grid lg:overflow-hidden"
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b border-[#1E1E24] bg-[#0D0D10]/90">
          <div className="flex items-center gap-2 text-xs text-zinc-400 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
            <span className="font-semibold text-zinc-100 truncate">{preset.name}</span>
            <span className="hidden sm:inline text-zinc-500">
              · Paste screenshots (`Ctrl+V`) to build your reel
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <input
              ref={multiUploadRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                handleMultiFileUpload(e.target.files);
                e.target.value = "";
              }}
              className="hidden"
            />
            <button
              type="button"
              disabled={exportState.active}
              onClick={() => setShowBrandHeader((v) => !v)}
              title="Show or hide Brand Name / URL / Act header labels"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer whitespace-nowrap transition-colors ${
                showBrandHeader
                  ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                  : "bg-[#18181F] hover:bg-[#22222C] border-[#282834] text-zinc-400"
              }`}
            >
              {showBrandHeader ? (
                <Eye className="w-3.5 h-3.5 text-[#60A5FA]" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              Brand / URL
            </button>
            <button
              type="button"
              disabled={exportState.active}
              onClick={() => {
                const pool = filteredPresets.length > 1 ? filteredPresets : SHORT_FILM_PRESETS;
                const candidates = pool.filter((p) => p.id !== preset.id);
                const next = candidates[Math.floor(Math.random() * candidates.length)] || SHORT_FILM_PRESETS[0];
                applyPreset(next);
                onNotify(`Remixed film cut to "${next.name}"`);
              }}
              title="Pick a fresh eye-catching Film Cut"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5 text-[#60A5FA]" />
              Remix
            </button>
            <button
              type="button"
              disabled={exportState.active}
              onClick={togglePhoneFormat}
              title="Convert current template to vertical Phone Format (9:16 iPhone)"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border cursor-pointer whitespace-nowrap transition-colors ${
                phoneFormatMode
                  ? "bg-[#2563EB]/20 border-[#3B82F6] text-white"
                  : "bg-[#18181F] hover:bg-[#22222C] border-[#282834] text-zinc-200"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#60A5FA]" />
              Phone Format
            </button>
            {!isFullscreen && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (isPreviewLocked && onRequireAuthForUpload) {
                      onRequireAuthForUpload();
                      return;
                    }
                    multiUploadRef.current?.click();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                >
                  {isPreviewLocked ? <Lock className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
                  {isPreviewLocked ? "Add Screenshots (Sign In)" : "Add Screenshots"}
                </button>
                <button
                  type="button"
                  onClick={() => setCropShotIndex(activeShotIndex)}
                  title="Crop current storyboard shot so it fits cleanly inside the frame"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
                >
                  <Crop className="w-3.5 h-3.5 text-[#60A5FA]" />
                  Crop Shot
                </button>
                <button
                  type="button"
                  onClick={onOpenBrandKit}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#18181F] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-200 cursor-pointer whitespace-nowrap"
                >
                  <Palette className="w-3.5 h-3.5" style={{ color: brandKit.primaryColor }} />
                  Brand Kit
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
                  Exit Fullscreen
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

        {/* Canvas Viewport */}
        <div className="flex-1 flex items-center justify-center p-2.5 sm:p-4 overflow-auto studio-scroll">
          <canvas
            ref={canvasRef}
            width={dims.width}
            height={dims.height}
            className={`max-w-full w-auto h-auto rounded-lg border border-white/10 shadow-2xl bg-[#07080C] ${
              isFullscreen ? "max-h-[76vh] sm:max-h-[80vh]" : "max-h-[44vh] sm:max-h-[380px]"
            }`}
          />
        </div>

        {/* Transport & Chapter Jump Strip */}
        <div className="px-3 sm:px-4 py-2 border-t border-[#1E1E24] bg-[#0D0D11] space-y-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              disabled={exportState.active}
              onClick={() => setIsPlaying((p) => !p)}
              className="p-1.5 rounded-md bg-[#18181F] border border-[#282834] text-white cursor-pointer"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              disabled={exportState.active}
              onClick={() => {
                currentTimeRef.current = 0;
                lastStepRef.current = -1;
                setCurrentTime(0);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded-md bg-[#18181F] border border-[#282834] text-zinc-300 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={exportState.active}
              onClick={toggleAudio}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
                audioEnabled
                  ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                  : "bg-[#18181F] border-[#282834] text-zinc-400"
              }`}
            >
              {audioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Beat SFX
            </button>
            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#18181F] border border-[#282834] shrink-0">
              <span className="text-[10px] text-zinc-400">SS</span>
              <button
                type="button"
                disabled={exportState.active}
                onClick={() => setMockupScale((s) => Math.max(55, s - 5))}
                className="px-1 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                title="Decrease screenshot size"
              >
                −
              </button>
              <span className="text-[10px] font-mono-tabular text-zinc-200 w-8 text-center">
                {mockupScale}%
              </span>
              <button
                type="button"
                disabled={exportState.active}
                onClick={() => setMockupScale((s) => Math.min(140, s + 5))}
                className="px-1 text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
                title="Increase screenshot size"
              >
                +
              </button>
            </div>
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
              className="studio-slider flex-1 min-w-[110px]"
            />
            <span className="text-[11px] font-mono-tabular text-zinc-300 w-20 sm:w-24 text-right shrink-0">
              {currentTime.toFixed(1)}s / {duration}s
            </span>
          </div>

          {commercialArc && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 studio-scroll">
              {CHAPTER_MARKERS.map((ch) => (
                <button
                  key={ch.label}
                  type="button"
                  disabled={exportState.active}
                  onClick={() => {
                    const target = ch.pct * duration;
                    currentTimeRef.current = target;
                    setCurrentTime(target);
                  }}
                  className="px-2 py-0.5 rounded bg-[#15151C] hover:bg-[#1E1E29] border border-[#24242E] text-[10px] font-mono-tabular text-zinc-300 cursor-pointer whitespace-nowrap"
                >
                  {ch.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Multi-Screenshot Storyboard Tray */}
        {!isFullscreen && (
        <div className="p-3 border-t border-[#1E1E24] bg-[#0B0B0E] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-zinc-300">
              2. Storyboard Shots ({shots.length}) — Click a shot to edit focus & caption
            </span>
            <button
              type="button"
              onClick={() => {
                if (isPreviewLocked && onRequireAuthForUpload) {
                  onRequireAuthForUpload();
                  return;
                }
                multiUploadRef.current?.click();
              }}
              className="flex items-center gap-1 text-[11px] text-[#60A5FA] hover:text-white cursor-pointer"
            >
              {isPreviewLocked ? <Lock className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              {isPreviewLocked ? "Add Shot (Sign In)" : "Add Shot"}
            </button>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 studio-scroll">
            {shots.map((shot, idx) => {
              const selected = idx === activeShotIndex;
              return (
                <div
                  key={shot.id}
                  onClick={() => {
                    setActiveShotIndex(idx);
                    setInspectorTab("shot");
                  }}
                  className={`shrink-0 w-36 rounded-lg border p-1.5 cursor-pointer transition-colors ${
                    selected
                      ? "bg-[#191D2A] border-[#3B82F6]"
                      : "bg-[#121217] border-[#22222A] hover:border-[#343442]"
                  }`}
                >
                  <div className="h-14 rounded overflow-hidden bg-[#07080C] mb-1 relative">
                    <img
                      src={shot.imageSrc}
                      alt={shot.label}
                      style={{ filter: filmLookCssFilter }}
                      className="w-full h-full object-cover transition-[filter] duration-200"
                    />
                    <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/75 text-[9px] font-mono-tabular text-zinc-200">
                      0{idx + 1}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-medium text-zinc-200 truncate">
                      {shot.label}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveShot(idx, -1);
                        }}
                        className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
                        title="Move left"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          moveShot(idx, 1);
                        }}
                        className="p-0.5 text-zinc-400 hover:text-white cursor-pointer"
                        title="Move right"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropShotIndex(idx);
                        }}
                        className="p-0.5 text-zinc-400 hover:text-[#60A5FA] cursor-pointer"
                        title="Crop & Auto-Fit shot"
                      >
                        <Crop className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const copyShot: ShortFilmShot = {
                            ...shot,
                            id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                            label: `${shot.label} Copy`,
                          };
                          onChangeShots((prev) => [
                            ...prev.slice(0, idx + 1),
                            copyShot,
                            ...prev.slice(idx + 1),
                          ]);
                          setActiveShotIndex(idx + 1);
                        }}
                        className="p-0.5 text-zinc-400 hover:text-[#60A5FA] cursor-pointer"
                        title="Duplicate shot"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeShot(idx);
                        }}
                        className="p-0.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                        title="Delete shot"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}
      </section>

      {/* Right Rail: Clean 3-Tab Inspector + Pinned Export */}
      <aside className="order-3 w-full lg:w-[296px] shrink-0 border-t lg:border-t-0 lg:border-l border-[#1E1E24] bg-[#101014] flex flex-col min-h-0">
        {/* Clean Tab Bar */}
        <div className="p-3 border-b border-[#1E1E24] bg-[#0D0D11]">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[#16161C] border border-[#24242E]">
            {(
              [
                { id: "deal", label: "Brand Deal" },
                { id: "look", label: "Look & FX" },
                { id: "shot", label: "Shot Focus" },
              ] as { id: InspectorTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setInspectorTab(tab.id)}
                className={`py-1.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  inspectorTab === tab.id
                    ? "bg-[#2563EB] text-white"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto studio-scroll p-4 space-y-4">
          {inspectorTab === "deal" && (
            <>
              {/* Saved Client Profiles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Client Profiles</span>
                  <button
                    type="button"
                    onClick={saveCurrentClientProfile}
                    className="flex items-center gap-1 text-[11px] text-[#60A5FA] hover:text-white cursor-pointer"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    Save Client
                  </button>
                </div>

                {savedProfiles.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {savedProfiles.map((prof) => (
                      <div
                        key={prof.id}
                        className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-[#16161C] border border-[#24242E] text-[11px] text-zinc-200"
                      >
                        <button
                          type="button"
                          onClick={() => applySavedProfile(prof)}
                          className="hover:text-white cursor-pointer truncate max-w-[110px]"
                        >
                          {prof.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSavedProfile(prof.id)}
                          className="p-0.5 text-zinc-500 hover:text-red-400 cursor-pointer"
                          title="Delete profile"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500">
                    Save client scripts here to reuse across future brand deals.
                  </p>
                )}
              </div>

              <div className="h-px bg-[#1E1E24]" />

              {/* Clean Brand Deal Script Fields */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Client Script & Offer</span>
                  <button
                    type="button"
                    onClick={() =>
                      setDealScript((prev) => ({
                        ...prev,
                        clientName: brandKit.brandName || prev.clientName,
                        ctaUrl: brandKit.domainBadge || prev.ctaUrl,
                      }))
                    }
                    className="text-[10px] text-[#60A5FA] hover:text-white cursor-pointer"
                  >
                    Sync Brand Kit
                  </button>
                </div>

                <div>
                  <span className="block text-[10px] text-zinc-400 mb-1">1-Click Industry Script</span>
                  <div className="grid grid-cols-4 gap-1">
                    {DEAL_SCRIPT_PACKS.map((pack) => (
                      <button
                        key={pack.label}
                        type="button"
                        onClick={() => {
                          setDealScript((prev) => ({
                            ...prev,
                            ...pack.script,
                          }));
                          onNotify(`Loaded ${pack.label} commercial script`);
                        }}
                        className="py-1 rounded bg-[#16161C] hover:bg-[#22222C] border border-[#262632] text-[10px] font-medium text-zinc-200 cursor-pointer"
                      >
                        {pack.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Partner Brand Name</label>
                  <input
                    type="text"
                    value={dealScript.clientName}
                    onChange={(e) => setDealScript((p) => ({ ...p, clientName: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Act 1 Hook Headline</label>
                  <input
                    type="text"
                    value={dealScript.problemHook}
                    onChange={(e) => setDealScript((p) => ({ ...p, problemHook: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Act 2 Product Promise</label>
                  <input
                    type="text"
                    value={dealScript.heroHeadline}
                    onChange={(e) => setDealScript((p) => ({ ...p, heroHeadline: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">3 Proof Metrics (Act 5)</label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={dealScript.proofStat1}
                      onChange={(e) => setDealScript((p) => ({ ...p, proofStat1: e.target.value }))}
                      className="px-2 py-1 rounded bg-[#16161C] border border-[#24242E] text-[11px] text-white"
                    />
                    <input
                      type="text"
                      value={dealScript.proofStat2}
                      onChange={(e) => setDealScript((p) => ({ ...p, proofStat2: e.target.value }))}
                      className="px-2 py-1 rounded bg-[#16161C] border border-[#24242E] text-[11px] text-white"
                    />
                    <input
                      type="text"
                      value={dealScript.proofStat3}
                      onChange={(e) => setDealScript((p) => ({ ...p, proofStat3: e.target.value }))}
                      className="px-2 py-1 rounded bg-[#16161C] border border-[#24242E] text-[11px] text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-zinc-400 mb-1">Promo Offer Badge</label>
                  <input
                    type="text"
                    value={dealScript.offerBadge}
                    onChange={(e) => setDealScript((p) => ({ ...p, offerBadge: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">Client URL</label>
                    <input
                      type="text"
                      value={dealScript.ctaUrl}
                      onChange={(e) => setDealScript((p) => ({ ...p, ctaUrl: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">End Subtitle</label>
                    <input
                      type="text"
                      value={dealScript.ctaSubtitle}
                      onChange={(e) => setDealScript((p) => ({ ...p, ctaSubtitle: e.target.value }))}
                      className="w-full px-2 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {inspectorTab === "look" && (
            <>
              {/* Duration & Aspect */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-200 mb-2">Duration & Format</h3>
                <div className="grid grid-cols-4 gap-1 mb-2">
                  {([10, 15, 20, 30] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      disabled={exportState.active}
                      onClick={() => setDuration(d)}
                      className={`py-1.5 rounded text-xs font-mono-tabular border cursor-pointer ${
                        duration === d
                          ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400"
                      }`}
                    >
                      {d}s
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1 mb-3">
                  {(Object.keys(FILM_ASPECTS) as FilmAspect[]).map((id) => (
                    <button
                      key={id}
                      type="button"
                      disabled={exportState.active}
                      onClick={() => {
                        setAspectId(id);
                        if (id !== "9:16" && phoneFormatMode) {
                          setPhoneFormatMode(false);
                        }
                      }}
                      className={`py-1.5 rounded text-[11px] font-mono-tabular border cursor-pointer ${
                        aspectId === id
                          ? "bg-[#2563EB]/15 border-[#3B82F6]/60 text-white"
                          : "bg-[#141419] border-[#22222A] text-zinc-400"
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                    <span>Screenshot Size (SS)</span>
                    <div className="flex items-center gap-2">
                      {mockupScale !== 100 && (
                        <button
                          type="button"
                          onClick={() => setMockupScale(100)}
                          className="text-[10px] text-[#60A5FA] hover:text-white cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                      <span className="font-mono-tabular text-zinc-200">{mockupScale}%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={55}
                    max={145}
                    value={mockupScale}
                    disabled={exportState.active}
                    onChange={(e) => setMockupScale(Number(e.target.value))}
                    className="studio-slider w-full"
                  />
                </div>

                {(phoneFormatMode || effectivePreset.frameStyle === "iphone") && (
                  <div className="space-y-1.5 pt-2.5">
                    <div className="flex items-center justify-between text-[11px] text-zinc-300">
                      <span className="font-semibold">Desktop SS in Phone</span>
                      <span className="text-[10px] text-zinc-500">Wide Fix</span>
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
                  </div>
                )}
              </div>

              <div className="h-px bg-[#1E1E24]" />

              {/* Cinematic Film Look */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Aperture className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Cinematic Film Look
                  </h3>
                  {filmLook.id !== "none" && (
                    <button
                      type="button"
                      onClick={() => setFilmLook(DEFAULT_FILM_LOOK)}
                      className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {FILM_LOOK_PRESETS.map((look) => {
                    const active = filmLook.id === look.id;
                    return (
                      <button
                        key={look.id}
                        type="button"
                        disabled={exportState.active}
                        onClick={() =>
                          setFilmLook((prev) => ({
                            ...prev,
                            id: look.id,
                            intensity:
                              look.id === "none" ? prev.intensity : Math.max(prev.intensity, 75),
                          }))
                        }
                        className={`flex items-center gap-2 p-1.5 rounded-md border text-left transition-colors cursor-pointer ${
                          active
                            ? "bg-[#2563EB]/15 border-[#3B82F6]/70 text-white"
                            : "bg-[#141419] border-[#22222A] text-zinc-300 hover:border-[#343440]"
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded shrink-0 border border-white/20"
                          style={{ background: look.swatch }}
                        />
                        <div className="min-w-0">
                          <div className="text-[10.5px] font-semibold leading-tight truncate">
                            {look.name}
                          </div>
                          <div className="text-[9px] text-zinc-500 leading-tight">{look.tag}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Grade Intensity</span>
                      <span className="font-mono-tabular text-zinc-300">{filmLook.intensity}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={filmLook.intensity}
                      disabled={filmLook.id === "none" || exportState.active}
                      onChange={(e) =>
                        setFilmLook((prev) => ({ ...prev, intensity: Number(e.target.value) }))
                      }
                      className="studio-slider w-full disabled:opacity-40"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span>Vignette</span>
                        <span className="font-mono-tabular text-zinc-300">{filmLook.vignette}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filmLook.vignette}
                        disabled={exportState.active}
                        onChange={(e) =>
                          setFilmLook((prev) => ({ ...prev, vignette: Number(e.target.value) }))
                        }
                        className="studio-slider w-full"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                        <span>35mm Grain</span>
                        <span className="font-mono-tabular text-zinc-300">{filmLook.filmGrain}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={filmLook.filmGrain}
                        disabled={exportState.active}
                        onChange={(e) =>
                          setFilmLook((prev) => ({ ...prev, filmGrain: Number(e.target.value) }))
                        }
                        className="studio-slider w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#1E1E24]" />

              {/* Compact Commercial & Cinema FX */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-semibold text-zinc-200">Cinema FX</h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setCinemaBars(false);
                        setMotionBlurTrails(false);
                        setFlashBeats(false);
                        setChromaticSplit(false);
                        setParticlesEnabled(false);
                      }}
                      className="px-1.5 py-0.5 rounded bg-[#16161C] hover:bg-[#22222C] border border-[#262632] text-[10px] text-zinc-300 cursor-pointer"
                    >
                      Clean
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCommercialArc(true);
                        setCursorSpotlight(true);
                        setParticlesEnabled(true);
                        setCinemaBars(true);
                        setMotionBlurTrails(true);
                        setFlashBeats(true);
                        setChromaticSplit(true);
                        setFloorReflection(true);
                        setKineticText(true);
                      }}
                      className="px-1.5 py-0.5 rounded bg-[#2563EB]/20 hover:bg-[#2563EB]/30 border border-[#3B82F6]/50 text-[10px] text-blue-200 cursor-pointer"
                    >
                      Full FX
                    </button>
                  </div>
                </div>
                {[
                  { label: "Brand & URL Headings", val: showBrandHeader, set: setShowBrandHeader },
                  { label: "6-Act Commercial Story", val: commercialArc, set: setCommercialArc },
                  { label: "Cursor Click Zooms", val: cursorSpotlight, set: setCursorSpotlight },
                  { label: "Ambient Sparks", val: particlesEnabled, set: setParticlesEnabled },
                  { label: "Letterbox Cinema Bars", val: cinemaBars, set: setCinemaBars },
                  { label: "Motion Blur Trails", val: motionBlurTrails, set: setMotionBlurTrails },
                  { label: "Beat Flash Cuts", val: flashBeats, set: setFlashBeats },
                  { label: "RGB Chromatic Split", val: chromaticSplit, set: setChromaticSplit },
                  { label: "Floor Reflection", val: floorReflection, set: setFloorReflection },
                  { label: "Kinetic Shot Titles", val: kineticText, set: setKineticText },
                  { label: "Brand Kit Colors", val: useBrandKit, set: setUseBrandKit },
                ].map((fx) => (
                  <label
                    key={fx.label}
                    className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer"
                  >
                    <span>{fx.label}</span>
                    <input
                      type="checkbox"
                      checked={fx.val}
                      onChange={(e) => fx.set(e.target.checked)}
                      className="accent-[#2563EB]"
                    />
                  </label>
                ))}
              </div>
            </>
          )}

          {inspectorTab === "shot" && activeShot && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-zinc-200">
                  Shot 0{activeShotIndex + 1} Settings
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCropShotIndex(activeShotIndex)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#181820] hover:bg-[#22222C] border border-[#282834] text-[10px] font-medium text-[#60A5FA] cursor-pointer"
                  >
                    <Crop className="w-3 h-3" />
                    Crop Shot
                  </button>
                  {(activeShot.focusX !== undefined || activeShot.focusY !== undefined) && (
                    <button
                      type="button"
                      onClick={() =>
                        onChangeShots((prev) =>
                          prev.map((s, i) =>
                            i === activeShotIndex ? { ...s, focusX: undefined, focusY: undefined } : s
                          )
                        )
                      }
                      className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Center Focus
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Shot Label</label>
                <input
                  type="text"
                  value={activeShot.label}
                  onChange={(e) =>
                    onChangeShots((prev) =>
                      prev.map((s, i) => (i === activeShotIndex ? { ...s, label: e.target.value } : s))
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Lower-Third Caption</label>
                <textarea
                  rows={2}
                  value={activeShot.caption}
                  onChange={(e) =>
                    onChangeShots((prev) =>
                      prev.map((s, i) =>
                        i === activeShotIndex ? { ...s, caption: e.target.value } : s
                      )
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-md bg-[#16161C] border border-[#24242E] text-xs text-white resize-none"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Crosshair className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Click-to-Focus Zoom Target
                  </span>
                  <span className="text-[10px] font-mono-tabular text-zinc-400">
                    {Math.round((activeShot.focusX ?? 0.5) * 100)}%,{" "}
                    {Math.round((activeShot.focusY ?? 0.5) * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500">
                  Click anywhere on this screenshot to zoom & click that exact feature in Act 3.
                </p>

                <div
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const fx = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
                    const fy = Math.max(0.08, Math.min(0.92, (e.clientY - rect.top) / rect.height));
                    onChangeShots((prev) =>
                      prev.map((s, i) =>
                        i === activeShotIndex ? { ...s, focusX: fx, focusY: fy } : s
                      )
                    );
                    setCursorSpotlight(true);
                  }}
                  className="relative rounded-lg overflow-hidden border border-[#2C2C38] bg-[#07080C] cursor-crosshair aspect-video"
                >
                  <img
                    src={activeShot.imageSrc}
                    alt={activeShot.label}
                    style={{ filter: filmLookCssFilter }}
                    className="w-full h-full object-contain"
                  />
                  <span
                    className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-[#60A5FA] bg-[#2563EB]/30 shadow-lg pointer-events-none"
                    style={{
                      left: `${(activeShot.focusX ?? 0.5) * 100}%`,
                      top: `${(activeShot.focusY ?? 0.5) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pinned Export Footer (bottom safe clearance for host preview badges) */}
        <div className="p-3.5 pb-20 border-t border-[#1E1E24] bg-[#0D0D11] space-y-2 shrink-0">
          {exportState.active ? (
            <button
              type="button"
              onClick={() => {
                cancelExportRef.current = true;
                if (recorderRef.current && recorderRef.current.state !== "inactive") {
                  recorderRef.current.stop();
                }
                setExportState({ active: false, kind: null, pct: 0 });
                setIsPlaying(true);
              }}
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
                  WebM ({duration}s)
                </button>
                <button
                  type="button"
                  onClick={() => handleVideoExport("mp4")}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#181820] hover:bg-[#22222D] border border-[#2A2A35] text-xs font-semibold text-zinc-100 cursor-pointer whitespace-nowrap"
                >
                  <Video className="w-3.5 h-3.5 text-[#60A5FA]" />
                  MP4 ({duration}s)
                </button>
              </div>
              <button
                type="button"
                onClick={handleGifExport}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#F4F4F6] hover:bg-white text-xs font-semibold text-[#0A0A0C] cursor-pointer whitespace-nowrap"
              >
                <Film className="w-3.5 h-3.5" />
                Export Short Film GIF
              </button>
            </>
          )}
        </div>
      </aside>

      <ImageCropModal
        open={cropShotIndex !== null && Boolean(shots[cropShotIndex])}
        imageSrc={
          cropShotIndex !== null && shots[cropShotIndex] ? shots[cropShotIndex].imageSrc : ""
        }
        title={
          cropShotIndex !== null
            ? `Crop & Auto-Fit Shot 0${cropShotIndex + 1}`
            : "Crop & Auto-Fit Shot"
        }
        targetFrameAspect={
          phoneFormatMode || effectivePreset.frameStyle === "iphone" ? 0.5 : 16 / 10
        }
        targetFrameLabel={
          phoneFormatMode || effectivePreset.frameStyle === "iphone" ? "iPhone" : "Frame"
        }
        onApplyCrop={(croppedUrl, croppedRatio) => {
          if (cropShotIndex === null) return;
          const idx = cropShotIndex;
          onChangeShots((prev) =>
            prev.map((s, i) =>
              i === idx ? { ...s, imageSrc: croppedUrl, focusX: 0.5, focusY: 0.5 } : s
            )
          );
          setMockupScale(100);
          if (phoneFormatMode || effectivePreset.frameStyle === "iphone") {
            setPhoneFitMode(croppedRatio <= 1.08 ? "pan" : "fit");
          }
          onNotify(`Cropped Shot 0${idx + 1} & auto-fitted into frame`);
        }}
        onClose={() => setCropShotIndex(null)}
      />
    </div>
  );
};
