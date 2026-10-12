import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { createWorker, type Worker } from "tesseract.js";
import { needsOcr, normalizeText } from "./text";
import { bounded } from "./operation";
import type { PageText } from "./types";
GlobalWorkerOptions.workerSrc = workerUrl;
const base = import.meta.env.BASE_URL;
export const MAX_BYTES = 25 * 1024 * 1024,
  MAX_PAGES = 40;
export function validateFile(file: Pick<File, "name" | "size">) {
  if (!/\.pdf$/i.test(file.name)) throw new Error("Choose a PDF file (.pdf).");
  if (!file.size) throw new Error("This PDF is empty.");
  if (file.size > MAX_BYTES)
    throw new Error("This demo accepts PDFs up to 25 MB.");
}
export async function loadPdf(
  data: Uint8Array | string,
): Promise<PDFDocumentProxy> {
  return getDocument({
    ...(typeof data === "string" ? { url: data } : { data }),
    cMapUrl: `${base}pdf/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${base}pdf/standard_fonts/`,
    wasmUrl: `${base}pdf/wasm/`,
  }).promise;
}
export async function renderPage(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale = 1.5,
) {
  const original = page.getViewport({ scale });
  const cap = Math.min(
    1,
    Math.sqrt(6_000_000 / (original.width * original.height)),
  );
  const viewport = page.getViewport({ scale: scale * cap });
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  await page.render({ canvas, viewport }).promise;
}
export async function extractPdf(
  file: File,
  onProgress: (message: string) => void,
  forceOcr = false,
  signal?: AbortSignal,
): Promise<PageText[]> {
  validateFile(file);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-"))
    throw new Error("Invalid PDF header. Please choose a valid PDF.");
  let pdf: PDFDocumentProxy | undefined, worker: Worker | undefined;
  const pages: PageText[] = [];
  try {
    let loadingExpired = false;
    const loading = loadPdf(bytes);
    loading.then(
      (p) => {
        if (loadingExpired || signal?.aborted) void p.loadingTask.destroy();
      },
      () => {},
    );
    pdf = await bounded(loading, signal, 30000, () => {
      loadingExpired = true;
    });
    signal?.throwIfAborted();
    if (pdf.numPages > MAX_PAGES)
      throw new Error(
        "This demo accepts up to 40 pages. Split this PDF into smaller files.",
      );
    for (let n = 1; n <= pdf.numPages; n++) {
      signal?.throwIfAborted();
      onProgress(`Reading page ${n} of ${pdf.numPages}`);
      let page: PDFPageProxy | undefined;
      try {
        page = await bounded(pdf.getPage(n), signal, 30000);
        const content = await bounded(page.getTextContent(), signal, 30000);
        let text = normalizeText(
          content.items
            .map((item) =>
              "str" in item ? item.str + (item.hasEOL ? "\n" : "") : "",
            )
            .join(""),
        );
        if (forceOcr || needsOcr(text)) {
          onProgress(
            `OCR · page ${n} of ${pdf.numPages} · loading English + Hindi`,
          );
          if (!worker) {
            let expired = false;
            const creating = createWorker(["eng", "hin"], 1, {
              workerPath: `${base}ocr/worker.min.js`,
              corePath: `${base}ocr/core`,
              langPath: `${base}ocr/lang`,
              logger: (m) => {
                if (m.status === "recognizing text")
                  onProgress(
                    `OCR · page ${n} of ${pdf!.numPages} · ${Math.round(m.progress * 100)}%`,
                  );
              },
            });
            creating.then(
              (w) => {
                if (expired) void w.terminate();
              },
              () => {},
            );
            worker = await bounded(creating, signal, 120000, () => {
              expired = true;
            });
          }
          const canvas = document.createElement("canvas");
          try {
            await bounded(renderPage(page, canvas, 2), signal, 30000, () => {
              void pdf?.loadingTask.destroy();
            });
            const result = await bounded(
              worker.recognize(canvas),
              signal,
              120000,
              () => {
                void worker?.terminate();
                worker = undefined;
              },
            );
            text = normalizeText(result.data.text);
            pages.push({
              page: n,
              text,
              method: "ocr",
              confidence: result.data.confidence,
            });
          } finally {
            canvas.width = canvas.height = 0;
          }
        } else pages.push({ page: n, text, method: "text" });
      } catch (err) {
        if (signal?.aborted)
          throw new DOMException("Processing cancelled", "AbortError");
        pages.push({
          page: n,
          text: "",
          method: "error",
          error: err instanceof Error ? err.message : "Page processing failed",
        });
      } finally {
        page?.cleanup();
      }
    }
    if (!pages.some((p) => p.method !== "error"))
      throw new Error(
        "No pages could be processed. The PDF may be damaged, password-protected, or OCR assets could not load.",
      );
    return pages;
  } catch (err) {
    if (err instanceof Error && err.name === "PasswordException")
      throw new Error(
        "Password-protected PDFs are not supported. Upload an unlocked copy.",
      );
    throw err;
  } finally {
    await worker?.terminate();
    await pdf?.loadingTask.destroy();
  }
}
