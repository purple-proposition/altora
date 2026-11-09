// CV thumbnails are disabled: rendering a PDF page needs @napi-rs/canvas, a
// native Node addon, which can't run on Cloudflare Workers. Thumbnails are a
// nice-to-have and callers already fall back to the generic file icon when
// this returns null, so returning null keeps every upload working.
export async function renderPdfFirstPageToPng(_pdfBytes: Buffer): Promise<Buffer | null> {
  return null;
}
