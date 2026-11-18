import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  Lock,
  Sparkles,
  X,
} from "lucide-react";
import { AppView } from "../types/studio";

interface TourStep {
  id: string;
  view: AppView;
  shortLabel: string;
  title: string;
  description: string;
  tryHint: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "studio",
    view: "studio",
    shortLabel: "1. Studio",
    title: "3D Mockup Studio & Sample Scenes",
    description:
      "Click SaaS, Mobile, Code, Store, AI Chat, or Social samples on the left. Switch MacBook / iPhone / 3D Tilt, edit text inline, or click Fullscreen.",
    tryHint: "Try clicking 'Mobile' sample or switching Frame to iPhone in the right panel.",
  },
  {
    id: "motion",
    view: "motion",
    shortLabel: "2. Motion",
    title: "60fps Animated Motion Loops",
    description:
      "Explore 12+ automated camera rigs, backdrop particles, and Phone Format reels in real time — hit Fullscreen to watch cleanly without exporting.",
    tryHint: "Try clicking 'Phone Format' or any Motion Preset on the left.",
  },
  {
    id: "short-film",
    view: "short-film",
    shortLabel: "3. Short Film",
    title: "6-Act SaaS Launch Commercials",
    description:
      "See multi-shot brand spots with synchronized Beat SFX, Film Look color grading, and automated Brand Deal scripts.",
    tryHint: "Toggle 'Beat SFX' or click 'Remix' to generate a fresh cut.",
  },
  {
    id: "carousel",
    view: "carousel",
    shortLabel: "4. Carousel",
    title: "Continuous Multi-Slide Decks",
    description:
      "Test seamless LinkedIn 4:5 and Mobile 9:16 slide panoramas, toggle Brand / URL headers, and inspect full decks with Fit / 100% zoom.",
    tryHint: "Click any headline on a slide to edit it inline.",
  },
  {
    id: "templates",
    view: "templates",
    shortLabel: "5. Templates",
    title: "Ready-to-Launch Preset Gallery",
    description:
      "Apply any studio look in 1 click (including instant Phone Format conversion). Sign in when you are ready to swap in your own product screenshots.",
    tryHint: "Custom screenshot uploads unlock immediately after Sign In or Login.",
  },
];

interface PreviewTourBarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onOpenAuth: (reason?: string) => void;
}

export const PreviewTourBar: React.FC<PreviewTourBarProps> = ({
  activeView,
  onSelectView,
  onOpenAuth,
}) => {
  const [guideOpen, setGuideOpen] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);

  const currentStep = TOUR_STEPS[stepIdx] || TOUR_STEPS[0];

  const goToStep = (idx: number) => {
    const safeIdx = Math.max(0, Math.min(TOUR_STEPS.length - 1, idx));
    setStepIdx(safeIdx);
    setGuideOpen(true);
    onSelectView(TOUR_STEPS[safeIdx].view);
  };

  return (
    <>
      {/* Top Preview Mode Tour Strip */}
      <div className="shrink-0 bg-gradient-to-r from-[#0E1526] via-[#10182B] to-[#0E1526] border-b border-[#253559] px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#2563EB]/25 border border-[#3B82F6]/50 text-[10px] font-semibold text-blue-200 whitespace-nowrap">
            <Eye className="w-3 h-3 text-[#60A5FA]" />
            PREVIEW MODE · TOUR
          </span>

          <div className="hidden lg:flex items-center gap-1">
            {TOUR_STEPS.map((step, i) => {
              const isCurrent = activeView === step.view;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => goToStep(i)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isCurrent
                      ? "bg-[#2563EB] text-white"
                      : "text-zinc-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {step.shortLabel}
                </button>
              );
            })}
          </div>

          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-zinc-300">
            <Lock className="w-3 h-3 text-amber-400" />
            Exploring with sample assets · Sign in to upload your own screenshots
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#162038] hover:bg-[#1E2C4D] border border-[#2C3E6B] text-[11px] font-medium text-blue-100 cursor-pointer whitespace-nowrap"
          >
            <Compass className="w-3 h-3 text-[#60A5FA]" />
            {guideOpen ? "Hide Tour Card" : "Guided Tour"}
          </button>
          <button
            type="button"
            onClick={() =>
              onOpenAuth("Sign in or create an account to upload your own screenshots.")
            }
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-[11px] font-semibold text-white cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-3 h-3" />
            Sign In / Unlock Uploads
          </button>
        </div>
      </div>

      {/* Non-blocking Floating Guided Tour Coach Card */}
      {guideOpen && (
        <div className="fixed bottom-4 left-4 z-40 w-[330px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#2B3B60] bg-[#0D121F]/95 backdrop-blur-md p-4 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-mono-tabular font-semibold text-[#60A5FA]">
              <Sparkles className="w-3.5 h-3.5" />
              SAAS TOUR · STEP {stepIdx + 1} / {TOUR_STEPS.length}
            </div>
            <button
              type="button"
              onClick={() => setGuideOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5 cursor-pointer"
              title="Minimize tour card"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white">{currentStep.title}</h4>
            <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
              {currentStep.description}
            </p>
            <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-[#141D33] border border-[#243459] text-[10px] text-blue-200">
              {currentStep.tryHint}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={stepIdx === 0}
                onClick={() => goToStep(stepIdx - 1)}
                className="p-1.5 rounded-lg bg-[#161E31] border border-[#273556] text-zinc-300 hover:text-white disabled:opacity-35 cursor-pointer"
                title="Previous step"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {stepIdx < TOUR_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(stepIdx + 1)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E2A45] hover:bg-[#27375B] border border-[#344A7A] text-[11px] font-semibold text-white cursor-pointer"
                >
                  Next Stop
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    onOpenAuth("Ready to add your own product screenshot? Sign in or log in below.")
                  }
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-[11px] font-semibold text-white cursor-pointer"
                >
                  <Lock className="w-3 h-3" />
                  Sign In Now
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onOpenAuth("Sign in or log in to unlock custom screenshot uploads.")
              }
              className="text-[11px] font-semibold text-[#60A5FA] hover:text-blue-200 cursor-pointer"
            >
              Sign In / Login
            </button>
          </div>
        </div>
      )}
    </>
  );
};
