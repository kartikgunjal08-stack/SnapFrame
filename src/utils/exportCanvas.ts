import { toBlob, toJpeg, toPng } from "html-to-image";
import { ExportFormat, ExportScale } from "../types/studio";

export async function exportElementToImage(
  element: HTMLElement,
  format: ExportFormat,
  scale: ExportScale,
  fileNameBase: string
): Promise<void> {
  const options = {
    pixelRatio: scale,
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
  link.download = `${cleanName || "snapframy-mockup"}-${scale}x.${format}`;
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
