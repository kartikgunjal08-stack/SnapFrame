import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Crop, Maximize, RotateCcw, X } from "lucide-react";

interface CropBox {
  x: number; // normalized 0..1 relative to image width
  y: number; // normalized 0..1 relative to image height
  w: number; // normalized 0.08..1
  h: number; // normalized 0.08..1
}

type DragHandle = "move" | "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

interface ImageCropModalProps {
  open: boolean;
  imageSrc: string;
  title?: string;
  targetFrameAspect?: number;
  targetFrameLabel?: string;
  onApplyCrop: (croppedDataUrl: string, croppedAspectRatio: number) => void;
  onClose: () => void;
}

const MIN_BOX = 0.08;

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function buildCenteredCropForAspect(imgAspect: number, targetAspect: number): CropBox {
  // Normalized box where (w * imgW) / (h * imgH) = targetAspect  =>  (w / h) = targetAspect / imgAspect
  const normRatio = targetAspect / Math.max(0.05, imgAspect);
  let w: number;
  let h: number;
  if (normRatio >= 1) {
    w = 0.92;
    h = w / normRatio;
    if (h > 0.92) {
      h = 0.92;
      w = h * normRatio;
    }
  } else {
    h = 0.92;
    w = h * normRatio;
    if (w > 0.92) {
      w = 0.92;
      h = w / normRatio;
    }
  }
  w = clamp(w, MIN_BOX, 1);
  h = clamp(h, MIN_BOX, 1);
  return {
    x: (1 - w) / 2,
    y: (1 - h) / 2,
    w,
    h,
  };
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  open,
  imageSrc,
  title = "Crop & Auto-Fit Screenshot",
  targetFrameAspect,
  targetFrameLabel,
  onApplyCrop,
  onClose,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [natSize, setNatSize] = useState<{ w: number; h: number }>({ w: 1200, h: 750 });
  const [crop, setCrop] = useState<CropBox>({ x: 0, y: 0, w: 1, h: 1 });
  const [activeAspectId, setActiveAspectId] = useState<string>("free");
  const [lockedAspect, setLockedAspect] = useState<number | null>(null);
  const [applying, setApplying] = useState(false);

  const dragStateRef = useRef<{
    handle: DragHandle;
    startClientX: number;
    startClientY: number;
    startCrop: CropBox;
    stageW: number;
    stageH: number;
  } | null>(null);

  const imgAspect = natSize.w / Math.max(1, natSize.h);

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0.04, y: 0.04, w: 0.92, h: 0.92 });
    setActiveAspectId("free");
    setLockedAspect(null);
    setApplying(false);
  }, [open, imageSrc]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const aspectOptions = useMemo(() => {
    const base: { id: string; label: string; ratio: number | null }[] = [];
    if (targetFrameAspect && Number.isFinite(targetFrameAspect)) {
      base.push({
        id: "fit-frame",
        label: targetFrameLabel ? `Fit ${targetFrameLabel}` : "Fit Frame",
        ratio: targetFrameAspect,
      });
    }
    base.push(
      { id: "free", label: "Free", ratio: null },
      { id: "16:9", label: "16:9", ratio: 16 / 9 },
      { id: "16:10", label: "16:10", ratio: 16 / 10 },
      { id: "4:5", label: "4:5", ratio: 4 / 5 },
      { id: "1:1", label: "1:1", ratio: 1 },
      { id: "9:16", label: "9:16", ratio: 9 / 16 }
    );
    return base;
  }, [targetFrameAspect, targetFrameLabel]);

  const selectAspect = useCallback(
    (id: string, ratio: number | null) => {
      setActiveAspectId(id);
      setLockedAspect(ratio);
      if (ratio !== null) {
        setCrop(buildCenteredCropForAspect(imgAspect, ratio));
      }
    },
    [imgAspect]
  );

  const startDrag = (handle: DragHandle, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect || rect.width < 10 || rect.height < 10) return;

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore if capture not supported
    }

    dragStateRef.current = {
      handle,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCrop: { ...crop },
      stageW: rect.width,
      stageH: rect.height,
    };
  };

  useEffect(() => {
    if (!open) return;

    const onPointerMove = (e: PointerEvent) => {
      const ds = dragStateRef.current;
      if (!ds) return;

      const dx = (e.clientX - ds.startClientX) / ds.stageW;
      const dy = (e.clientY - ds.startClientY) / ds.stageH;
      const s = ds.startCrop;

      if (ds.handle === "move") {
        setCrop({
          x: clamp(s.x + dx, 0, 1 - s.w),
          y: clamp(s.y + dy, 0, 1 - s.h),
          w: s.w,
          h: s.h,
        });
        return;
      }

      let left = s.x;
      let top = s.y;
      let right = s.x + s.w;
      let bottom = s.y + s.h;

      if (ds.handle.includes("w")) left = clamp(s.x + dx, 0, right - MIN_BOX);
      if (ds.handle.includes("e")) right = clamp(s.x + s.w + dx, left + MIN_BOX, 1);
      if (ds.handle.includes("n")) top = clamp(s.y + dy, 0, bottom - MIN_BOX);
      if (ds.handle.includes("s")) bottom = clamp(s.y + s.h + dy, top + MIN_BOX, 1);

      let w = right - left;
      let h = bottom - top;

      if (lockedAspect !== null) {
        const normRatio = lockedAspect / Math.max(0.05, imgAspect);
        const horizontalPrimary =
          ds.handle === "e" || ds.handle === "w" || Math.abs(dx) >= Math.abs(dy);

        if (horizontalPrimary) {
          h = w / normRatio;
          if (ds.handle.includes("n")) {
            top = bottom - h;
            if (top < 0) {
              top = 0;
              h = bottom;
              w = h * normRatio;
              if (ds.handle.includes("w")) left = right - w;
              else right = left + w;
            }
          } else {
            bottom = top + h;
            if (bottom > 1) {
              bottom = 1;
              h = 1 - top;
              w = h * normRatio;
              if (ds.handle.includes("w")) left = right - w;
              else right = left + w;
            }
          }
        } else {
          w = h * normRatio;
          if (ds.handle.includes("w")) {
            left = right - w;
            if (left < 0) {
              left = 0;
              w = right;
              h = w / normRatio;
              if (ds.handle.includes("n")) top = bottom - h;
              else bottom = top + h;
            }
          } else {
            right = left + w;
            if (right > 1) {
              right = 1;
              w = 1 - left;
              h = w / normRatio;
              if (ds.handle.includes("n")) top = bottom - h;
              else bottom = top + h;
            }
          }
        }

        // Guard bounds cleanly
        left = clamp(left, 0, 1 - MIN_BOX);
        top = clamp(top, 0, 1 - MIN_BOX);
        w = clamp(right - left, MIN_BOX, 1 - left);
        h = clamp(w / normRatio, MIN_BOX, 1 - top);
        w = h * normRatio;
      }

      setCrop({ x: left, y: top, w, h });
    };

    const onPointerUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [imgAspect, lockedAspect, open]);

  if (!open) return null;

  const cropPxW = Math.max(1, Math.round(crop.w * natSize.w));
  const cropPxH = Math.max(1, Math.round(crop.h * natSize.h));

  const handleConfirmCrop = async () => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth <= 0) return;

    setApplying(true);
    try {
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const sx = crop.x * nw;
      const sy = crop.y * nh;
      const sw = Math.max(4, crop.w * nw);
      const sh = Math.max(4, crop.h * nh);

      // Upscale vector SVG or smaller screenshots so cropped exports remain razor sharp
      const targetMax = 1800;
      const upscale = sw < 1000 && sh < 1000 ? Math.min(3, targetMax / Math.max(sw, sh)) : 1;
      const outW = Math.max(16, Math.round(sw * upscale));
      const outH = Math.max(16, Math.round(sh * upscale));

      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const croppedUrl = canvas.toDataURL("image/png");
      onApplyCrop(croppedUrl, outW / Math.max(1, outH));
      onClose();
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92vh] rounded-2xl bg-[#101014] border border-[#262632] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#1E1E24] bg-[#0D0D11]">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB]/20 border border-[#3B82F6]/40 flex items-center justify-center shrink-0">
              <Crop className="w-3.5 h-3.5 text-[#60A5FA]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs sm:text-sm font-semibold text-white truncate">{title}</h2>
              <p className="text-[10.5px] text-zinc-400 truncate">
                Drag corners or edges to trim extra parts so it auto-fits cleanly inside your frame
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Aspect Ratio Quick Presets */}
        <div className="px-4 py-2.5 border-b border-[#1E1E24] bg-[#0F0F13] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 studio-scroll max-w-full">
            {aspectOptions.map((opt) => {
              const active = activeAspectId === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => selectAspect(opt.id, opt.ratio)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    active
                      ? opt.id === "fit-frame"
                        ? "bg-emerald-600/25 border-emerald-500 text-emerald-200"
                        : "bg-[#2563EB]/25 border-[#3B82F6] text-white"
                      : opt.id === "fit-frame"
                        ? "bg-emerald-950/35 border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/40"
                        : "bg-[#16161C] border-[#262632] text-zinc-300 hover:text-white"
                  }`}
                >
                  {opt.id === "fit-frame" && <Maximize className="w-3 h-3" />}
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10.5px] font-mono-tabular text-zinc-400">
              {cropPxW} × {cropPxH} px
            </span>
            <button
              type="button"
              onClick={() => {
                setActiveAspectId("free");
                setLockedAspect(null);
                setCrop({ x: 0, y: 0, w: 1, h: 1 });
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#16161C] hover:bg-[#22222C] border border-[#262632] text-[11px] text-zinc-300 cursor-pointer"
              title="Reset crop to full image"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>

        {/* Interactive Crop Stage */}
        <div className="flex-1 min-h-[240px] bg-[#07080B] p-4 sm:p-6 flex items-center justify-center overflow-hidden select-none">
          <div
            ref={stageRef}
            className="relative inline-block max-w-full max-h-[54vh] touch-none select-none shadow-2xl"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop target"
              crossOrigin={imageSrc.startsWith("http") ? "anonymous" : undefined}
              onLoad={(e) => {
                const el = e.currentTarget;
                if (el.naturalWidth > 0 && el.naturalHeight > 0) {
                  setNatSize({ w: el.naturalWidth, h: el.naturalHeight });
                }
              }}
              draggable={false}
              className="block max-w-full max-h-[54vh] w-auto h-auto pointer-events-none select-none rounded-sm"
            />

            {/* Dimmed outside overlays (Top, Bottom, Left, Right) */}
            <div
              className="pointer-events-none absolute left-0 right-0 top-0 bg-black/65"
              style={{ height: `${crop.y * 100}%` }}
            />
            <div
              className="pointer-events-none absolute left-0 right-0 bottom-0 bg-black/65"
              style={{ height: `${Math.max(0, 1 - crop.y - crop.h) * 100}%` }}
            />
            <div
              className="pointer-events-none absolute left-0 bg-black/65"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.h * 100}%`,
                width: `${crop.x * 100}%`,
              }}
            />
            <div
              className="pointer-events-none absolute right-0 bg-black/65"
              style={{
                top: `${crop.y * 100}%`,
                height: `${crop.h * 100}%`,
                width: `${Math.max(0, 1 - crop.x - crop.w) * 100}%`,
              }}
            />

            {/* Active Crop Selection Box */}
            <div
              onPointerDown={(e) => startDrag("move", e)}
              className="absolute border-2 border-[#3B82F6] cursor-move touch-none"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.35) inset",
              }}
            >
              {/* Rule of Thirds Grid */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
              </div>

              {/* 4 Corner Handles */}
              <div
                onPointerDown={(e) => startDrag("nw", e)}
                className="absolute -top-2 -left-2 w-4 h-4 rounded-sm bg-white border-2 border-[#2563EB] cursor-nwse-resize touch-none shadow"
              />
              <div
                onPointerDown={(e) => startDrag("ne", e)}
                className="absolute -top-2 -right-2 w-4 h-4 rounded-sm bg-white border-2 border-[#2563EB] cursor-nesw-resize touch-none shadow"
              />
              <div
                onPointerDown={(e) => startDrag("sw", e)}
                className="absolute -bottom-2 -left-2 w-4 h-4 rounded-sm bg-white border-2 border-[#2563EB] cursor-nesw-resize touch-none shadow"
              />
              <div
                onPointerDown={(e) => startDrag("se", e)}
                className="absolute -bottom-2 -right-2 w-4 h-4 rounded-sm bg-white border-2 border-[#2563EB] cursor-nwse-resize touch-none shadow"
              />

              {/* 4 Edge Handles */}
              <div
                onPointerDown={(e) => startDrag("n", e)}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-white border border-[#2563EB] cursor-ns-resize touch-none shadow"
              />
              <div
                onPointerDown={(e) => startDrag("s", e)}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-8 h-3 rounded-full bg-white border border-[#2563EB] cursor-ns-resize touch-none shadow"
              />
              <div
                onPointerDown={(e) => startDrag("w", e)}
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-8 rounded-full bg-white border border-[#2563EB] cursor-ew-resize touch-none shadow"
              />
              <div
                onPointerDown={(e) => startDrag("e", e)}
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-8 rounded-full bg-white border border-[#2563EB] cursor-ew-resize touch-none shadow"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1E1E24] bg-[#0D0D11] flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-400">
            Tip: Tap <strong className="text-emerald-300">Fit Frame</strong> to auto-match your active device aspect ratio.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg bg-[#181820] hover:bg-[#22222C] border border-[#282834] text-xs font-medium text-zinc-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={applying}
              onClick={handleConfirmCrop}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {applying ? "Cropping..." : "Crop & Auto-Fit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
