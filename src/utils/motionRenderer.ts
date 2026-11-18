import {
  BackdropPattern,
  BrandKit,
  MotionAspectId,
  MotionEasing,
  MotionPreset,
  PhoneFitMode,
} from "../types/studio";
import { sanitizeHexColor } from "./brandKitStorage";

export const MOTION_ASPECT_DIMENSIONS: Record<
  MotionAspectId,
  { label: string; platform: string; width: number; height: number }
> = {
  "16:9": { label: "16:9", platform: "X / YouTube", width: 1280, height: 720 },
  "16:10": { label: "16:10", platform: "Product Hunt", width: 1280, height: 800 },
  "4:5": { label: "4:5", platform: "LinkedIn", width: 960, height: 1200 },
  "1:1": { label: "1:1", platform: "Square", width: 1080, height: 1080 },
  "9:16": { label: "9:16", platform: "Reels / App Store", width: 720, height: 1280 },
};

export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function evaluateEasing(t: number, easing: MotionEasing): number {
  const x = clamp01(t);
  switch (easing) {
    case "linear":
      return x;
    case "easeOut":
      return 1 - Math.pow(1 - x, 3);
    case "easeInOut":
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    case "expoOut":
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    case "spring": {
      const c4 = (2 * Math.PI) / 3;
      if (x === 0 || x === 1) return x;
      return Math.pow(2, -9 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
    default:
      return x;
  }
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

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  c1: string,
  c2: string,
  c3: string,
  pattern: BackdropPattern
) {
  const safeC1 = sanitizeHexColor(c1, "#2563EB");
  const safeC2 = sanitizeHexColor(c2, "#0F172A");
  const safeC3 = sanitizeHexColor(c3, "#05070D");

  const base = ctx.createLinearGradient(0, 0, w, h);
  base.addColorStop(0, safeC3);
  base.addColorStop(0.55, safeC2);
  base.addColorStop(1, safeC3);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  const g1 = ctx.createRadialGradient(w * 0.22, h * 0.2, 12, w * 0.22, h * 0.2, Math.max(w, h) * 0.62);
  g1.addColorStop(0, safeC1);
  g1.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = 0.44;
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  if (pattern === "dots") {
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    const step = 28;
    for (let x = step; x < w; x += step) {
      for (let y = step; y < h; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (pattern === "grid") {
    ctx.strokeStyle = "rgba(255,255,255,0.055)";
    ctx.lineWidth = 1;
    const step = 46;
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
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1.2;
    for (let r = 80; r < Math.max(w, h); r += 74) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (pattern === "spotlight") {
    const spot = ctx.createRadialGradient(w * 0.5, h * 0.48, 10, w * 0.5, h * 0.48, Math.max(w, h) * 0.52);
    spot.addColorStop(0, "rgba(255,255,255,0.13)");
    spot.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, w, h);
  }
}

function getFontFamily(brandKit?: BrandKit): { display: string; body: string } {
  if (!brandKit) {
    return {
      display: "'Plus Jakarta Sans', sans-serif",
      body: "'DM Sans', sans-serif",
    };
  }
  switch (brandKit.fontMood) {
    case "editorial":
      return { display: "Georgia, serif", body: "'DM Sans', sans-serif" };
    case "technical":
      return { display: "'JetBrains Mono', monospace", body: "'JetBrains Mono', monospace" };
    case "bold":
      return { display: "'Plus Jakarta Sans', sans-serif", body: "'DM Sans', sans-serif" };
    default:
      return { display: "'Plus Jakarta Sans', sans-serif", body: "'DM Sans', sans-serif" };
  }
}

function drawFramedMockup(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  frameStyle: MotionPreset["frameStyle"],
  domainLabel: string,
  titleLabel: string,
  accentColor: string,
  shimmerPos: number | null,
  shadowScale: number,
  showFrameHeader = true,
  phoneFitMode: PhoneFitMode = "pan",
  focusX = 0.5,
  progress = 0
) {
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.62)";
  ctx.shadowBlur = 44 * shadowScale;
  ctx.shadowOffsetY = 24 * shadowScale;

  if (frameStyle === "glass") {
    roundRect(ctx, x - 12, y - 12, w + 24, h + 24, 22);
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x - 12, y - 12, w + 24, h + 24, 22);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  } else {
    const outerRadius = frameStyle === "iphone" ? 38 : 16;
    roundRect(ctx, x, y, w, h, outerRadius);
    ctx.fillStyle = frameStyle === "macos-light" ? "#F4F4F6" : "#0B0D12";
    ctx.fill();
    ctx.restore();
  }

  const radius = frameStyle === "iphone" ? 38 : 16;
  const chromeH =
    showFrameHeader &&
    (frameStyle === "macos-dark" || frameStyle === "macos-light" || frameStyle === "browser")
      ? 34
      : 0;

  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();

  // Draw Frame Chrome (removed completely when Show Brand / URL Bar is off)
  if (showFrameHeader) {
    if (frameStyle === "macos-dark" || frameStyle === "macos-light") {
      const isLight = frameStyle === "macos-light";
      ctx.fillStyle = isLight ? "#F4F4F6" : "#1B1C22";
      ctx.fillRect(x, y, w, chromeH);
      ctx.strokeStyle = isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(x, y + chromeH);
      ctx.lineTo(x + w, y + chromeH);
      ctx.stroke();

      ["#FF5F56", "#FFBD2E", "#27C93F"].forEach((dot, i) => {
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(x + 18 + i * 16, y + chromeH / 2, 4.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.fillStyle = isLight ? "#52525B" : "#94A3B8";
      ctx.font = "600 11px 'DM Sans', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(titleLabel, x + w / 2, y + 21);
    } else if (frameStyle === "browser") {
      ctx.fillStyle = "#16171C";
      ctx.fillRect(x, y, w, chromeH);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.beginPath();
      ctx.moveTo(x, y + chromeH);
      ctx.lineTo(x + w, y + chromeH);
      ctx.stroke();

      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = "#52525B";
        ctx.beginPath();
        ctx.arc(x + 18 + i * 14, y + chromeH / 2, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }

      const barW = Math.min(280, w * 0.45);
      roundRect(ctx, x + (w - barW) / 2, y + 6, barW, 22, 6);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fill();

      ctx.fillStyle = "#CBD5E1";
      ctx.font = "500 10.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(domainLabel, x + w / 2, y + 20);
    }
  }

  // Draw Image / Screenshot inside content box (contain/cover without text distortion)
  const contentY = y + chromeH;
  const contentH = h - chromeH;
  ctx.fillStyle = "#090B10";
  ctx.fillRect(x, contentY, w, contentH);

  const imgAspect =
    img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
      ? img.naturalWidth / img.naturalHeight
      : 16 / 10;
  const isWideDesktopInPhone = frameStyle === "iphone" && imgAspect > 1.08;

  if (img && img.complete && img.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const boxAspect = w / contentH;

    if (isWideDesktopInPhone) {
      if (phoneFitMode === "pan") {
        // Draw blurred ambient echo behind a balanced horizontal glide (avoids 3x over-zoomed distortion)
        const bgScale = Math.max(w / img.naturalWidth, contentH / img.naturalHeight) * 1.15;
        const bgW = img.naturalWidth * bgScale;
        const bgH = img.naturalHeight * bgScale;
        ctx.save();
        if ("filter" in ctx) ctx.filter = "blur(18px)";
        ctx.globalAlpha = 0.36;
        ctx.drawImage(img, x + (w - bgW) / 2, contentY + (contentH - bgH) / 2, bgW, bgH);
        ctx.restore();

        const drawH = Math.min(contentH, Math.max(w * 1.18, contentH * 0.72));
        const drawW = Math.max(w, drawH * imgAspect);
        const overflowX = Math.max(0, drawW - w);
        const glideShift = Math.sin(progress * Math.PI * 2) * 0.18;
        const panFrac = clamp01(focusX + glideShift);
        const dx = x - overflowX * panFrac;
        const dy = contentY + (contentH - drawH) / 2;
        ctx.save();
        roundRect(ctx, x + 4, dy, w - 8, drawH, 12);
        ctx.clip();
        ctx.drawImage(img, dx, dy, drawW, drawH);
        ctx.restore();
      } else {
        // Draw rich blurred ambient echo behind the centered or pop-out desktop screenshot
        const bgScale = Math.max(w / img.naturalWidth, contentH / img.naturalHeight) * 1.15;
        const bgW = img.naturalWidth * bgScale;
        const bgH = img.naturalHeight * bgScale;
        ctx.save();
        if ("filter" in ctx) ctx.filter = "blur(18px)";
        ctx.globalAlpha = 0.44;
        ctx.drawImage(img, x + (w - bgW) / 2, contentY + (contentH - bgH) / 2, bgW, bgH);
        ctx.restore();

        if (phoneFitMode === "fit") {
          const pad = 10;
          const drawW = w - pad * 2;
          const drawH = drawW / imgAspect;
          const dy = contentY + (contentH - drawH) / 2;
          ctx.save();
          ctx.shadowColor = "rgba(0,0,0,0.68)";
          ctx.shadowBlur = 24;
          roundRect(ctx, x + pad, dy, drawW, drawH, 12);
          ctx.clip();
          ctx.drawImage(img, x + pad, dy, drawW, drawH);
          ctx.restore();

          ctx.save();
          roundRect(ctx, x + pad, dy, drawW, drawH, 12);
          ctx.strokeStyle = "rgba(255,255,255,0.22)";
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.restore();
        }
      }
    } else if (frameStyle === "iphone") {
      // Portrait / Mobile screenshot fills the iPhone screen edge-to-edge cleanly
      const scaleCover = Math.max(w / img.naturalWidth, contentH / img.naturalHeight);
      const drawW = img.naturalWidth * scaleCover;
      const drawH = img.naturalHeight * scaleCover;
      const dx = x + (w - drawW) / 2;
      const dy = contentY + (contentH - drawH) / 2;
      ctx.drawImage(img, dx, dy, drawW, drawH);
    } else {
      let drawW = w;
      let drawH = contentH;
      let dx = x;
      let dy = contentY;

      if (imgAspect > boxAspect) {
        drawW = w;
        drawH = w / imgAspect;
        dy = contentY + (contentH - drawH) / 2;
      } else {
        drawH = contentH;
        drawW = contentH * imgAspect;
        dx = x + (w - drawW) / 2;
      }

      ctx.drawImage(img, dx, dy, drawW, drawH);
    }
  } else {
    // Fallback preview skeleton
    ctx.fillStyle = accentColor;
    roundRect(ctx, x + 28, contentY + 28, 32, 32, 8);
    ctx.fill();
    ctx.fillStyle = "#F8FAFC";
    ctx.font = "700 16px 'Plus Jakarta Sans', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(titleLabel, x + 72, contentY + 49);
  }

  // Dynamic Island for iPhone
  if (frameStyle === "iphone") {
    roundRect(ctx, x + w / 2 - 42, y + 12, 84, 20, 10);
    ctx.fillStyle = "#000000";
    ctx.fill();
  }

  // Specular Glass Shimmer Sweep
  if (shimmerPos !== null) {
    const sx = x - w * 0.4 + shimmerPos * (w * 1.8);
    const shimmer = ctx.createLinearGradient(sx, y, sx + w * 0.35, y + h);
    shimmer.addColorStop(0, "rgba(255,255,255,0)");
    shimmer.addColorStop(0.5, "rgba(255,255,255,0.16)");
    shimmer.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = shimmer;
    ctx.fillRect(x, y, w, h);
  }

  ctx.restore();

  // Subtle rim stroke
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.strokeStyle =
    frameStyle === "macos-light" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.16)";
  ctx.lineWidth = frameStyle === "iphone" ? 3 : 1.5;
  ctx.stroke();
  ctx.restore();

  // Pop-Out Desktop Showcase Card extending cleanly past phone edges so desktop UI is crisp & legible
  if (
    isWideDesktopInPhone &&
    phoneFitMode === "showcase" &&
    img &&
    img.complete &&
    img.naturalWidth > 0
  ) {
    const popW = w * 1.52;
    const popBarH = showFrameHeader ? 24 : 0;
    const popImgH = popW / imgAspect;
    const popH = popImgH + popBarH;
    const popX = x + (w - popW) / 2;
    const popY = y + (h - popH) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.78)";
    ctx.shadowBlur = 36;
    ctx.shadowOffsetY = 18;
    roundRect(ctx, popX, popY, popW, popH, 14);
    ctx.fillStyle = "#0B0D12";
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, popX, popY, popW, popH, 14);
    ctx.clip();
    if (showFrameHeader) {
      ctx.fillStyle = "#171820";
      ctx.fillRect(popX, popY, popW, popBarH);
      ["#FF5F56", "#FFBD2E", "#27C93F"].forEach((dot, idx) => {
        ctx.fillStyle = dot;
        ctx.beginPath();
        ctx.arc(popX + 14 + idx * 12, popY + popBarH / 2, 3.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "#94A3B8";
      ctx.font = "500 9.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(domainLabel, popX + popW / 2, popY + 15);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, popX, popY + popBarH, popW, popImgH);
    ctx.restore();

    ctx.save();
    roundRect(ctx, popX, popY, popW, popH, 14);
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }
}

export interface RenderMotionFrameParams {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  progress: number; // 0..1
  preset: MotionPreset;
  easing: MotionEasing;
  img: HTMLImageElement | null;
  logoImg: HTMLImageElement | null;
  eyebrow: string;
  headline: string;
  showHeadline: boolean;
  brandKit?: BrandKit;
  useBrandKit: boolean;
  mockupScale?: number; // 55..140 percentage
  showFrameHeader?: boolean;
  cursorSpotlight?: boolean;
  zoomLoupe?: boolean;
  focusX?: number; // 0..1
  focusY?: number; // 0..1
  floatingBadge?: string;
  floorReflection?: boolean;
  ambientAura?: boolean;
  phoneFitMode?: PhoneFitMode;
}

function drawMotionCursorAndLoupe(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  focusX: number,
  focusY: number,
  progress: number,
  accent: string,
  showLoupe: boolean
) {
  // Glide cursor from bottom-right into focus target between progress 0.14..0.42
  const glideT = evaluateEasing(clamp01((progress - 0.14) / 0.28), "expoOut");
  const targetX = cardX + cardW * focusX;
  const targetY = cardY + cardH * focusY;
  const startX = cardX + cardW * 0.85;
  const startY = cardY + cardH * 0.88;
  const curX = startX + (targetX - startX) * glideT;
  const curY = startY + (targetY - startY) * glideT;

  // Click pulse waves at progress ~0.44 and ~0.72
  const clickWave = (startAt: number) => {
    const local = (progress - startAt) / 0.28;
    if (local <= 0 || local >= 1) return;
    const ease = evaluateEasing(local, "easeOut");
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.globalAlpha = (1 - local) * 0.85;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY, 8 + ease * 36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = (1 - local) * 0.25;
    ctx.fillStyle = accent;
    ctx.fill();
    ctx.restore();
  };
  clickWave(0.42);
  clickWave(0.7);

  // Optional 1.85x circular Zoom Loupe popping in after arrival
  if (showLoupe && img && img.complete && img.naturalWidth > 0 && progress > 0.36) {
    const pop = evaluateEasing(clamp01((progress - 0.36) / 0.18), "spring");
    const loupeR = Math.min(72, Math.max(44, Math.min(cardW, cardH) * 0.18)) * pop;
    if (loupeR > 4) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.arc(targetX, targetY, loupeR, 0, Math.PI * 2);
      ctx.fillStyle = "#090B10";
      ctx.fill();
      ctx.clip();

      // Draw zoomed crop from screenshot around (focusX, focusY)
      const zoom = 1.85;
      const srcW = img.naturalWidth / zoom;
      const srcH = img.naturalHeight / zoom;
      const sx = Math.max(0, Math.min(img.naturalWidth - srcW, focusX * img.naturalWidth - srcW / 2));
      const sy = Math.max(0, Math.min(img.naturalHeight - srcH, focusY * img.naturalHeight - srcH / 2));
      ctx.drawImage(
        img,
        sx,
        sy,
        srcW,
        srcH,
        targetX - loupeR,
        targetY - loupeR,
        loupeR * 2,
        loupeR * 2
      );
      ctx.restore();

      // Glossy rim around loupe
      ctx.save();
      ctx.beginPath();
      ctx.arc(targetX, targetY, loupeR, 0, Math.PI * 2);
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(targetX, targetY, loupeR - 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.45)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }

  // Crisp studio pointer cursor
  if (progress > 0.1) {
    const clickSquish =
      (progress > 0.42 && progress < 0.5) || (progress > 0.7 && progress < 0.78) ? 0.84 : 1;
    ctx.save();
    ctx.translate(curX, curY);
    ctx.scale(clickSquish, clickSquish);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(6, 17);
    ctx.lineTo(10.5, 25);
    ctx.lineTo(13.5, 23.5);
    ctx.lineTo(9, 15.5);
    ctx.lineTo(16, 15.5);
    ctx.closePath();
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.strokeStyle = "#0F172A";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();
  }
}

export function renderMotionFrame({
  ctx,
  width,
  height,
  progress,
  preset,
  easing,
  img,
  logoImg,
  eyebrow,
  headline,
  showHeadline,
  brandKit,
  useBrandKit,
  mockupScale = 100,
  showFrameHeader = true,
  cursorSpotlight = false,
  zoomLoupe = false,
  focusX = 0.58,
  focusY = 0.42,
  floatingBadge = "",
  floorReflection = true,
  ambientAura = true,
  phoneFitMode = "pan",
}: RenderMotionFrameParams) {
  const m = preset.motion;
  const p = evaluateEasing(progress, easing);
  const fonts = getFontFamily(useBrandKit ? brandKit : undefined);

  const primaryColor = sanitizeHexColor(
    useBrandKit && brandKit ? brandKit.primaryColor : preset.backdropColors[0],
    preset.backdropColors[0]
  );
  const secondaryColor = sanitizeHexColor(
    useBrandKit && brandKit ? brandKit.secondaryAccent : preset.backdropColors[0],
    preset.backdropColors[0]
  );
  const domainLabel =
    useBrandKit && brandKit?.domainBadge ? brandKit.domainBadge : "snapframy.app";
  const brandTitle =
    useBrandKit && brandKit?.brandName ? brandKit.brandName : "SnapFramy";

  // 1. Backdrop
  drawBackdrop(
    ctx,
    width,
    height,
    primaryColor,
    preset.backdropColors[1],
    preset.backdropColors[2],
    preset.pattern
  );

  // 2. Headline & Eyebrow
  const headerH = showHeadline ? (height > width ? 210 : 145) : 32;
  if (showHeadline) {
    const textP = evaluateEasing(clamp01(progress / 0.35), "easeOut");
    ctx.save();
    ctx.globalAlpha = textP;
    ctx.textAlign = "center";

    if (eyebrow.trim()) {
      ctx.fillStyle = secondaryColor;
      ctx.font = `700 ${height > width ? 15 : 14}px 'JetBrains Mono', monospace`;
      ctx.fillText(
        eyebrow.toUpperCase(),
        width / 2,
        (height > width ? 94 : 62) + (1 - textP) * 14
      );
    }

    if (headline.trim()) {
      ctx.fillStyle = "#FFFFFF";
      const fontSize = height > width ? 34 : 38;
      ctx.font = `700 ${fontSize}px ${fonts.display}`;
      ctx.fillText(
        headline,
        width / 2,
        (height > width ? 142 : 108) + (1 - textP) * 18,
        width - 96
      );
    }
    ctx.restore();
  }

  // 3. Mockup Geometry & Motion Math
  const isPhone = preset.frameStyle === "iphone";
  const userScale = Math.max(0.45, Math.min(1.5, mockupScale / 100));
  const availW = width * 0.82;
  const availH = height - headerH - 64;

  let cardW: number;
  let cardH: number;
  if (isPhone) {
    const imgNatRatio =
      img && img.complete && img.naturalWidth > 0 && img.naturalHeight > 0
        ? img.naturalWidth / img.naturalHeight
        : 1.6;
    const isWideSS = imgNatRatio > 1.08;
    const maxPhoneW =
      isWideSS && phoneFitMode === "showcase"
        ? width * (height > width ? 0.54 : 0.36)
        : availW * (height > width ? 0.78 : 0.65);
    cardH = Math.min(availH * 0.92, height > width ? 860 : 540);
    cardW = Math.min(maxPhoneW, cardH * 0.495);
    cardH = cardW / 0.495;
  } else {
    cardW = Math.min(840, availW);
    cardH = Math.min(height > width ? 820 : 520, availH * 0.88);
    const chromeReserve =
      showFrameHeader &&
      (preset.frameStyle === "macos-dark" ||
        preset.frameStyle === "macos-light" ||
        preset.frameStyle === "browser")
        ? 34
        : 0;
    if (img && img.naturalWidth > 0) {
      const natRatio = img.naturalWidth / img.naturalHeight;
      const targetBoxRatio = cardW / cardH;
      if (natRatio > targetBoxRatio) {
        cardH = Math.max(240, Math.min(cardH, cardW / natRatio + chromeReserve));
      } else {
        cardW = Math.max(300, Math.min(cardW, (cardH - chromeReserve) * natRatio));
      }
    }
  }

  const scale = (m.startScale + (m.endScale - m.startScale) * p) * userScale;
  const offsetX = (m.startX + (m.endX - m.startX) * p) * width;
  const floatY =
    m.floatFreq > 0 ? Math.sin(progress * Math.PI * 2 * m.floatFreq) * m.floatAmpY : 0;
  const offsetY = (m.startY + (m.endY - m.startY) * p) * height + floatY;
  const rotRad = ((m.startRotateDeg + (m.endRotateDeg - m.startRotateDeg) * p) * Math.PI) / 180;
  const opacity = clamp01(m.startOpacity + (m.endOpacity - m.startOpacity) * p);

  // Flip / Book-open projective scale factor
  let flipScaleX = 1;
  let flipScaleY = 1;
  let skewY = (m.tiltY * 0.0045) * (0.4 + 0.6 * Math.sin(progress * Math.PI));
  if (m.flipAxis === "horizontal") {
    const angle = (1 - p) * Math.PI;
    flipScaleX = Math.max(0.08, Math.abs(Math.cos(angle)));
    skewY += Math.sin(angle) * 0.14;
  } else if (m.flipAxis === "vertical") {
    const angle = (1 - p) * Math.PI;
    flipScaleY = Math.max(0.08, Math.abs(Math.cos(angle)));
  } else if (m.flipAxis === "book") {
    const angle = (1 - p) * (Math.PI * 0.45);
    flipScaleX = Math.max(0.18, Math.cos(angle));
    skewY -= Math.sin(angle) * 0.18;
  }

  const shadowScale = m.shadowPulse ? 0.85 + 0.3 * Math.sin(progress * Math.PI * 2) : 1;
  const shimmerPos = m.shimmerSweep ? (progress * 1.4) % 1.2 : null;

  const centerX = width / 2 + offsetX;
  const centerY = headerH + (height - headerH - 36) / 2 + offsetY;

  // Ambient Aura Halo behind mockup
  if (ambientAura) {
    const pulse = 0.92 + 0.14 * Math.sin(progress * Math.PI * 2);
    const auraR = Math.max(cardW, cardH) * 0.72 * pulse;
    const aura = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, auraR);
    aura.addColorStop(0, primaryColor);
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.save();
    ctx.globalAlpha = 0.28 * opacity;
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Glossy Floor Reflection underneath primary card
  if (floorReflection) {
    ctx.save();
    ctx.globalAlpha = 0.18 * opacity;
    const refGrad = ctx.createRadialGradient(
      centerX,
      centerY + cardH * scale * 0.56,
      10,
      centerX,
      centerY + cardH * scale * 0.56,
      cardW * scale * 0.65
    );
    refGrad.addColorStop(0, secondaryColor);
    refGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = refGrad;
    ctx.fillRect(
      centerX - cardW * scale * 0.7,
      centerY + cardH * scale * 0.44,
      cardW * scale * 1.4,
      cardH * scale * 0.35
    );
    ctx.restore();
  }

  // Supporting Stacked / Companion Devices behind primary card
  if (m.multiDeviceMode === "stacked-cards") {
    for (let layer = 2; layer >= 1; layer--) {
      ctx.save();
      ctx.globalAlpha = opacity * (0.28 / layer);
      ctx.translate(centerX + layer * 24 * p, centerY - layer * 18 * p);
      ctx.rotate(rotRad + layer * 0.035 * p);
      roundRect(ctx, -cardW / 2, -cardH / 2, cardW, cardH, 16);
      ctx.fillStyle = "#161B26";
      ctx.fill();
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
  } else if (m.multiDeviceMode === "stagger-duet") {
    ctx.save();
    ctx.globalAlpha = opacity * 0.55;
    ctx.translate(centerX + cardW * 0.24 * p, centerY + 26 * (1 - p));
    ctx.scale(scale * 0.72, scale * 0.72);
    drawFramedMockup(
      ctx,
      img,
      -cardW / 2,
      -cardH / 2,
      cardW,
      cardH,
      "glass",
      domainLabel,
      brandTitle,
      primaryColor,
      null,
      0.7,
      showFrameHeader,
      phoneFitMode,
      focusX,
      progress
    );
    ctx.restore();
  }

  // Primary Animated Mockup Card
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(centerX, centerY);
  ctx.rotate(rotRad);
  ctx.transform(scale * flipScaleX, skewY, m.tiltX * 0.0025, scale * flipScaleY, 0, 0);

  drawFramedMockup(
    ctx,
    img,
    -cardW / 2,
    -cardH / 2,
    cardW,
    cardH,
    preset.frameStyle,
    domainLabel,
    brandTitle,
    primaryColor,
    shimmerPos,
    shadowScale,
    showFrameHeader,
    phoneFitMode,
    focusX,
    progress
  );

  if (cursorSpotlight || zoomLoupe) {
    drawMotionCursorAndLoupe(
      ctx,
      img,
      -cardW / 2,
      -cardH / 2,
      cardW,
      cardH,
      focusX,
      focusY,
      progress,
      primaryColor,
      zoomLoupe
    );
  }
  ctx.restore();

  // Floating 3D Stat / Callout Pill (Eye-Catching Social Proof)
  if (floatingBadge && floatingBadge.trim()) {
    const badgePop = evaluateEasing(clamp01((progress - 0.16) / 0.3), "spring");
    if (badgePop > 0.04) {
      const floatOff = Math.sin(progress * Math.PI * 2) * 7;
      const bx = Math.min(width - 140, centerX + cardW * scale * 0.34);
      const by = Math.max(headerH + 24, centerY - cardH * scale * 0.36 + floatOff);

      ctx.save();
      ctx.globalAlpha = opacity * clamp01(badgePop);
      ctx.translate(bx, by);
      ctx.scale(0.85 + 0.15 * badgePop, 0.85 + 0.15 * badgePop);
      ctx.font = "700 13px 'Plus Jakarta Sans', sans-serif";
      const textW = ctx.measureText(floatingBadge.trim()).width;
      const pillW = Math.min(width * 0.45, Math.max(120, textW + 34));
      const pillH = 34;

      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      roundRect(ctx, -pillW / 2, -pillH / 2, pillW, pillH, 10);
      ctx.fillStyle = "rgba(15, 18, 28, 0.9)";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(floatingBadge.trim(), 0, 0, pillW - 18);
      ctx.restore();
    }
  }

  // Companion Mobile Overlay for Laptop-to-Mobile transitions
  if (m.multiDeviceMode === "laptop-to-mobile") {
    const mobP = evaluateEasing(clamp01((progress - 0.18) / 0.65), "spring");
    const mobW = Math.min(180, width * 0.16);
    const mobH = mobW * 1.9;
    ctx.save();
    ctx.globalAlpha = mobP;
    ctx.translate(
      centerX + cardW * 0.42,
      centerY + cardH * 0.14 + (1 - mobP) * 60 + Math.sin(progress * Math.PI * 2) * 5
    );
    drawFramedMockup(
      ctx,
      img,
      -mobW / 2,
      -mobH / 2,
      mobW,
      mobH,
      "iphone",
      domainLabel,
      brandTitle,
      primaryColor,
      shimmerPos,
      0.9,
      showFrameHeader
    );
    ctx.restore();
  }

  // 4. Optional Brand Kit Badge & Logo Watermark (bottom-right)
  if (showFrameHeader && useBrandKit && brandKit && (brandKit.showDomainBadge || logoImg)) {
    ctx.save();
    const badgeY = height - 24;
    let cursorX = width - 26;
    ctx.textAlign = "right";

    if (brandKit.showDomainBadge && domainLabel) {
      ctx.font = "600 13px 'JetBrains Mono', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.82)";
      ctx.fillText(domainLabel, cursorX, badgeY);
      cursorX -= ctx.measureText(domainLabel).width + 10;
    }

    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      const sz = 22;
      roundRect(ctx, cursorX - sz, badgeY - 17, sz, sz, 5);
      ctx.clip();
      ctx.drawImage(logoImg, cursorX - sz, badgeY - 17, sz, sz);
    }
    ctx.restore();
  }
}
