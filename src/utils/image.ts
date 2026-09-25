/** Browser image helpers (decode, resize, thumbnails, stats). */

export interface DecodedImage {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  close(): void;
}

export async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob);
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch {
      /* fall through to <img> decoding */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/jpeg', quality = 0.9): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image encoding failed'))), type, quality),
  );
}

/** Downscales an image so its longest side is at most `max`, returns JPEG. */
export async function resizeImage(blob: Blob, max = 1600): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await decodeImage(blob);
  try {
    const s = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.round(img.width * s);
    const h = Math.round(img.height * s);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img.source, 0, 0, w, h);
    return { blob: await canvasToBlob(c), width: w, height: h };
  } finally {
    img.close();
  }
}

export async function makeThumbnail(source: CanvasImageSource, width: number, height: number, max = 320): Promise<string> {
  const s = Math.min(1, max / Math.max(width, height));
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(width * s));
  c.height = Math.max(1, Math.round(height * s));
  const ctx = c.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.72);
}

/** Mean luma (0..255) sampled on a tiny canvas. */
export function meanBrightness(source: CanvasImageSource): number | undefined {
  try {
    const c = document.createElement('canvas');
    c.width = 48;
    c.height = 64;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return undefined;
    ctx.drawImage(source, 0, 0, c.width, c.height);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (d.length / 4);
  } catch {
    return undefined;
  }
}
