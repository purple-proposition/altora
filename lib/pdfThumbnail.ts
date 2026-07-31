import { createCanvas } from '@napi-rs/canvas';

// pdfjs-dist's main build assumes a browser (uses DOMMatrix etc.) — the
// "legacy" build is the one meant to run under plain Node.js.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pdfjsLib: any = null;
async function getPdfjs() {
  if (!pdfjsLib) pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  return pdfjsLib;
}

// Rendered small on purpose — this only ever backs a ~160px-wide "peek at
// the file" thumbnail, never a readable full-page view (opening the actual
// file already covers that), so there's no reason to spend more bytes/CPU
// than a small PNG needs.
const THUMBNAIL_SCALE = 0.5;

export async function renderPdfFirstPageToPng(pdfBytes: Buffer): Promise<Buffer | null> {
  try {
    const pdfjs = await getPdfjs();
    const doc = await pdfjs.getDocument({ data: new Uint8Array(pdfBytes), disableWorker: true }).promise;
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
    return canvas.toBuffer('image/png');
  } catch {
    // A thumbnail is a nice-to-have, not essential — callers fall back to
    // the generic file icon when this returns null (corrupt PDF, unusual
    // encoding pdfjs can't parse, etc).
    return null;
  }
}
