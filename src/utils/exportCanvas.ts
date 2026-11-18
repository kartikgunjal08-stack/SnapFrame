import { toBlob, toJpeg, toPng } from "html-to-image";
import { ExportFormat, ExportScale, StudioCssAnimation } from "../types/studio";

export async function exportElementToImage(
  element: HTMLElement,
  format: ExportFormat,
  scale: ExportScale,
  fileNameBase: string,
  pixelSpec?: { width: number; height: number },
  customSuffix?: string
): Promise<void> {
  const options = {
    pixelRatio: pixelSpec ? 1 : scale,
    canvasWidth: pixelSpec?.width,
    canvasHeight: pixelSpec?.height,
    cacheBust: false,
    quality: 0.96,
    skipAutoScale: false,
  };

  const dataUrl =
    format === "jpeg"
      ? await toJpeg(element, options)
      : await toPng(element, options);

  const link = document.createElement("a");
  const cleanName = fileNameBase.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-");
  const suffix = customSuffix
    ? customSuffix
    : pixelSpec
      ? `${pixelSpec.width}x${pixelSpec.height}`
      : `${scale}x`;
  link.download = `${cleanName || "snapframy-mockup"}-${suffix}.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyElementToClipboard(
  element: HTMLElement,
  scale: ExportScale
): Promise<boolean> {
  if (!navigator.clipboard || typeof ClipboardItem === "undefined") {
    throw new Error("Clipboard image copy is not supported in this browser context.");
  }

  const blob = await toBlob(element, {
    pixelRatio: scale,
    cacheBust: false,
  });

  if (!blob) {
    throw new Error("Failed to render mockup image.");
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      "image/png": blob,
    }),
  ]);

  return true;
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode snapshot frame."));
    img.src = src;
  });
}

function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export async function exportStudioVideo({
  stageElement,
  deviceElement,
  animation = "tilt-orbit",
  fileNameBase,
  durationSec = 4,
  onProgress,
}: {
  stageElement: HTMLElement;
  deviceElement: HTMLElement;
  animation?: StudioCssAnimation;
  fileNameBase: string;
  durationSec?: number;
  onProgress?: (pct: number) => void;
}): Promise<{ ext: "mp4" | "webm"; width: number; height: number }> {
  const canvasEl = document.createElement("canvas");
  if (typeof MediaRecorder === "undefined" || !canvasEl.captureStream) {
    throw new Error("Canvas video recording is not supported in this browser.");
  }

  const mimeCandidates = [
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m));
  if (!mimeType) {
    throw new Error("No supported video encoder found in this browser.");
  }
  const ext: "mp4" | "webm" = mimeType.includes("mp4") ? "mp4" : "webm";

  const stageRect = stageElement.getBoundingClientRect();
  const deviceRect = deviceElement.getBoundingClientRect();
  const safeW = Math.max(320, stageRect.width);
  const safeH = Math.max(240, stageRect.height);

  // Target crisp HD resolution with even dimensions required by H.264/MP4 codecs
  const scaleFactor = Math.min(2, 1280 / Math.max(safeW, safeH));
  const outW = Math.max(320, Math.round((safeW * scaleFactor) / 2) * 2);
  const outH = Math.max(240, Math.round((safeH * scaleFactor) / 2) * 2);

  canvasEl.width = outW;
  canvasEl.height = outH;
  const ctx = canvasEl.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D recording canvas.");
  }

  onProgress?.(6);

  // Capture backdrop + headlines separately from device so the device animates cleanly on canvas
  const [stageBgUrl, deviceUrl] = await Promise.all([
    toPng(stageElement, {
      pixelRatio: 2,
      cacheBust: false,
      filter: (node) =>
        !(node instanceof HTMLElement && node.dataset.mockupDevice === "true"),
    }),
    toPng(deviceElement, {
      pixelRatio: 2,
      cacheBust: false,
    }),
  ]);

  const [stageBgImg, deviceImg] = await Promise.all([
    loadImageElement(stageBgUrl),
    loadImageElement(deviceUrl),
  ]);

  onProgress?.(12);

  const relCenterX = ((deviceRect.left + deviceRect.width / 2 - stageRect.left) / safeW) * outW;
  const relCenterY = ((deviceRect.top + deviceRect.height / 2 - stageRect.top) / safeH) * outH;
  const drawW = (deviceRect.width / safeW) * outW;
  const drawH = (deviceRect.height / safeH) * outH;

  const activeAnim: StudioCssAnimation = animation === "none" ? "tilt-orbit" : animation;

  const renderFrame = (progress: number) => {
    ctx.clearRect(0, 0, outW, outH);
    ctx.drawImage(stageBgImg, 0, 0, outW, outH);

    // Compute frame transform matching the CSS animation sequence
    const introP = Math.min(1, progress / 0.28);
    const introEase = easeOutExpo(introP);

    let alpha = 1;
    let offsetY = 0;
    let scaleX = 1;
    let scaleY = 1;
    let skewY = 0;
    let rotRad = 0;

    if (activeAnim === "entrance-rise") {
      alpha = Math.min(1, introP * 1.4);
      offsetY = (1 - introEase) * 44;
      const sc = 0.88 + 0.12 * introEase;
      scaleX = sc;
      scaleY = sc * (0.94 + 0.06 * introEase);
      rotRad = ((1 - introEase) * -2.2 * Math.PI) / 180;
    } else if (activeAnim === "spring-pop") {
      const springP = Math.min(1, progress / 0.34);
      const back = easeOutBack(springP);
      alpha = Math.min(1, springP * 1.6);
      offsetY = (1 - back) * 28;
      const sc = 0.8 + 0.2 * back;
      scaleX = sc;
      scaleY = sc;
      rotRad = ((1 - back) * -2.5 * Math.PI) / 180;
    } else if (activeAnim === "float-hover") {
      alpha = Math.min(1, introP * 1.5);
      const wave = Math.sin(progress * Math.PI * 2);
      offsetY = (1 - introEase) * 26 + wave * -12;
      const sc = (0.92 + 0.08 * introEase) * (1 + 0.012 * Math.sin(progress * Math.PI * 2));
      scaleX = sc;
      scaleY = sc;
    } else {
      // tilt-orbit (subtle entrance + 3D sway)
      alpha = Math.min(1, introP * 1.5);
      const sway = Math.sin(progress * Math.PI * 2);
      const pitch = Math.cos(progress * Math.PI * 2);
      offsetY = (1 - introEase) * 28 + Math.sin(progress * Math.PI * 4) * -6;
      const sc = 0.91 + 0.09 * introEase;
      scaleX = sc * (1 - Math.abs(sway) * 0.018);
      scaleY = sc * (1 - Math.abs(pitch) * 0.014);
      skewY = sway * 0.032;
      rotRad = (sway * 1.1 * Math.PI) / 180;
    }

    // Soft ambient floor shadow beneath the mockup device
    ctx.save();
    ctx.globalAlpha = 0.32 * alpha;
    const shadowGrad = ctx.createRadialGradient(
      relCenterX,
      relCenterY + drawH * 0.48 + offsetY * 0.3,
      8,
      relCenterX,
      relCenterY + drawH * 0.48 + offsetY * 0.3,
      drawW * 0.56
    );
    shadowGrad.addColorStop(0, "rgba(0,0,0,0.75)");
    shadowGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(
      relCenterX - drawW * 0.65,
      relCenterY + drawH * 0.25,
      drawW * 1.3,
      drawH * 0.45
    );
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(relCenterX, relCenterY + offsetY);
    ctx.rotate(rotRad);
    ctx.transform(scaleX, skewY, 0, scaleY, 0, 0);
    ctx.drawImage(deviceImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  // Draw initial frame before starting MediaRecorder
  renderFrame(0);

  const stream = canvasEl.captureStream(30);
  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 6_000_000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  await new Promise<void>((resolve, reject) => {
    recorder.onstop = () => {
      if (chunks.length === 0) {
        reject(new Error("Recorded video stream was empty."));
        return;
      }
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const cleanName = fileNameBase.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-");
      link.download = `${cleanName || "snapframy-mockup"}-motion.${ext}`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      resolve();
    };

    recorder.onerror = () => reject(new Error("Video recording encountered an error."));
    recorder.start(200);

    const startMs = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - startMs) / 1000;
      const p = Math.min(1, elapsed / durationSec);
      renderFrame(p);
      onProgress?.(Math.min(99, Math.round(12 + p * 87)));

      if (elapsed < durationSec) {
        requestAnimationFrame(tick);
      } else {
        recorder.stop();
      }
    };
    requestAnimationFrame(tick);
  });

  onProgress?.(100);
  return { ext, width: outW, height: outH };
}

