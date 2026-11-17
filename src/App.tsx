import { SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { Undo2, Redo2 } from "lucide-react";
import { BrandKitPanel } from "./components/BrandKitPanel";
import { CarouselBuilderView } from "./components/CarouselBuilderView";
import { GuideView } from "./components/GuideView";
import { LeftToolbar } from "./components/LeftToolbar";
import { MockupCanvas } from "./components/MockupCanvas";
import { MotionStudioView } from "./components/MotionStudioView";
import { RightInspector } from "./components/RightInspector";
import { createDefaultShortFilmShots, ShortFilmStudioView } from "./components/ShortFilmStudioView";
import { TemplatesView } from "./components/TemplatesView";
import { APP_CONFIG } from "./config";
import {
  ASPECT_RATIO_OPTIONS,
  INITIAL_STUDIO_STATE,
  SAMPLE_MOCKUPS,
  SceneTemplate,
  SOCIAL_EXPORT_PRESETS,
} from "./data/presets";
import {
  AppView,
  BrandKit,
  MockupContentData,
  SampleId,
  ShortFilmShot,
  SocialExportPreset,
  SocialExportPresetId,
  StudioState,
} from "./types/studio";
import {
  applyBrandKitToStudioState,
  loadBrandKit,
  saveBrandKit,
} from "./utils/brandKitStorage";
import { copyElementToClipboard, exportElementToImage } from "./utils/exportCanvas";
import { useGlobalHistory } from "./hooks/useGlobalHistory";

const COALESCEABLE_STUDIO_KEYS = new Set<keyof StudioState>([
  "padding",
  "borderRadius",
  "scale",
  "grainOpacity",
  "rotateX",
  "rotateY",
  "rotateZ",
  "customSolidColor",
  "captionTitle",
  "captionSubtitle",
  "captionEyebrow",
  "browserUrl",
  "windowTitle",
]);

function describeStudioPatch(patch: Partial<StudioState>): string {
  const keys = Object.keys(patch) as (keyof StudioState)[];
  if (keys.includes("aspectRatio") || keys.includes("safeZoneId")) return "Canvas dimensions";
  if (keys.includes("tiltPreset") || keys.includes("rotateX") || keys.includes("rotateY") || keys.includes("rotateZ")) {
    return "Mockup 3D position";
  }
  if (keys.includes("padding") || keys.includes("scale")) return "Mockup layout";
  if (keys.includes("frame")) return "Device frame";
  if (keys.includes("backgroundId") || keys.includes("customSolidColor") || keys.includes("customBgImage") || keys.includes("pattern")) {
    return "Canvas backdrop";
  }
  if (keys.includes("imageFilter")) return "Image filter";
  if (keys.includes("imageSrc")) return "Mockup image";
  if (keys.some((k) => k.startsWith("caption"))) return "Caption styling";
  return "Canvas edit";
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("studio");
  const [brandKitOpen, setBrandKitOpen] = useState(false);

  const {
    present,
    entries: historyEntries,
    currentIndex: historyIndex,
    commit,
    undo,
    redo,
    jumpTo,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    undoCount,
  } = useGlobalHistory(() => {
    const initialBrandKit = loadBrandKit();
    return {
      brandKit: initialBrandKit,
      studioState: applyBrandKitToStudioState(INITIAL_STUDIO_STATE, initialBrandKit),
      shortFilmShots: createDefaultShortFilmShots(),
    };
  });

  const { studioState: state, brandKit, shortFilmShots } = present;

  const [isExporting, setIsExporting] = useState(false);
  const [activePresetExportingId, setActivePresetExportingId] =
    useState<SocialExportPresetId | "all" | null>(null);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: "info" | "error" } | null>(null);

  const exportRef = useRef<HTMLDivElement | null>(null);

  // Keep Brand Kit persisted in localStorage across all commits, undos, and redos
  useEffect(() => {
    saveBrandKit(brandKit);
  }, [brandKit]);

  const showNotice = useCallback((text: string, type: "info" | "error" = "info") => {
    setNotice({ text, type });
    window.setTimeout(() => {
      setNotice((current) => (current?.text === text ? null : current));
    }, 3200);
  }, []);

  const handleUndo = useCallback(() => {
    const label = undo();
    if (label) {
      showNotice(`Undid: ${label}`);
    }
  }, [showNotice, undo]);

  const handleRedo = useCallback(() => {
    const label = redo();
    if (label) {
      showNotice(`Redid: ${label}`);
    }
  }, [redo, showNotice]);

  const handleJumpToHistory = useCallback(
    (index: number) => {
      const result = jumpTo(index);
      if (result) {
        showNotice(
          result.direction === "back"
            ? `Reverted to #${index}: ${result.label}`
            : `Restored #${index}: ${result.label}`
        );
      }
    },
    [jumpTo, showNotice]
  );

  // Global keyboard shortcuts (Ctrl/Cmd+Z for Undo, Ctrl/Cmd+Shift+Z or Ctrl+Y for Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTextInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (isTextInput) {
        const inputType = (target as HTMLInputElement).type;
        if (inputType !== "range" && inputType !== "color" && inputType !== "checkbox") {
          return;
        }
      }

      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        if (canUndo) {
          e.preventDefault();
          handleUndo();
        }
      } else if ((key === "z" && e.shiftKey) || (key === "y" && !e.shiftKey)) {
        if (canRedo) {
          e.preventDefault();
          handleRedo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canRedo, canUndo, handleRedo, handleUndo]);

  const handleUpdateBrandKit = useCallback(
    (next: BrandKit) => {
      const changedKeys = (Object.keys(next) as (keyof BrandKit)[]).filter(
        (k) => next[k] !== brandKit[k]
      );
      if (changedKeys.length === 0) return;

      const singleKey = changedKeys.length === 1 ? changedKeys[0] : null;
      const coalesceKey =
        singleKey &&
        (singleKey === "brandName" ||
          singleKey === "domainBadge" ||
          singleKey === "primaryColor" ||
          singleKey === "secondaryAccent")
          ? `brandkit:${singleKey}`
          : undefined;

      commit(
        (curr) => ({
          ...curr,
          brandKit: next,
        }),
        {
          label: "Brand Kit settings",
          coalesceKey,
        }
      );
    },
    [brandKit, commit]
  );

  const handleApplyBrandKitToWorkspace = useCallback(() => {
    commit(
      (curr) => ({
        ...curr,
        studioState: applyBrandKitToStudioState(curr.studioState, curr.brandKit),
      }),
      { label: "Apply Brand DNA" }
    );
    showNotice(`Applied "${brandKit.brandName}" Brand DNA across Studio, Templates & Motion`);
  }, [brandKit.brandName, commit, showNotice]);

  const updateState = useCallback(
    (patch: Partial<StudioState>) => {
      const keys = Object.keys(patch) as (keyof StudioState)[];
      if (keys.length === 0) return;
      const coalesceKey =
        keys.length === 1 && COALESCEABLE_STUDIO_KEYS.has(keys[0])
          ? `studio:${keys[0]}`
          : undefined;

      commit(
        (curr) => ({
          ...curr,
          studioState: { ...curr.studioState, ...patch },
        }),
        {
          label: describeStudioPatch(patch),
          coalesceKey,
        }
      );
    },
    [commit]
  );

  const updateMockupData = useCallback(
    <K extends keyof MockupContentData>(scene: K, patch: Partial<MockupContentData[K]>) => {
      const keys = Object.keys(patch).join(",");
      commit(
        (curr) => ({
          ...curr,
          studioState: {
            ...curr.studioState,
            mockupData: {
              ...curr.studioState.mockupData,
              [scene]: {
                ...curr.studioState.mockupData[scene],
                ...patch,
              },
            },
          },
        }),
        {
          label: "Mockup text & data",
          coalesceKey: `mockup:${scene}:${keys}`,
        }
      );
    },
    [commit]
  );

  const handleChangeShortFilmShots = useCallback(
    (updater: SetStateAction<ShortFilmShot[]>) => {
      commit(
        (curr) => ({
          ...curr,
          shortFilmShots:
            typeof updater === "function" ? updater(curr.shortFilmShots) : updater,
        }),
        { label: "Short Film shots" }
      );
    },
    [commit]
  );

  const handleUploadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          const dataUrl = reader.result;
          if (activeView === "short-film") {
            const cleanBase = (file.name || "Scene")
              .replace(/\.[^/.]+$/, "")
              .replace(/[-_]+/g, " ")
              .trim();
            commit(
              (curr) => {
                const nextIndex = curr.shortFilmShots.length + 1;
                const newShot: ShortFilmShot = {
                  id: `shot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  imageSrc: dataUrl,
                  label: cleanBase ? cleanBase.slice(0, 22) : `Shot ${nextIndex}`,
                  caption: `Scene ${nextIndex} — pasted directly into Short Film timeline.`,
                };
                showNotice(`Added screenshot #${nextIndex} to Short Film storyboard`);
                return {
                  ...curr,
                  shortFilmShots: [...curr.shortFilmShots, newShot],
                };
              },
              { label: "Add Short Film shot" }
            );
            return;
          }

          commit(
            (curr) => ({
              ...curr,
              studioState: {
                ...curr.studioState,
                imageSrc: dataUrl,
                imageName: file.name || "uploaded-screenshot.png",
                activeSampleId: null,
              },
            }),
            { label: "Upload screenshot" }
          );
          if (activeView !== "motion") {
            setActiveView("studio");
          }
          showNotice(`Loaded ${file.name || "image"} onto canvas`);
        }
      };
      reader.readAsDataURL(file);
    },
    [activeView, commit, showNotice]
  );

  // Global clipboard paste support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            handleUploadFile(blob);
            if (activeView !== "short-film") {
              break;
            }
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeView, handleUploadFile]);

  const handleSelectSample = (sampleId: SampleId) => {
    const sample = SAMPLE_MOCKUPS[sampleId];
    commit(
      (curr) => ({
        ...curr,
        studioState: {
          ...curr.studioState,
          imageSrc: sample.src,
          imageName: `${sampleId}-sample.svg`,
          activeSampleId: sampleId,
          frame: sample.recommendedFrame,
        },
      }),
      { label: `Sample: ${sample.label}` }
    );
  };

  const handleApplyTemplate = (template: SceneTemplate, asPhoneFormat = false) => {
    commit(
      (curr) => {
        const merged: StudioState = {
          ...curr.studioState,
          ...template.patch,
          ...(asPhoneFormat
            ? {
                frame: "iphone",
                aspectRatio: "9:16",
                padding: 36,
                scale: 94,
              }
            : {}),
          safeZoneId: "none",
          showSafeZone: false,
        };
        return {
          ...curr,
          studioState: curr.brandKit.autoApplyTemplates
            ? applyBrandKitToStudioState(merged, curr.brandKit)
            : merged,
        };
      },
      {
        label: asPhoneFormat
          ? `Template (Phone): ${template.name}`
          : `Template: ${template.name}`,
      }
    );
    setActiveView("studio");
    showNotice(
      asPhoneFormat
        ? `Applied "${template.name}" in Phone Format (9:16)`
        : `Applied "${template.name}" template`
    );
  };

  const handleExportDownload = async () => {
    if (!exportRef.current) {
      setActiveView("studio");
      showNotice("Switched to Studio — click Export again to download.", "info");
      return;
    }

    const activeRatioOpt = ASPECT_RATIO_OPTIONS.find((r) => r.id === state.aspectRatio);

    try {
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 30));
      await exportElementToImage(
        exportRef.current,
        state.exportFormat,
        state.exportScale,
        state.imageName,
        activeRatioOpt?.pixelSpec
      );
      showNotice(
        activeRatioOpt?.pixelSpec
          ? `Exported ${activeRatioOpt.pixelSpec.width}×${activeRatioOpt.pixelSpec.height} ${state.exportFormat.toUpperCase()}`
          : `Exported ${state.exportScale}x ${state.exportFormat.toUpperCase()} image`
      );
    } catch {
      showNotice("Export failed. Try lowering export scale to 2x.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCopy = async () => {
    if (!exportRef.current) return;
    try {
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 30));
      await copyElementToClipboard(exportRef.current, state.exportScale);
      setCopiedSuccess(true);
      showNotice("Mockup copied to clipboard");
      window.setTimeout(() => setCopiedSuccess(false), 2000);
    } catch {
      showNotice("Clipboard blocked by browser permissions — use Download instead.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewSocialPreset = useCallback(
    (preset: SocialExportPreset) => {
      commit(
        (curr) => ({
          ...curr,
          studioState: {
            ...curr.studioState,
            aspectRatio: preset.aspectRatio,
            safeZoneId: preset.safeZoneId,
            showSafeZone: true,
            padding: preset.recommendedPadding,
            scale: preset.recommendedScale,
          },
        }),
        { label: `Preset: ${preset.name}` }
      );
      showNotice(
        `Applied ${preset.name} (${preset.pixelSpec.width}×${preset.pixelSpec.height}) with safe-zone guide`
      );
    },
    [commit, showNotice]
  );

  const handleExportSocialPreset = useCallback(
    async (preset: SocialExportPreset) => {
      if (!exportRef.current) return;
      try {
        setIsExporting(true);
        setActivePresetExportingId(preset.id);
        commit(
          (curr) => ({
            ...curr,
            studioState: {
              ...curr.studioState,
              aspectRatio: preset.aspectRatio,
              safeZoneId: preset.safeZoneId,
              showSafeZone: true,
              padding: preset.recommendedPadding,
              scale: preset.recommendedScale,
            },
          }),
          { label: `Preset: ${preset.name}` }
        );
        await new Promise((r) => setTimeout(r, 90));
        await exportElementToImage(
          exportRef.current,
          state.exportFormat,
          state.exportScale,
          state.imageName,
          preset.pixelSpec,
          preset.fileTag
        );
        showNotice(
          `Exported ${preset.name} (${preset.pixelSpec.width}×${preset.pixelSpec.height}) with safe-zone framing`
        );
      } catch {
        showNotice(`Failed to export ${preset.name} preset.`, "error");
      } finally {
        setActivePresetExportingId(null);
        setIsExporting(false);
      }
    },
    [commit, showNotice, state.exportFormat, state.exportScale, state.imageName]
  );

  const handleExportAllSocialPresets = useCallback(async () => {
    if (!exportRef.current) return;
    const originalSnapshot = {
      aspectRatio: state.aspectRatio,
      safeZoneId: state.safeZoneId,
      showSafeZone: state.showSafeZone,
      padding: state.padding,
      scale: state.scale,
    };

    try {
      setIsExporting(true);
      setActivePresetExportingId("all");
      for (const preset of SOCIAL_EXPORT_PRESETS) {
        commit(
          (curr) => ({
            ...curr,
            studioState: {
              ...curr.studioState,
              aspectRatio: preset.aspectRatio,
              safeZoneId: preset.safeZoneId,
              showSafeZone: true,
              padding: preset.recommendedPadding,
              scale: preset.recommendedScale,
            },
          }),
          { record: false }
        );
        await new Promise((r) => setTimeout(r, 110));
        if (!exportRef.current) break;
        await exportElementToImage(
          exportRef.current,
          state.exportFormat,
          state.exportScale,
          state.imageName,
          preset.pixelSpec,
          preset.fileTag
        );
        await new Promise((r) => setTimeout(r, 160));
      }
      commit(
        (curr) => ({
          ...curr,
          studioState: {
            ...curr.studioState,
            ...originalSnapshot,
          },
        }),
        { record: false }
      );
      showNotice("Exported LinkedIn, X (Twitter), and Instagram Story versions");
    } catch {
      showNotice("Batch preset export failed. Try exporting an individual preset.", "error");
    } finally {
      setActivePresetExportingId(null);
      setIsExporting(false);
    }
  }, [
    commit,
    showNotice,
    state.aspectRatio,
    state.exportFormat,
    state.exportScale,
    state.imageName,
    state.padding,
    state.safeZoneId,
    state.scale,
    state.showSafeZone,
  ]);

  const navItems: { id: AppView; label: string }[] = [
    { id: "studio", label: "Studio" },
    { id: "short-film", label: "Short Film" },
    { id: "motion", label: "Motion" },
    { id: "carousel", label: "Carousel" },
    { id: "templates", label: "Templates" },
    { id: "guide", label: "Guide" },
  ];

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#0A0A0C] text-[#F4F4F6] lg:overflow-hidden">
      {/* Top Bar — Strict 3-Zone Contract */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-6 px-5 border-b border-[#1E1E24] bg-[#0B0B0E]">
        <button
          type="button"
          onClick={() => setActiveView("studio")}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          {brandKit.brandName || APP_CONFIG.appName}
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navItems.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveView(item.id)}
                className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                  active
                    ? "text-white border-b-2 border-[#3B82F6]"
                    : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* Global Undo / Redo Controls */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[#141419] border border-[#24242E]">
            <button
              type="button"
              disabled={!canUndo}
              onClick={handleUndo}
              title={undoLabel ? `Undo: ${undoLabel} (Ctrl+Z)` : "Nothing to undo (Ctrl+Z)"}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              {undoCount > 0 && (
                <span className="hidden sm:inline text-[10px] font-mono-tabular text-zinc-400">
                  {undoCount}
                </span>
              )}
            </button>
            <button
              type="button"
              disabled={!canRedo}
              onClick={handleRedo}
              title={
                redoLabel
                  ? `Redo: ${redoLabel} (Ctrl+Shift+Z)`
                  : "Nothing to redo (Ctrl+Shift+Z)"
              }
              className="p-1.5 rounded-md text-zinc-300 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeView === "studio" ? (
            <button
              type="button"
              disabled={isExporting}
              onClick={handleExportDownload}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isExporting ? "Exporting..." : "Export PNG"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setBrandKitOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Brand Kit
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Strip */}
      <div className="flex md:hidden items-center gap-1 px-4 py-2 border-b border-[#1E1E24] bg-[#0E0E12] overflow-x-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveView(item.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 ${
              activeView === item.id
                ? "bg-[#1C1C24] text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Main Viewport */}
      {activeView === "studio" && (
        <main className="flex-1 flex flex-col lg:flex-row min-h-0">
          <LeftToolbar
            state={state}
            brandKit={brandKit}
            onUpdate={updateState}
            onUploadFile={handleUploadFile}
            onSelectSample={handleSelectSample}
            onOpenTemplates={() => setActiveView("templates")}
            onOpenBrandKit={() => setBrandKitOpen(true)}
          />
          <MockupCanvas
            state={state}
            brandKit={brandKit}
            isExporting={isExporting}
            exportRef={exportRef}
            onUpdate={updateState}
            onUpdateMockupData={updateMockupData}
            onUploadFile={handleUploadFile}
            onResetStudio={() =>
              commit(
                (curr) => ({
                  ...curr,
                  studioState: applyBrandKitToStudioState(INITIAL_STUDIO_STATE, curr.brandKit),
                }),
                { label: "Reset Studio canvas" }
              )
            }
          />
          <RightInspector
            state={state}
            isExporting={isExporting}
            copiedSuccess={copiedSuccess}
            activePresetExportingId={activePresetExportingId}
            historyEntries={historyEntries}
            historyIndex={historyIndex}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onJumpToHistory={handleJumpToHistory}
            onUpdate={updateState}
            onExportDownload={handleExportDownload}
            onExportCopy={handleExportCopy}
            onPreviewSocialPreset={handlePreviewSocialPreset}
            onExportSocialPreset={handleExportSocialPreset}
            onExportAllSocialPresets={handleExportAllSocialPresets}
          />
        </main>
      )}

      {activeView === "short-film" && (
        <ShortFilmStudioView
          brandKit={brandKit}
          shots={shortFilmShots}
          onChangeShots={handleChangeShortFilmShots}
          onOpenBrandKit={() => setBrandKitOpen(true)}
          onNotify={showNotice}
        />
      )}

      {activeView === "motion" && (
        <MotionStudioView
          imageSrc={state.imageSrc}
          imageName={state.imageName}
          brandKit={brandKit}
          onUploadFile={handleUploadFile}
          onOpenBrandKit={() => setBrandKitOpen(true)}
          onNotify={showNotice}
        />
      )}

      {activeView === "carousel" && (
        <CarouselBuilderView
          brandKit={brandKit}
          mockupData={state.mockupData}
          onUpdateMockupData={updateMockupData}
          onOpenBrandKit={() => setBrandKitOpen(true)}
          onNotify={showNotice}
        />
      )}

      {activeView === "templates" && <TemplatesView onApplyTemplate={handleApplyTemplate} />}

      {activeView === "guide" && <GuideView onOpenStudio={() => setActiveView("studio")} />}

      {/* Brand Kit DNA Modal */}
      <BrandKitPanel
        open={brandKitOpen}
        brandKit={brandKit}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onChange={handleUpdateBrandKit}
        onApplyToWorkspace={handleApplyBrandKitToWorkspace}
        onClose={() => setBrandKitOpen(false)}
      />

      {/* Non-blocking Toast Feedback */}
      {notice && (
        <div
          role="status"
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-xs font-medium border shadow-xl transition-opacity ${
            notice.type === "error"
              ? "bg-red-950/90 border-red-700/60 text-red-100"
              : "bg-[#18181F]/95 border-[#2C2C38] text-zinc-100"
          }`}
        >
          {notice.text}
        </div>
      )}
    </div>
  );
}
