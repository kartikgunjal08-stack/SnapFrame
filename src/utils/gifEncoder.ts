/**
 * Pure TypeScript GIF89a + LZW encoder (zero external dependencies or APIs).
 * Encodes an array of RGBA ImageData frames into an animated looping GIF Blob
 * using an optimized 256-color (6x6x6 RGB cube + 40-step grayscale ramp) palette
 * with ordered Bayer 2x2 dithering for crisp UI gradients and sharp text.
 */

function buildWebSafePlusGrayPalette(): { palette: Uint8Array; mapRgb: (r: number, g: number, b: number) => number } {
  const palette = new Uint8Array(256 * 3);
  let idx = 0;

  // 216 RGB cube colors (6x6x6)
  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        palette[idx * 3] = r * 51;
        palette[idx * 3 + 1] = g * 51;
        palette[idx * 3 + 2] = b * 51;
        idx++;
      }
    }
  }

  // 40 grayscale shades (indexes 216..255) for smooth dark UI & shadows
  for (let i = 0; i < 40; i++) {
    const v = Math.round((i / 39) * 255);
    palette[idx * 3] = v;
    palette[idx * 3 + 1] = v;
    palette[idx * 3 + 2] = v;
    idx++;
  }

  const mapRgb = (r: number, g: number, b: number): number => {
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    // Use high-precision grayscale ramp for near-neutral UI tones
    if (maxC - minC <= 10) {
      const lum = Math.round((r * 299 + g * 587 + b * 114) / 1000);
      return 216 + Math.min(39, Math.max(0, Math.round((lum / 255) * 39)));
    }
    const ri = Math.min(5, Math.max(0, Math.round(r / 51)));
    const gi = Math.min(5, Math.max(0, Math.round(g / 51)));
    const bi = Math.min(5, Math.max(0, Math.round(b / 51)));
    return ri * 36 + gi * 6 + bi;
  };

  return { palette, mapRgb };
}

function lzwEncode(indices: Uint8Array, minCodeSize: number): Uint8Array {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  const outBytes: number[] = [];

  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  let dict = new Map<number, number>();

  const resetDict = () => {
    dict = new Map<number, number>();
    codeSize = minCodeSize + 1;
    nextCode = eoiCode + 1;
  };

  let bitBuffer = 0;
  let bitCount = 0;
  const subBlock: number[] = [];

  const flushSubBlock = () => {
    if (subBlock.length === 0) return;
    outBytes.push(subBlock.length);
    for (let i = 0; i < subBlock.length; i++) {
      outBytes.push(subBlock[i]);
    }
    subBlock.length = 0;
  };

  const writeBits = (code: number, size: number) => {
    bitBuffer |= code << bitCount;
    bitCount += size;
    while (bitCount >= 8) {
      subBlock.push(bitBuffer & 0xff);
      if (subBlock.length === 255) flushSubBlock();
      bitBuffer >>= 8;
      bitCount -= 8;
    }
  };

  writeBits(clearCode, codeSize);

  let prefix = indices[0];
  for (let i = 1; i < indices.length; i++) {
    const k = indices[i];
    const key = (prefix << 8) | k;
    const found = dict.get(key);
    if (found !== undefined) {
      prefix = found;
    } else {
      writeBits(prefix, codeSize);
      if (nextCode < 4096) {
        dict.set(key, nextCode++);
        if (nextCode > 1 << codeSize && codeSize < 12) {
          codeSize++;
        }
      } else {
        writeBits(clearCode, codeSize);
        resetDict();
      }
      prefix = k;
    }
  }

  writeBits(prefix, codeSize);
  writeBits(eoiCode, codeSize);
  if (bitCount > 0) {
    subBlock.push(bitBuffer & 0xff);
  }
  flushSubBlock();
  outBytes.push(0); // block terminator

  return new Uint8Array(outBytes);
}

const BAYER_2X2 = [
  [-8, 4],
  [8, -4],
];

export function encodeGifFrames(
  frames: ImageData[],
  width: number,
  height: number,
  delayMs: number,
  loop = true
): Blob {
  const { palette, mapRgb } = buildWebSafePlusGrayPalette();
  const chunks: Uint8Array[] = [];

  const pushBytes = (bytes: number[]) => chunks.push(new Uint8Array(bytes));
  const pushStr = (s: string) => {
    const arr = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) arr[i] = s.charCodeAt(i);
    chunks.push(arr);
  };

  // Header
  pushStr("GIF89a");

  // Logical Screen Descriptor (Global Color Table: 256 colors -> packed 0xF7)
  pushBytes([
    width & 0xff,
    (width >> 8) & 0xff,
    height & 0xff,
    (height >> 8) & 0xff,
    0xf7,
    0,
    0,
  ]);
  chunks.push(palette);

  // Netscape Looping Application Extension
  if (loop) {
    pushBytes([0x21, 0xff, 0x0b]);
    pushStr("NETSCAPE2.0");
    pushBytes([0x03, 0x01, 0x00, 0x00, 0x00]);
  }

  const delayCs = Math.max(2, Math.round(delayMs / 10));
  const indexed = new Uint8Array(width * height);

  for (const frame of frames) {
    // Graphic Control Extension
    pushBytes([0x21, 0xf9, 0x04, 0x00, delayCs & 0xff, (delayCs >> 8) & 0xff, 0x00, 0x00]);

    // Image Descriptor
    pushBytes([
      0x2c,
      0x00,
      0x00,
      0x00,
      0x00,
      width & 0xff,
      (width >> 8) & 0xff,
      height & 0xff,
      (height >> 8) & 0xff,
      0x00,
    ]);

    const d = frame.data;
    for (let y = 0; y < height; y++) {
      const bRow = BAYER_2X2[y & 1];
      for (let x = 0; x < width; x++) {
        const p = (y * width + x) * 4;
        const dither = bRow[x & 1];
        const r = Math.min(255, Math.max(0, d[p] + dither));
        const g = Math.min(255, Math.max(0, d[p + 1] + dither));
        const b = Math.min(255, Math.max(0, d[p + 2] + dither));
        indexed[y * width + x] = mapRgb(r, g, b);
      }
    }

    // LZW Minimum Code Size = 8
    pushBytes([0x08]);
    chunks.push(lzwEncode(indexed, 8));
  }

  // GIF Trailer
  pushBytes([0x3b]);

  const blobParts: BlobPart[] = chunks.map((chunk) => chunk.slice().buffer);
  return new Blob(blobParts, { type: "image/gif" });
}
