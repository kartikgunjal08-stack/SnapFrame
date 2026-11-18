import {
  BackdropPattern,
  BrandDealScript,
  BrandKit,
  FilmLookConfig,
  FilmLookId,
  MotionAspectId,
  PhoneFitMode,
  ShortFilmPreset,
  ShortFilmShot,
} from "../types/studio";
import { sanitizeHexColor } from "./brandKitStorage";

export interface FilmLookOption {
  id: FilmLookId;
  name: string;
  tag: string;
  swatch: string;
}

export const FILM_LOOK_PRESETS: FilmLookOption[] = [
  { id: "none", name: "Natural", tag: "Original", swatch: "linear-gradient(135deg, #334155, #0F172A)" },
  { id: "warm-tone", name: "Warm Tone", tag: "Golden", swatch: "linear-gradient(135deg, #F59E0B, #78350F)" },
  { id: "desaturated", name: "Desaturated", tag: "Matte", swatch: "linear-gradient(135deg, #64748B, #1E293B)" },
  { id: "high-contrast", name: "High Contrast", tag: "Punchy", swatch: "linear-gradient(135deg, #3B82F6, #020617)" },
  { id: "bleach-bypass", name: "Bleach Bypass", tag: "Silver", swatch: "linear-gradient(135deg, #94A3B8, #09090B)" },
  { id: "teal-amber", name: "Teal & Amber", tag: "Cinema", swatch: "linear-gradient(135deg, #0D9488, #B45309)" },
  { id: "noir-mono", name: "Noir Mono", tag: "B&W", swatch: "linear-gradient(135deg, #E4E4E7, #18181B)" },
];

export const DEFAULT_FILM_LOOK: FilmLookConfig = {
  id: "none",
  intensity: 85,
  vignette: 28,
  filmGrain: 15,
};

export function buildFilmLookCssFilter(config: FilmLookConfig): string {
  const k = Math.max(0, Math.min(1, config.intensity / 100));
  if (config.id === "none" || k <= 0.01) return "none";

  const lerp = (base: number, target: number) => (base + (target - base) * k).toFixed(2);

  switch (config.id) {
    case "warm-tone":
      return `sepia(${lerp(0, 0.34)}) saturate(${lerp(1, 1.24)}) contrast(${lerp(1, 1.08)}) brightness(${lerp(1, 1.03)})`;
    case "desaturated":
      return `saturate(${lerp(1, 0.38)}) contrast(${lerp(1, 1.14)}) brightness(${lerp(1, 0.97)})`;
    case "high-contrast":
      return `contrast(${lerp(1, 1.42)}) saturate(${lerp(1, 1.16)}) brightness(${lerp(1, 0.96)})`;
    case "bleach-bypass":
      return `saturate(${lerp(1, 0.32)}) contrast(${lerp(1, 1.54)}) brightness(${lerp(1, 0.92)}) sepia(${lerp(0, 0.1)})`;
    case "teal-amber":
      return `contrast(${lerp(1, 1.22)}) saturate(${lerp(1, 1.32)}) hue-rotate(${( -10 * k ).toFixed(1)}deg) sepia(${lerp(0, 0.14)})`;
    case "noir-mono":
      return `grayscale(${lerp(0, 1)}) contrast(${lerp(1, 1.42)}) brightness(${lerp(1, 0.96)})`;
    default:
      return "none";
  }
}

export const FILM_ASPECTS: Record<
  Exclude<MotionAspectId, "4:5">,
  { label: string; platform: string; width: number; height: number }
> = {
  "16:9": { label: "16:9", platform: "YouTube / X", width: 1280, height: 720 },
  "9:16": { label: "9:16", platform: "Reels / Shorts", width: 720, height: 1280 },
  "1:1": { label: "1:1", platform: "Feed Square", width: 1080, height: 1080 },
  "16:10": { label: "16:10", platform: "Product Hunt", width: 1280, height: 800 },
};

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function easeOutBack(t: number): number {
  const x = clamp01(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

function easeInOutQuart(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
}

function speedRamp(t: number, curve: ShortFilmPreset["speedCurve"]): number {
  const x = clamp01(t);
  if (curve === "hyper") return easeOutExpo(x);
  if (curve === "snap") {
    if (x < 0.28) return easeOutCubic(x / 0.28) * 0.65;
    if (x < 0.82) return 0.65 + ((x - 0.28) / 0.54) * 0.2;
    return 0.85 + easeInOutQuart((x - 0.82) / 0.18) * 0.15;
  }
  return easeInOutQuart(x);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawFilmBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  c1: string,
  c2: string,
  c3: string,
  pattern: BackdropPattern,
  globalProgress: number,
  particlesEnabled: boolean
) {
  const safeC1 = sanitizeHexColor(c1, "#2563EB");
  const safeC2 = sanitizeHexColor(c2, "#0F172A");
  const safeC3 = sanitizeHexColor(c3, "#05070D");

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, safeC3);
  grad.addColorStop(0.55, safeC2);
  grad.addColorStop(1, safeC3);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Moving dual ambient cinema orbs
  const lx = w * (0.25 + 0.5 * Math.sin(globalProgress * Math.PI * 3));
  const ly = h * (0.22 + 0.3 * Math.cos(globalProgress * Math.PI * 2));
  const glow = ctx.createRadialGradient(lx, ly, 12, lx, ly, Math.max(w, h) * 0.62);
  glow.addColorStop(0, safeC1);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  const rx = w * (0.75 - 0.4 * Math.cos(globalProgress * Math.PI * 2));
  const ry = h * (0.78 - 0.25 * Math.sin(globalProgress * Math.PI * 3));
  const glow2 = ctx.createRadialGradient(rx, ry, 10, rx, ry, Math.max(w, h) * 0.45);
  glow2.addColorStop(0, safeC1);
  glow2.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = 0.24;
  ctx.fillStyle = glow2;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  if (pattern === "dots") {
    ctx.fillStyle = "rgba(255,255,255,0.085)";
    const step = 30;
    for (let x = step; x < w; x += step) {
      for (let y = step; y < h; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === "grid") {
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    const step = 48;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  } else if (pattern === "rings") {
    ctx.strokeStyle = "rgba(255,255,255,0.065)";
    ctx.lineWidth = 1.2;
    const pulse = Math.sin(globalProgress * Math.PI * 6) * 14;
    for (let r = 80; r < Math.max(w, h); r += 76) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.max(10, r + pulse), 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (pattern === "spotlight") {
    const spot = ctx.createRadialGradient(w / 2, h * 0.45, 20, w / 2, h * 0.45, Math.max(w, h) * 0.55);
    spot.addColorStop(0, "rgba(255,255,255,0.14)");
    spot.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, w, h);
  }

  // Deterministic floating bokeh / sparks for luxury commercial depth
  if (particlesEnabled) {
    ctx.save();
    for (let i = 0; i < 24; i++) {
      const seed = (i * 137.5) % 100;
      const px = ((seed * 17.3 + globalProgress * (160 + (i % 5) * 45)) % (w + 40)) - 20;
      const py = ((i * 53.7 - globalProgress * (120 + (i % 4) * 35) + h * 4) % (h + 40)) - 20;
      const rad = 1.2 + (i % 3) * 1.1;
      ctx.globalAlpha = 0.14 + (i % 4) * 0.06;
      ctx.fillStyle = i % 3 === 0 ? c1 : "#FFFFFF";
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawShotCard(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | undefined,
  x: number,
  y: number,
  w: number,
  h: number,
  frameStyle: ShortFilmPreset["frameStyle"],
  domainLabel: string,
  titleLabel: string,
  accent: string,
  shimmerProgress: number,
  chromaticOffset = 0,
  cssFilter = "none",
  showBrandHeader = true,
  phoneFitMode: PhoneFitMode = "pan",
  focusX = 0.5,
  panProgress = 0
) {
  if (Math.abs(chromaticOffset) > 0.5) {
    ctx.save();
    ctx.globalAlpha *= 0.4;
    roundRect(ctx, x - chromaticOffset, y, w, h, 14);
    ctx.strokeStyle = "#EF4444";
    ctx.lineWidth = 3;
    ctx.stroke();
    roundRect(ctx, x + chromaticOffset, y, w, h, 14);
    ctx.strokeStyle = "#22D3EE";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.72)";
  ctx.shadowBlur = 44;
  ctx.shadowOffsetY = 20;

  if (frameStyle === "glass") {
    roundRect(ctx, x - 10, y - 10, w + 20, h + 20, 20);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x - 10, y - 10, w + 20, h + 20, 20);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  } else {
    const r = frameStyle === "iphone" ? 34 : 14;
    roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = frameStyle === "macos-light" ? "#F4F4F6" : "#0B0D12";
    ctx.fill();
    ctx.restore();
  }

  const radius = frameStyle === "iphone" ? 34 : 14;
  const chromeH =
    showBrandHeader &&
    (frameStyle === "macos-dark" || frameStyle === "macos-light" || frameStyle === "browser")
      ? 30
      : 0;

  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();

  if (showBrandHeader) {
    if (frameStyle === "macos-dark" || frameStyle === "macos-light") {
      const isLight = frameStyle === "macos-light";
      ctx.fillStyle = isLight ? "#F4F4F6" : "#1B1C22";
      ctx.fillRect(x, y, w, chromeH);
      ["#FF5F56", "#FFBD2E", "#27C93F"].forEach((dot, i) => {
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(x + 16 + i * 14, y + chromeH / 2, 4.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = isLight ? "#52525B" : "#94A3B8";
      ctx.font = "600 10.5px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(titleLabel, x + w / 2, y + 19);
    } else if (frameStyle === "browser") {
      ctx.fillStyle = "#16171C";
      ctx.fillRect(x, y, w, chromeH);
      const barW = Math.min(240, w * 0.45);
      roundRect(ctx, x + (w - barW) / 2, y + 5, barW, 20, 5);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();
      ctx.fillStyle = "#CBD5E1";
      ctx.font = "500 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(domainLabel, x + w / 2, y + 18);
    }
  }

  const contentY = y + chromeH;
  const contentH = h - chromeH;
  ctx.fillStyle = "#080A0F";
  ctx.fillRect(x, contentY, w, contentH);

  const imgRatio =
    img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
      ? img.naturalWidth / img.naturalHeight
      : 16 / 10;
  const isWideDesktopInPhone = frameStyle === "iphone" && imgRatio > 1.08;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const boxRatio = w / contentH;

    if (isWideDesktopInPhone) {
      if (phoneFitMode === "pan") {
        // Subtle ambient echo behind a balanced horizontal glide so text isn't over-zoomed
        const bgScale = Math.max(w / img.naturalWidth, contentH / img.naturalHeight) * 1.15;
        const bgW = img.naturalWidth * bgScale;
        const bgH = img.naturalHeight * bgScale;
        ctx.save();
        if ("filter" in ctx) {
          ctx.filter = cssFilter !== "none" ? `${cssFilter} blur(18px)` : "blur(18px)";
        }
        ctx.globalAlpha = 0.36;
        ctx.drawImage(img, x + (w - bgW) / 2, contentY + (contentH - bgH) / 2, bgW, bgH);
        ctx.restore();

        const dh = Math.min(contentH, Math.max(w * 1.18, contentH * 0.72));
        const dw = Math.max(w, dh * imgRatio);
        const overflowX = Math.max(0, dw - w);
        const glide = Math.sin(panProgress * Math.PI * 2) * 0.18;
        const panFrac = clamp01(focusX + glide);
        const dx = x - overflowX * panFrac;
        const dy = contentY + (contentH - dh) / 2;
        ctx.save();
        roundRect(ctx, x + 4, dy, w - 8, dh, 12);
        ctx.clip();
        if ("filter" in ctx) ctx.filter = cssFilter;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } else {
        // Rich blurred ambient backdrop inside tall iPhone
        const bgScale = Math.max(w / img.naturalWidth, contentH / img.naturalHeight) * 1.15;
        const bgW = img.naturalWidth * bgScale;
        const bgH = img.naturalHeight * bgScale;
        ctx.save();
        if ("filter" in ctx) {
          ctx.filter = cssFilter !== "none" ? `${cssFilter} blur(18px)` : "blur(18px)";
        }
        ctx.globalAlpha = 0.44;
        ctx.drawImage(img, x + (w - bgW) / 2, contentY + (contentH - bgH) / 2, bgW, bgH);
        ctx.restore();

        if (phoneFitMode === "fit") {
          const pad = 10;
          const dw = w - pad * 2;
          const dh = dw / imgRatio;
          const dy = contentY + (contentH - dh) / 2;
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.68)";
          ctx.shadowBlur = 24;
          roundRect(ctx, x + pad, dy, dw, dh, 12);
          ctx.clip();
          if ("filter" in ctx) ctx.filter = cssFilter;
          ctx.drawImage(img, x + pad, dy, dw, dh);
          ctx.restore();

          ctx.save();
          roundRect(ctx, x + pad, dy, dw, dh, 12);
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      }
    } else if (frameStyle === "iphone") {
      // Portrait / mobile SS fills tall iPhone cleanly without black letterbox bars
      const scaleCover = Math.max(w / img.naturalWidth, contentH / img.naturalHeight);
      const dw = img.naturalWidth * scaleCover;
      const dh = img.naturalHeight * scaleCover;
      const dx = x + (w - dw) / 2;
      const dy = contentY + (contentH - dh) / 2;
      ctx.save();
      if ("filter" in ctx) ctx.filter = cssFilter;
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    } else {
      let dw = w;
      let dh = contentH;
      let dx = x;
      let dy = contentY;
      if (imgRatio > boxRatio) {
        dw = w;
        dh = w / imgRatio;
        dy = contentY + (contentH - dh) / 2;
      } else {
        dh = contentH;
        dw = contentH * imgRatio;
        dx = x + (w - dw) / 2;
      }
      ctx.save();
      if ("filter" in ctx) {
        ctx.filter = cssFilter;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
    }
  } else {
    ctx.fillStyle = accent;
    roundRect(ctx, x + 20, contentY + 20, 28, 28, 6);
    ctx.fill();
  }

  if (frameStyle === "iphone") {
    roundRect(ctx, x + w / 2 - 36, y + 10, 72, 16, 8);
    ctx.fillStyle = "#000000";
    ctx.fill();
  }

  const sx = x - w * 0.35 + ((shimmerProgress * 1.6) % 1.4) * w;
  const shimmer = ctx.createLinearGradient(sx, y, sx + w * 0.3, y + h);
  shimmer.addColorStop(0, "rgba(255,255,255,0)");
  shimmer.addColorStop(0.5, "rgba(255,255,255,0.13)");
  shimmer.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shimmer;
  ctx.fillRect(x, y, w, h);

  ctx.restore();

  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle = frameStyle === "macos-light" ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.2)";
  ctx.lineWidth = frameStyle === "iphone" ? 2.5 : 1.3;
  ctx.stroke();
  ctx.restore();

  // Pop-Out Desktop Showcase Card across front of iPhone bezel
  if (
    isWideDesktopInPhone &&
    phoneFitMode === "showcase" &&
    img &&
    img.complete &&
    img.naturalWidth > 0
  ) {
    const popW = w * 1.5;
    const popBarH = showBrandHeader ? 22 : 0;
    const popImgH = popW / imgRatio;
    const popH = popImgH + popBarH;
    const popX = x + (w - popW) / 2;
    const popY = y + (h - popH) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.78)";
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 16;
    roundRect(ctx, popX, popY, popW, popH, 12);
    ctx.fillStyle = "#0B0D12";
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, popX, popY, popW, popH, 12);
    ctx.clip();
    if (showBrandHeader) {
      ctx.fillStyle = "#171820";
      ctx.fillRect(popX, popY, popW, popBarH);
      ["#FF5F56", "#FFBD2E", "#27C93F"].forEach((dot, idx) => {
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(popX + 12 + idx * 11, popY + popBarH / 2, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#94A3B8";
      ctx.font = "500 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(domainLabel, popX + popW / 2, popY + 14);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    if ("filter" in ctx) ctx.filter = cssFilter;
    ctx.drawImage(img, popX, popY + popBarH, popW, popImgH);
    ctx.restore();

    ctx.save();
    roundRect(ctx, popX, popY, popW, popH, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

function drawCursorClick(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  targetY: number,
  localT: number,
  accent: string
) {
  if (localT < 0.22 || localT > 0.85) return;
  const moveT = easeOutCubic(clamp01((localT - 0.22) / 0.28));
  const clickT = clamp01((localT - 0.5) / 0.28);

  const startX = targetX - 96;
  const startY = targetY + 68;
  const curX = startX + moveT * (targetX - startX);
  const curY = startY + moveT * (targetY - startY);

  // Expanding click shockwave ring
  if (clickT > 0 && clickT < 1) {
    ctx.save();
    ctx.globalAlpha = (1 - clickT) * 0.85;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(curX, curY, 6 + clickT * 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Crisp pointer arrow
  ctx.save();
  ctx.translate(curX, curY);
  const pressScale = clickT > 0 && clickT < 0.35 ? 0.82 : 1;
  ctx.scale(pressScale, pressScale);
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 22);
  ctx.lineTo(6, 17);
  ctx.lineTo(11, 26);
  ctx.lineTo(15, 24);
  ctx.lineTo(10, 15);
  ctx.lineTo(18, 15);
  ctx.closePath();
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.strokeStyle = "#0A0A0C";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawCinemaLetterboxAndChrome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  progress: number,
  accent: string,
  cinemaBars: boolean,
  chapterTag: string,
  filmLook: FilmLookConfig,
  showBrandHeader = true
) {
  // Optical Cinema Vignette
  if (filmLook.vignette > 0) {
    const vig = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.28,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.72
    );
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, `rgba(0,0,0,${((filmLook.vignette / 100) * 0.65).toFixed(2)})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  // Subtle 35mm film grain speckles (deterministic per frame)
  if (filmLook.filmGrain > 0) {
    const grainAlpha = (filmLook.filmGrain / 100) * 0.14;
    const frameTick = Math.floor(progress * 1000);
    ctx.save();
    ctx.fillStyle = "#FFFFFF";
    ctx.globalAlpha = grainAlpha;
    for (let i = 0; i < 95; i++) {
      const gx = ((i * 197 + frameTick * 89) % 997) / 997 * w;
      const gy = ((i * 313 + frameTick * 131) % 991) / 991 * h;
      ctx.fillRect(gx, gy, 1.5, 1.5);
    }
    ctx.restore();
  }

  if (cinemaBars) {
    const barH = h > w ? 48 : 36;
    ctx.fillStyle = "#030305";
    ctx.fillRect(0, 0, w, barH);
    ctx.fillRect(0, h - barH, w, barH);
  }

  // Top-right crisp commercial chapter counter
  if (showBrandHeader) {
    const topOffset = cinemaBars ? (h > w ? 28 : 22) : 24;
    ctx.save();
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "600 10.5px 'JetBrains Mono', monospace";
    ctx.fillText(chapterTag, w - 24, topOffset);
    ctx.restore();
  }

  // Top edge progress hairline
  ctx.fillStyle = "rgba(255,255,255,0.1)";
  ctx.fillRect(0, 0, w, 3);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, w * progress, 3);
}

export interface RenderShortFilmParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  progress: number;
  preset: ShortFilmPreset;
  shots: ShortFilmShot[];
  imageMap: Map<string, HTMLImageElement>;
  logoImg: HTMLImageElement | null;
  dealScript: BrandDealScript;
  filmLook: FilmLookConfig;
  brandKit: BrandKit;
  useBrandKit: boolean;
  mockupScale?: number;
  showBrandHeader?: boolean;
  phoneFitMode?: PhoneFitMode;
}

export function renderShortFilmFrame({
  ctx,
  width,
  height,
  progress,
  preset,
  shots,
  imageMap,
  logoImg,
  dealScript,
  filmLook,
  brandKit,
  useBrandKit,
  mockupScale = 100,
  showBrandHeader = true,
  phoneFitMode = "pan",
}: RenderShortFilmParams) {
  const cssFilter = buildFilmLookCssFilter(filmLook);
  const safeShots = shots.length > 0 ? shots : [];
  const accent = sanitizeHexColor(
    useBrandKit ? brandKit.primaryColor : preset.palette[0],
    preset.palette[0]
  );
  const secondary = sanitizeHexColor(
    useBrandKit ? brandKit.secondaryAccent : preset.palette[0],
    preset.palette[0]
  );
  const brandTitle =
    dealScript.clientName.trim() ||
    (useBrandKit && brandKit.brandName ? brandKit.brandName : "SnapFramy");
  const domainLabel =
    dealScript.ctaUrl.trim() ||
    (useBrandKit && brandKit.domainBadge ? brandKit.domainBadge : "snapframy.app");

  drawFilmBackdrop(
    ctx,
    width,
    height,
    accent,
    preset.palette[1],
    preset.palette[2],
    preset.pattern,
    progress,
    preset.particlesEnabled
  );

  const isVert = height > width;
  const isPhone = preset.frameStyle === "iphone";
  const userScale = Math.max(0.45, Math.min(1.45, mockupScale / 100));

  const primaryImg = safeShots[0] ? imageMap.get(safeShots[0].id) : undefined;
  const primaryRatio =
    primaryImg && primaryImg.complete && primaryImg.naturalWidth > 0 && primaryImg.naturalHeight > 0
      ? primaryImg.naturalWidth / primaryImg.naturalHeight
      : 16 / 10;

  let rawW: number;
  let rawH: number;
  if (isPhone) {
    const isWideSS = primaryRatio > 1.08;
    if (isVert) {
      const maxW = isWideSS && phoneFitMode === "showcase" ? width * 0.54 : width * 0.74;
      rawH = Math.min(820, height * 0.68);
      rawW = Math.min(maxW, rawH * 0.5);
      rawH = rawW / 0.5;
    } else {
      rawH = Math.min(540, height * 0.74);
      rawW = Math.min(width * 0.38, rawH * 0.5);
      rawH = rawW / 0.5;
    }
  } else {
    const chromeReserve =
      showBrandHeader &&
      (preset.frameStyle === "macos-dark" ||
        preset.frameStyle === "macos-light" ||
        preset.frameStyle === "browser")
        ? 30
        : 0;
    const maxW = isVert ? Math.min(640, width * 0.88) : Math.min(800, width * 0.76);
    const maxH = isVert ? Math.min(760, height * 0.66) : Math.min(480, height * 0.64);
    const targetBoxRatio = maxW / Math.max(1, maxH - chromeReserve);
    if (primaryRatio > targetBoxRatio) {
      rawW = maxW;
      rawH = Math.max(220, Math.min(maxH, maxW / primaryRatio + chromeReserve));
    } else {
      rawH = maxH;
      rawW = Math.max(240, Math.min(maxW, (maxH - chromeReserve) * primaryRatio));
    }
  }

  const baseW = rawW * userScale;
  const baseH = rawH * userScale;

  const drawShotTransform = (
    shot: ShortFilmShot,
    img: HTMLImageElement | undefined,
    cx: number,
    cy: number,
    scale: number,
    rotDeg: number,
    skewX: number,
    skewY: number,
    alpha: number,
    chromaAmt: number,
    shimmerT: number
  ) => {
    ctx.save();
    ctx.globalAlpha = clamp01(alpha);
    ctx.translate(cx, cy);
    ctx.rotate((rotDeg * Math.PI) / 180);
    ctx.transform(scale, skewY, skewX, scale, 0, 0);

    if (preset.floorReflection && alpha > 0.45) {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.translate(0, baseH + 14);
      ctx.scale(1, -0.3);
      roundRect(ctx, -baseW / 2, -baseH / 2, baseW, baseH, 16);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.restore();
    }

    drawShotCard(
      ctx,
      img,
      -baseW / 2,
      -baseH / 2,
      baseW,
      baseH,
      preset.frameStyle,
      domainLabel,
      shot.label || brandTitle,
      accent,
      shimmerT,
      chromaAmt,
      cssFilter,
      showBrandHeader,
      phoneFitMode,
      shot.focusX ?? 0.5,
      shimmerT
    );
    ctx.restore();
  };

  // =========================================================================
  // 6-ACT 30s BRAND COMMERCIAL MODE (commercialArc === true)
  // =========================================================================
  if (preset.commercialArc && safeShots.length > 0) {
    // CHAPTER 1 (0.00 -> 0.09): Kinetic Problem / Attention Hook Slam
    if (progress < 0.09) {
      const chP = progress / 0.09;
      // Subtle zoomed silhouette of shot 1 pulsing behind
      drawShotTransform(
        safeShots[0],
        imageMap.get(safeShots[0].id),
        width / 2,
        height / 2,
        1.15 - chP * 0.08,
        -2,
        0,
        0,
        0.14,
        preset.chromaticSplit ? 6 : 0,
        chP
      );

      const slam = easeOutExpo(chP);
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(1.28 - 0.28 * slam, 1.28 - 0.28 * slam);
      ctx.textAlign = "center";

      if (showBrandHeader) {
        ctx.fillStyle = secondary;
        ctx.font = `700 ${isVert ? 13 : 14}px 'JetBrains Mono', monospace`;
        ctx.fillText(`SPOTLIGHT PARTNER · ${brandTitle.toUpperCase()}`, 0, -48);
      }

      const words = (dealScript.problemHook || "Stop wasting hours on static visuals.").split(" ");
      const visibleWords = words.slice(0, Math.max(1, Math.ceil(words.length * Math.min(1, chP * 1.65))));
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${isVert ? 38 : 52}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(visibleWords.join(" "), 0, 12, width - 96);

      ctx.fillStyle = accent;
      roundRect(ctx, -110 * slam, 44, 220 * slam, 4, 2);
      ctx.fill();
      ctx.restore();

      drawCinemaLetterboxAndChrome(ctx, width, height, progress, accent, preset.cinemaBars, "ACT 01 · HOOK", filmLook, showBrandHeader);
      return;
    }

    // CHAPTER 2 (0.09 -> 0.21): Hero Brand Reveal with Spring Overshoot & Spotlight
    if (progress < 0.21) {
      const chP = (progress - 0.09) / 0.12;
      const spring = easeOutBack(clamp01(chP / 0.45));
      const heroShot = safeShots[0];

      if (preset.flashBeats && chP < 0.14) {
        ctx.save();
        ctx.globalAlpha = (1 - chP / 0.14) * 0.48;
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Upper Headline Reveal
      ctx.save();
      ctx.globalAlpha = easeOutExpo(clamp01(chP / 0.35));
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${isVert ? 30 : 34}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(
        dealScript.heroHeadline || `Meet ${brandTitle}. Built for speed.`,
        width / 2,
        preset.cinemaBars ? (isVert ? 105 : 74) : isVert ? 82 : 58,
        width - 80
      );
      ctx.restore();

      drawShotTransform(
        heroShot,
        imageMap.get(heroShot.id),
        width / 2,
        height / 2 + 26,
        0.74 + 0.22 * spring,
        (1 - spring) * 5,
        0,
        (1 - spring) * 0.04,
        clamp01(chP * 3),
        preset.chromaticSplit && chP < 0.3 ? (1 - chP / 0.3) * 10 : 0,
        chP
      );

      if (preset.cursorSpotlight) {
        const fx = heroShot.focusX ?? 0.58;
        const fy = heroShot.focusY ?? 0.44;
        drawCursorClick(
          ctx,
          width / 2 + (fx - 0.5) * baseW * 0.85,
          height / 2 + 26 + (fy - 0.5) * baseH * 0.85,
          chP,
          accent
        );
      }

      drawCinemaLetterboxAndChrome(ctx, width, height, progress, accent, preset.cinemaBars, "ACT 02 · REVEAL", filmLook, showBrandHeader);
      return;
    }

    // CHAPTER 3 (0.21 -> 0.57): Dynamic Multi-Choreography Shot Montage
    if (progress < 0.57) {
      const actP = (progress - 0.21) / 0.36;
      const n = safeShots.length;
      const rawIdx = actP * n;
      const activeIdx = Math.min(n - 1, Math.floor(rawIdx));
      const localT = rawIdx - activeIdx;
      const prevIdx = (activeIdx - 1 + n) % n;

      const activeShot = safeShots[activeIdx];
      const prevShot = safeShots[prevIdx];
      const activeImg = imageMap.get(activeShot.id);
      const prevImg = imageMap.get(prevShot.id);

      const enterT = easeOutExpo(clamp01(localT / 0.28));
      const exitT = easeInOutQuart(clamp01((localT - 0.8) / 0.2));
      const ramped = speedRamp(localT, preset.speedCurve);
      const velocityPeak = localT < 0.25 ? 1 - localT / 0.25 : localT > 0.82 ? (localT - 0.82) / 0.18 : 0;
      const chroma = preset.chromaticSplit ? velocityPeak * 9 : 0;

      // Rotate commercial editing moves shot-by-shot so 30s never feels repetitive!
      const movePool = [
        preset.choreography,
        "diagonal-split",
        "domino-cascade",
        "shutter-slice",
        "tunnel-zoom",
      ] as const;
      const shotMode = activeIdx === 0 ? preset.choreography : movePool[activeIdx % movePool.length];

      const fx = activeShot.focusX ?? 0.5;
      const fy = activeShot.focusY ?? 0.5;
      const hasCustomFocus = activeShot.focusX !== undefined || activeShot.focusY !== undefined;
      const focusEnv = hasCustomFocus ? Math.sin(clamp01((localT - 0.2) / 0.65) * Math.PI) : 0;
      const focusPanX = (0.5 - fx) * baseW * 0.34 * focusEnv;
      const focusPanY = (0.5 - fy) * baseH * 0.34 * focusEnv;
      const focusZoom = 1 + focusEnv * 0.16;

      ctx.save();
      if (hasCustomFocus && focusEnv > 0.01) {
        ctx.translate(width / 2 + focusPanX, height / 2 + focusPanY);
        ctx.scale(focusZoom, focusZoom);
        ctx.translate(-width / 2, -height / 2);
      }

      if (shotMode === "diagonal-split") {
        drawShotTransform(prevShot, prevImg, width / 2, height / 2, 0.94 - 0.08 * enterT, 0, 0, 0, 1, 0, localT);
        const wipeX = width * (1.25 - enterT * 1.45);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(wipeX, 0);
        ctx.lineTo(width + 200, 0);
        ctx.lineTo(width + 200, height);
        ctx.lineTo(wipeX - 180, height);
        ctx.closePath();
        ctx.clip();
        drawShotTransform(activeShot, activeImg, width / 2, height / 2, 0.92 + 0.08 * ramped, (1 - enterT) * 4, 0, 0.02, 1, chroma, localT);
        ctx.restore();
        if (enterT < 0.98) {
          ctx.save();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(wipeX, 0);
          ctx.lineTo(wipeX - 180, height);
          ctx.stroke();
          ctx.restore();
        }
      } else if (shotMode === "shutter-slice") {
        drawShotTransform(prevShot, prevImg, width / 2, height / 2, 0.94, 0, 0, 0, 1, 0, localT);
        const slices = 6;
        const sliceW = width / slices;
        ctx.save();
        ctx.beginPath();
        for (let s = 0; s < slices; s++) {
          const ls = clamp01((enterT * 1.45 - s * 0.08) / 0.65);
          const hs = height * ls;
          ctx.rect(s * sliceW, s % 2 === 0 ? 0 : height - hs, sliceW + 1, hs);
        }
        ctx.clip();
        drawShotTransform(activeShot, activeImg, width / 2, height / 2, 0.92 + 0.07 * ramped, 0, 0, 0, 1, chroma, localT);
        ctx.restore();
      } else if (shotMode === "domino-cascade") {
        for (let offset = Math.min(2, n - 1); offset >= 0; offset--) {
          const idx = (activeIdx + offset) % n;
          const depthShift = offset - enterT * (offset === 0 ? 0 : 0.25);
          drawShotTransform(
            safeShots[idx],
            imageMap.get(safeShots[idx].id),
            width / 2 + depthShift * 95,
            height / 2 - depthShift * 26,
            Math.max(0.56, 0.96 - depthShift * 0.14),
            depthShift * -4 + preset.tiltAngle * 0.18,
            0.04 * depthShift,
            -0.05 * depthShift,
            offset === 0 ? 1 : Math.max(0.25, 0.72 - offset * 0.2),
            offset === 0 ? chroma : 0,
            localT
          );
        }
      } else if (shotMode === "tunnel-zoom") {
        if (localT < 0.35) {
          const outP = localT / 0.35;
          drawShotTransform(prevShot, prevImg, width / 2, height / 2, 1 + outP * 1.35, outP * 7, 0, 0, 1 - outP, chroma, localT);
        }
        drawShotTransform(
          activeShot,
          activeImg,
          width / 2,
          height / 2,
          0.48 + 0.54 * ramped,
          (1 - enterT) * -5,
          0,
          0.02,
          enterT,
          chroma,
          localT
        );
      } else {
        const dir = activeIdx % 2 === 0 ? 1 : -1;
        const cx = width / 2 + (1 - enterT) * width * 0.85 * dir + exitT * width * -0.9 * dir + (ramped - 0.5) * 28 * dir;
        const cy = height / 2 + Math.sin(localT * Math.PI) * -10;
        const sc = 0.91 + 0.08 * Math.sin(ramped * Math.PI * 0.5);
        const rot = (1 - enterT) * (5 * dir) + exitT * (-5 * dir);
        if (preset.motionBlurTrails && velocityPeak > 0.15) {
          for (let g = 3; g >= 1; g--) {
            drawShotTransform(activeShot, activeImg, cx - dir * g * 24 * velocityPeak, cy, sc * (1 - g * 0.02), rot, 0, 0.02, 0.16 / g, 0, localT);
          }
        }
        drawShotTransform(activeShot, activeImg, cx, cy, sc, rot, preset.tiltAngle * 0.002, preset.tiltAngle * 0.004 * dir, 1, chroma, localT);
      }

      if (preset.cursorSpotlight) {
        drawCursorClick(
          ctx,
          width / 2 + (fx - 0.5) * baseW * 0.85,
          height / 2 + (fy - 0.5) * baseH * 0.85,
          localT,
          accent
        );
      }
      ctx.restore();

      if (preset.flashBeats && localT < 0.1) {
        ctx.save();
        ctx.globalAlpha = (1 - localT / 0.1) * 0.38;
        ctx.fillStyle = activeIdx % 2 === 0 ? "#FFFFFF" : accent;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      if (preset.kineticText) {
        const labelP = easeOutExpo(clamp01(localT / 0.28));
        const pillY = height - (preset.cinemaBars ? (isVert ? 108 : 80) : isVert ? 88 : 54);
        ctx.save();
        ctx.globalAlpha = labelP;
        ctx.textAlign = "left";
        const barX = 36;
        ctx.fillStyle = accent;
        roundRect(ctx, barX, pillY - 14, 4, 34, 2);
        ctx.fill();
        ctx.fillStyle = secondary;
        ctx.font = "700 11px 'JetBrains Mono', monospace";
        ctx.fillText(`0${activeIdx + 1} / ${activeShot.label.toUpperCase()}`, barX + 14, pillY - 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "700 17px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(activeShot.caption, barX + 14, pillY + 19, width - 120);
        ctx.restore();
      }

      drawCinemaLetterboxAndChrome(
        ctx,
        width,
        height,
        progress,
        accent,
        preset.cinemaBars,
        `ACT 03 · SCENE 0${activeIdx + 1}`,
        filmLook,
        showBrandHeader
      );
      return;
    }

    // CHAPTER 4 (0.57 -> 0.72): All-In-One Bento Ecosystem Grid / 3D Orbit
    if (progress < 0.72) {
      const chP = (progress - 0.57) / 0.15;
      const bentoP = easeOutExpo(clamp01(chP / 0.45));
      const n = safeShots.length;
      const cols = isVert ? (n <= 1 ? 1 : 2) : n <= 2 ? n : n <= 4 ? 2 : 3;
      const rows = Math.ceil(n / cols);
      const gridScale = Math.max(0.65, Math.min(1.18, userScale));
      const maxSlotW = (width * 0.84) / cols - 16;
      const maxSlotH = (height * (isVert ? 0.66 : 0.62)) / rows - 16;
      let cellW = Math.min(isPhone ? 210 : 340, maxSlotW) * gridScale;
      let cellH = Math.min(isPhone ? 380 : 230, maxSlotH) * gridScale;
      if (isPhone) {
        const fittedH = Math.min(maxSlotH, cellW / 0.52);
        const fittedW = fittedH * 0.52;
        cellW = Math.min(maxSlotW, fittedW) * (isVert && phoneFitMode === "showcase" ? 0.76 : 1);
        cellH = cellW / 0.52;
      } else {
        cellW = Math.min(maxSlotW, cellW);
        cellH = Math.min(maxSlotH, cellH);
      }
      const startX = (width - (cols * cellW + (cols - 1) * 18)) / 2;
      const startY = (height - (rows * cellH + (rows - 1) * 18)) / 2 + 18;

      const camZoom = 0.96 + chP * 0.08;
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.scale(camZoom, camZoom);
      ctx.translate(-width / 2, -height / 2);

      safeShots.forEach((shot, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const tx = startX + col * (cellW + 18);
        const ty = startY + row * (cellH + 18);
        const fromX = (col % 2 === 0 ? -1 : 1) * 180 * (1 - bentoP);
        const fromY = (row === 0 ? -1 : 1) * 140 * (1 - bentoP);
        ctx.save();
        ctx.globalAlpha = bentoP;
        drawShotCard(
          ctx,
          imageMap.get(shot.id),
          tx + fromX,
          ty + fromY,
          cellW,
          cellH,
          preset.frameStyle,
          domainLabel,
          shot.label,
          accent,
          chP,
          0,
          cssFilter,
          showBrandHeader,
          phoneFitMode,
          shot.focusX ?? 0.5,
          chP
        );
        ctx.restore();
      });
      ctx.restore();

      ctx.save();
      ctx.globalAlpha = bentoP;
      ctx.textAlign = "center";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `800 ${isVert ? 24 : 28}px 'Plus Jakarta Sans', sans-serif`;
      ctx.fillText(
        `EVERY WORKFLOW IN ONE PLACE · ${n} VIEWS`,
        width / 2,
        preset.cinemaBars ? 68 : 48
      );
      ctx.restore();

      drawCinemaLetterboxAndChrome(ctx, width, height, progress, accent, preset.cinemaBars, "ACT 04 · SUITE", filmLook, showBrandHeader);
      return;
    }

    // CHAPTER 5 (0.72 -> 0.85): Explosive Client Proof / KPI Stat Slam
    if (progress < 0.85) {
      const chP = (progress - 0.72) / 0.13;
      if (preset.flashBeats && chP < 0.12) {
        ctx.save();
        ctx.globalAlpha = (1 - chP / 0.12) * 0.4;
        ctx.fillStyle = accent;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Faint floating hero backdrop
      drawShotTransform(
        safeShots[0],
        imageMap.get(safeShots[0].id),
        width / 2,
        height / 2,
        1.08 + chP * 0.08,
        -4,
        0,
        0,
        0.15,
        0,
        chP
      );

      const stats = [
        dealScript.proofStat1 || "10x Faster Launch",
        dealScript.proofStat2 || "+340% Conversion",
        dealScript.proofStat3 || "Zero Setup Friction",
      ];

      if (showBrandHeader) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.fillStyle = secondary;
        ctx.font = "700 13px 'JetBrains Mono', monospace";
        ctx.fillText(`WHY BRANDS CHOOSE ${brandTitle.toUpperCase()}`, width / 2, height * 0.25);
        ctx.restore();
      }

      const cardW = isVert ? width * 0.78 : Math.min(310, width * 0.27);
      const cardH = isVert ? 120 : 170;
      const gap = 22;

      stats.forEach((stat, idx) => {
        const delay = idx * 0.16;
        const p = easeOutBack(clamp01((chP - delay) / 0.38));
        if (p <= 0.01) return;

        const cx = isVert ? width / 2 : width / 2 + (idx - 1) * (cardW + gap);
        const cy = isVert ? height * 0.4 + idx * (cardH + 18) : height * 0.54;

        ctx.save();
        ctx.globalAlpha = clamp01(p);
        ctx.translate(cx, cy);
        ctx.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p);

        roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 16);
        ctx.fillStyle = "rgba(15, 17, 26, 0.9)";
        ctx.fill();
        ctx.strokeStyle = idx === 1 ? accent : "rgba(255,255,255,0.2)";
        ctx.lineWidth = idx === 1 ? 2.2 : 1.2;
        ctx.stroke();

        const parts = stat.trim().split(" ");
        const big = parts[0] || stat;
        const rest = parts.slice(1).join(" ");

        ctx.textAlign = "center";
        ctx.fillStyle = idx === 1 ? accent : "#FFFFFF";
        ctx.font = `800 ${isVert ? 34 : 38}px 'Plus Jakarta Sans', sans-serif`;
        ctx.fillText(big, 0, rest ? -4 : 12, cardW - 24);

        if (rest) {
          ctx.fillStyle = "#CBD5E1";
          ctx.font = "600 15px 'DM Sans', sans-serif";
          ctx.fillText(rest, 0, 32, cardW - 28);
        }
        ctx.restore();
      });

      drawCinemaLetterboxAndChrome(ctx, width, height, progress, accent, preset.cinemaBars, "ACT 05 · RESULTS", filmLook, showBrandHeader);
      return;
    }

    // CHAPTER 6 (0.85 -> 1.00): Brand Deal Sponsor End Card & Offer CTA
    const p = easeOutExpo((progress - 0.85) / 0.15);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(width / 2, height / 2);
    ctx.scale(0.92 + 0.08 * p, 0.92 + 0.08 * p);
    ctx.textAlign = "center";

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.save();
      roundRect(ctx, -34, -145, 68, 68, 16);
      ctx.clip();
      ctx.drawImage(logoImg, -34, -145, 68, 68);
      ctx.restore();
    }

    if (dealScript.offerBadge.trim()) {
      const badgeW = Math.min(440, width * 0.82);
      roundRect(ctx, -badgeW / 2, -62, badgeW, 32, 8);
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = secondary;
      ctx.font = "700 12px 'JetBrains Mono', monospace";
      ctx.fillText(dealScript.offerBadge.toUpperCase(), 0, -42, badgeW - 24);
    }

    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${isVert ? 50 : 62}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(brandTitle, 0, 22, width - 80);

    ctx.fillStyle = "#CBD5E1";
    ctx.font = `500 ${isVert ? 19 : 21}px 'DM Sans', sans-serif`;
    ctx.fillText(dealScript.ctaSubtitle || "Get started today in seconds.", 0, 62, width - 96);

    const btnW = Math.min(360, width * 0.74);
    roundRect(ctx, -btnW / 2, 92, btnW, 52, 12);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "700 18px 'JetBrains Mono', monospace";
    ctx.fillText(domainLabel, 0, 124);
    ctx.restore();

    drawCinemaLetterboxAndChrome(ctx, width, height, progress, accent, preset.cinemaBars, "ACT 06 · OFFER CTA", filmLook, showBrandHeader);
    return;
  }

  // =========================================================================
  // CLASSIC FAST SHORT REEL MODE (commercialArc === false)
  // =========================================================================
  if (progress < 0.11) {
    const p = easeOutExpo(progress / 0.11);
    const slamScale = 1.35 - 0.35 * p;
    ctx.save();
    ctx.globalAlpha = Math.min(1, p * 1.4);
    ctx.translate(width / 2, height / 2);
    ctx.scale(slamScale, slamScale);
    ctx.textAlign = "center";
    if (showBrandHeader) {
      ctx.fillStyle = secondary;
      ctx.font = `700 ${isVert ? 16 : 15}px 'JetBrains Mono', monospace`;
      ctx.fillText(brandTitle.toUpperCase(), 0, -34);
    }
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${isVert ? 42 : 54}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(dealScript.heroHeadline || "Built to move fast.", 0, 18, width - 88);
    ctx.fillStyle = accent;
    roundRect(ctx, -90 * p, 42, 180 * p, 4, 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (progress >= 0.87 || safeShots.length === 0) {
    const p = easeOutExpo((progress - 0.87) / 0.13);
    ctx.save();
    ctx.globalAlpha = p;
    ctx.translate(width / 2, height / 2);
    ctx.scale(0.92 + 0.08 * p, 0.92 + 0.08 * p);
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `800 ${isVert ? 52 : 64}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillText(brandTitle, 0, 4);
    ctx.fillStyle = "#CBD5E1";
    ctx.font = `500 ${isVert ? 20 : 22}px 'DM Sans', sans-serif`;
    ctx.fillText(dealScript.ctaSubtitle || "Create launch visuals in seconds.", 0, 46, width - 96);
    const btnW = Math.min(340, width * 0.72);
    roundRect(ctx, -btnW / 2, 76, btnW, 50, 12);
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "600 18px 'JetBrains Mono', monospace";
    ctx.fillText(domainLabel, 0, 107);
    ctx.restore();
    return;
  }

  const actP = (progress - 0.11) / 0.76;
  const n = safeShots.length;
  const rawIdx = actP * n;
  const activeIdx = Math.min(n - 1, Math.floor(rawIdx));
  const localT = rawIdx - activeIdx;
  const prevIdx = (activeIdx - 1 + n) % n;
  const activeShot = safeShots[activeIdx];
  const prevShot = safeShots[prevIdx];
  const activeImg = imageMap.get(activeShot.id);
  const prevImg = imageMap.get(prevShot.id);

  const ramped = speedRamp(localT, preset.speedCurve);
  const enterT = easeOutExpo(clamp01(localT / 0.28));
  const exitT = easeInOutQuart(clamp01((localT - 0.78) / 0.22));
  const velocityPeak = localT < 0.25 ? 1 - localT / 0.25 : localT > 0.8 ? (localT - 0.8) / 0.2 : 0;
  const chroma = preset.chromaticSplit ? velocityPeak * 9 : 0;

  const dir = activeIdx % 2 === 0 ? 1 : -1;
  const cx = width / 2 + (1 - enterT) * width * 0.85 * dir + exitT * width * -0.9 * dir + (ramped - 0.5) * 32 * dir;
  const cy = height / 2 + Math.sin(localT * Math.PI) * -10;
  const sc = 0.91 + 0.09 * Math.sin(ramped * Math.PI * 0.5);
  const rot = (1 - enterT) * (6 * dir) + exitT * (-6 * dir);

  if (preset.motionBlurTrails && velocityPeak > 0.15) {
    for (let g = 3; g >= 1; g--) {
      drawShotTransform(activeShot, activeImg, cx - dir * g * 24 * velocityPeak, cy, sc * (1 - g * 0.02), rot, 0, 0.03, 0.16 / g, 0, localT);
    }
  }
  drawShotTransform(activeShot, activeImg, cx, cy, sc, rot, preset.tiltAngle * 0.002, preset.tiltAngle * 0.004 * dir, 1, chroma, localT);

  drawCinemaLetterboxAndChrome(ctx, width, height, progress, accent, preset.cinemaBars, `SHOT 0${activeIdx + 1}`, filmLook, showBrandHeader);
}

/**
 * Pure Web Audio API Commercial Beat & Transition SFX scheduler for 10s–30s Reels.
 */
export function scheduleShortFilmAudioStep(
  ctx: AudioContext,
  dest: AudioNode,
  stepIdx: number,
  audioTime: number,
  durationSec: number,
  shotCount: number
) {
  const stepSec = 0.25;
  const videoT = stepIdx * stepSec;
  const progress = videoT / durationSec;

  // Driving sub kick on downbeats
  if (stepIdx % 2 === 0 && progress < 0.94) {
    const isDrop = progress >= 0.08 && progress <= 0.12;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(isDrop ? 160 : 125, audioTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioTime + (isDrop ? 0.28 : 0.14));
    gain.gain.setValueAtTime(0.001, audioTime);
    gain.gain.linearRampToValueAtTime(isDrop ? 0.36 : 0.26, audioTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioTime + (isDrop ? 0.35 : 0.22));
    osc.connect(gain);
    gain.connect(dest);
    osc.start(audioTime);
    osc.stop(audioTime + 0.36);
  }

  // Commercial melodic synth progression across Acts
  const notes =
    progress < 0.57
      ? [293.66, 369.99, 440.0, 587.33]
      : progress < 0.85
        ? [329.63, 440.0, 554.37, 659.25]
        : [293.66, 440.0, 587.33, 739.99];

  if (stepIdx % 2 === 1 && progress > 0.08 && progress < 0.92) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(notes[stepIdx % notes.length], audioTime);
    gain.gain.setValueAtTime(0.001, audioTime);
    gain.gain.linearRampToValueAtTime(0.065, audioTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.2);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(audioTime);
    osc.stop(audioTime + 0.22);
  }

  // Act boundary & shot-cut cinematic risers / whooshes
  const n = Math.max(1, shotCount);
  const cutPoints = [0.09, 0.21, 0.57, 0.72, 0.85];
  for (let s = 0; s < n; s++) {
    cutPoints.push(0.21 + (s / n) * 0.36);
  }
  for (const cutP of cutPoints) {
    if (Math.abs(progress - cutP) < stepSec / durationSec / 2) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(240, audioTime);
      osc.frequency.exponentialRampToValueAtTime(62, audioTime + 0.18);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600, audioTime);
      gain.gain.setValueAtTime(0.11, audioTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioTime + 0.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      osc.start(audioTime);
      osc.stop(audioTime + 0.22);
      break;
    }
  }
}
