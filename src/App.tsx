import { useCallback, useEffect, useRef, useState } from "react";
import { GuideView } from "./components/GuideView";
import { LeftToolbar } from "./components/LeftToolbar";
import { MockupCanvas } from "./components/MockupCanvas";
import { RightInspector } from "./components/RightInspector";
import { TemplatesView } from "./components/TemplatesView";
import { APP_CONFIG } from "./config";
import { INITIAL_STUDIO_STATE, SAMPLE_MOCKUPS, SceneTemplate } from "./data/presets";
import { AppView, MockupContentData, SampleId, StudioState } from "./types/studio";
import { copyElementToClipboard, exportElementToImage } from "./utils/exportCanvas";

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("studio");
  const [state, setState] = useState<StudioState>(INITIAL_STUDIO_STATE);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [notice, setNotice] = useState<{ text: string; type: "info" | "error" } | null>(null);

  const exportRef = useRef<HTMLDivElement | null>(null);

  const showNotice = useCallback((text: string, type: "info" | "error" = "info") => {
    setNotice({ text, type });
    window.setTimeout(() => {
      setNotice((current) => (current?.text === text ? null : current));
    }, 3200);
  }, []);

  const updateState = useCallback((patch: Partial<StudioState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateMockupData = useCallback(
    <K extends keyof MockupContentData>(scene: K, patch: Partial<MockupContentData[K]>) => {
      setState((prev) => ({
        ...prev,
        mockupData: {
          ...prev.mockupData,
          [scene]: {
            ...prev.mockupData[scene],
            ...patch,
          },
        },
      }));
    },
    []
  );

  const handleUploadFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setState((prev) => ({
            ...prev,
            imageSrc: reader.result as string,
            imageName: file.name || "uploaded-screenshot.png",
            activeSampleId: null,
          }));
          setActiveView("studio");
          showNotice(`Loaded ${file.name || "image"} onto canvas`);
        }
      };
      reader.readAsDataURL(file);
    },
    [showNotice]
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
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleUploadFile]);

  const handleSelectSample = (sampleId: SampleId) => {
    const sample = SAMPLE_MOCKUPS[sampleId];
    updateState({
      imageSrc: sample.src,
      imageName: `${sampleId}-sample.svg`,
      activeSampleId: sampleId,
      frame: sample.recommendedFrame,
    });
  };

  const handleApplyTemplate = (template: SceneTemplate) => {
    setState((prev) => ({
      ...prev,
      ...template.patch,
    }));
    setActiveView("studio");
    showNotice(`Applied "${template.name}" template`);
  };

  const handleExportDownload = async () => {
    if (!exportRef.current) {
      setActiveView("studio");
      showNotice("Switched to Studio — click Export again to download.", "info");
      return;
    }

    try {
      setIsExporting(true);
      await new Promise((r) => setTimeout(r, 30));
      await exportElementToImage(
        exportRef.current,
        state.exportFormat,
        state.exportScale,
        state.imageName
      );
      showNotice(`Exported ${state.exportScale}x ${state.exportFormat.toUpperCase()} image`);
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

  const navItems: { id: AppView; label: string }[] = [
    { id: "studio", label: "Studio" },
    { id: "templates", label: "Templates" },
    { id: "guide", label: "Guide" },
  ];

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#0A0A0C] text-[#F4F4F6] lg:overflow-hidden">
      {/* Top Bar — Strict 3-Zone Contract */}
      <header className="h-14 shrink-0 flex items-center justify-between gap-8 px-5 border-b border-[#1E1E24] bg-[#0B0B0E]">
        <button
          type="button"
          onClick={() => setActiveView("studio")}
          className="font-display text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          {APP_CONFIG.appName}
        </button>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
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

        <div className="flex items-center shrink-0">
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportDownload}
            className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white transition-colors disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isExporting ? "Exporting..." : "Export PNG"}
          </button>
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
            onUpdate={updateState}
            onUploadFile={handleUploadFile}
            onSelectSample={handleSelectSample}
            onOpenTemplates={() => setActiveView("templates")}
          />
          <MockupCanvas
            state={state}
            isExporting={isExporting}
            exportRef={exportRef}
            onUpdate={updateState}
            onUpdateMockupData={updateMockupData}
            onUploadFile={handleUploadFile}
            onResetStudio={() => setState(INITIAL_STUDIO_STATE)}
          />
          <RightInspector
            state={state}
            isExporting={isExporting}
            copiedSuccess={copiedSuccess}
            onUpdate={updateState}
            onExportDownload={handleExportDownload}
            onExportCopy={handleExportCopy}
          />
        </main>
      )}

      {activeView === "templates" && <TemplatesView onApplyTemplate={handleApplyTemplate} />}

      {activeView === "guide" && <GuideView onOpenStudio={() => setActiveView("studio")} />}

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
