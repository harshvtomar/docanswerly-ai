import { useEffect, useRef, useState } from "react";
import { loadPdf, renderPage } from "../lib/pdf";
export function Viewer({ url, page }: { url: string; page: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError("");
    // Render off-screen so old tasks cannot paint over a newly selected page.
    const task = (async () => {
      const pdf = await loadPdf(url);
      try {
        const p = await pdf.getPage(page);
        const buffer = document.createElement("canvas");
        await renderPage(p, buffer);
        if (!cancelled && canvas.current) {
          canvas.current.width = buffer.width;
          canvas.current.height = buffer.height;
          canvas.current.getContext("2d")!.drawImage(buffer, 0, 0);
        }
      } finally {
        await pdf.loadingTask.destroy();
      }
    })();
    task
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url, page]);
  return (
    <div className="pdf-paper">
      {busy && <p role="status">Rendering page…</p>}
      {error && <p role="alert">Could not render this page: {error}</p>}
      <canvas
        ref={canvas}
        aria-label={`PDF page ${page}`}
        style={{ display: busy || error ? "none" : "block" }}
      />
    </div>
  );
}
