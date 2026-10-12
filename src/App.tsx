import { useMemo, useRef, useState } from "react";
import { SearchPanel } from "./components/SearchPanel";
import { Viewer } from "./components/Viewer";
import { extractPdf, validateFile } from "./lib/pdf";
import { chunkDocument } from "./lib/text";
import type { DocumentRecord, SearchHit } from "./lib/types";
export default function App() {
  const [docs, setDocs] = useState<DocumentRecord[]>([]),
    [selected, setSelected] = useState(""),
    [page, setPage] = useState(1),
    [tab, setTab] = useState<"text" | "pdf">("text");
  const [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(""),
    [error, setError] = useState(""),
    [force, setForce] = useState(false),
    [activity, setActivity] = useState<string[]>([]),
    [drag, setDrag] = useState(false);
  const uploadAbort = useRef<AbortController | null>(null);
  const lock = useRef(false),
    input = useRef<HTMLInputElement>(null);
  const doc = docs.find((d) => d.id === selected);
  const current = doc?.pages.find((p) => p.page === page);
  const chunks = useMemo(() => docs.flatMap((d) => chunkDocument(d)), [docs]);
  const pages = docs.reduce((n, d) => n + d.pages.length, 0);
  const ocr = docs.reduce(
    (n, d) => n + d.pages.filter((p) => p.method === "ocr").length,
    0,
  );
  const note = (message: string) =>
    setActivity((a) => [message, ...a].slice(0, 4));
  async function upload(files: File[]) {
    if (lock.current) return;
    lock.current = true;
    uploadAbort.current = new AbortController();
    setBusy(true);
    setError("");
    try {
      if (docs.length + files.length > 8)
        throw new Error(
          "Keep up to 8 documents in this workspace. Remove one to add more.",
        );
      for (const file of files) {
        if (uploadAbort.current.signal.aborted) break;
        try {
          validateFile(file);
          const result = await extractPdf(
            file,
            setProgress,
            force,
            uploadAbort.current.signal,
          );
          const d: DocumentRecord = {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            url: URL.createObjectURL(file),
            pages: result,
            createdAt: new Date().toISOString(),
          };
          setDocs((ds) => [...ds, d]);
          setSelected(d.id);
          setPage(1);
          note(`Processed ${file.name} · ${result.length} pages`);
        } catch (e) {
          setError(
            `${file.name}: ${e instanceof Error ? e.message : "Processing failed"}`,
          );
          note(`Could not process ${file.name}`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      lock.current = false;
      setBusy(false);
      setProgress("");
      if (input.current) input.current.value = "";
    }
  }
  async function sample() {
    if (lock.current) return;
    try {
      const r = await fetch(
        `${import.meta.env.BASE_URL}fixtures/bilingual-text.pdf`,
      );
      if (!r.ok) throw new Error("Sample download unavailable");
      await upload([
        new File([await r.blob()], "bilingual-text.pdf", {
          type: "application/pdf",
        }),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sample failed");
    }
  }
  function remove(d: DocumentRecord) {
    URL.revokeObjectURL(d.url);
    setDocs((ds) => ds.filter((x) => x.id !== d.id));
    if (selected === d.id) {
      setSelected(docs.find((x) => x.id !== d.id)?.id ?? "");
      setPage(1);
    }
    note(`Removed ${d.name}`);
  }
  function source(h: SearchHit) {
    setSelected(h.chunk.documentId);
    setPage(h.chunk.page);
    setTab("text");
    document
      .getElementById("reader")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <>
      <a className="skip" href="#workspace">
        Skip to workspace
      </a>
      <header>
        <a className="brand" href="#">
          <span className="brand-icon">
            D<span>↗</span>
          </span>
          <span>
            DocAnswerly <b>AI</b>
          </span>
        </a>
        <nav aria-label="Main">
          <a href="#workspace">Workspace</a>
          <a href="#how">How it works</a>
          <a
            href="https://github.com/harshvtomar/docanswerly-ai"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
        </nav>
        <span className="private">
          <i /> Browser-local
        </span>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">
              <span /> DOCUMENT INTELLIGENCE, IN TWO LANGUAGES
            </p>
            <h1>
              Your documents.
              <br />A little more <em>understood.</em>
            </h1>
            <p className="tagline">
              Upload Documents. Ask Questions. Get Answers.
            </p>
            <p className="intro">
              Turn English and Hindi PDFs into searchable knowledge.
              <br className="desktop" /> Read, explore, and trace every result
              back to its page.
            </p>
            <div className="hero-actions">
              <button
                className="primary"
                disabled={busy}
                onClick={() => input.current?.click()}
              >
                ＋ Upload a PDF
              </button>
              <button className="plain" disabled={busy} onClick={sample}>
                Try a bilingual sample ↗
              </button>
            </div>
            <div className="pills">
              <span>English + हिन्दी</span>
              <span>Searchable & scanned PDFs</span>
              <span>No account needed</span>
            </div>
          </div>
          <aside className="hero-note">
            <div className="note-top">
              <span className="mini-icon">≡</span>
              <span>FROM DOCUMENT TO DISCOVERY</span>
              <span>↗</span>
            </div>
            <p className="note-hindi" lang="hi">
              हर दस्तावेज़ में
              <br />
              कुछ जानने लायक है।
            </p>
            <p>
              There’s something worth knowing
              <br />
              in every document.
            </p>
            <div className="note-bottom">
              <span>Read. Search. Discover.</span>
              <span>EN ↔ हिन्दी</span>
            </div>
          </aside>
        </section>
        <section id="workspace" className="workspace">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR KNOWLEDGE, ORGANIZED</p>
              <h2>Document workspace</h2>
            </div>
            <span className="session-badge">Session-only storage</span>
          </div>
          <div className="metrics">
            <div>
              <strong>{docs.length}</strong>
              <span>Documents</span>
            </div>
            <div>
              <strong>{pages}</strong>
              <span>Pages processed</span>
            </div>
            <div>
              <strong>{chunks.length}</strong>
              <span>Searchable chunks</span>
            </div>
            <div>
              <strong>{ocr}</strong>
              <span>OCR pages</span>
            </div>
          </div>
          <div className="work-grid">
            <aside className="library panel">
              <div className="panel-title">
                <h3>Your library</h3>
                <span>{docs.length}/8</span>
              </div>
              <div
                className={`dropzone ${drag ? "drag" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  void upload([...e.dataTransfer.files]);
                }}
              >
                <span className="upload-icon">↑</span>
                <b>Bring your documents</b>
                <p>Drop PDFs here or choose files</p>
                <button disabled={busy} onClick={() => input.current?.click()}>
                  Choose PDFs
                </button>
                <small>25 MB / file · 40 pages / file</small>
                <input
                  ref={input}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  aria-label="Upload PDFs"
                  onChange={(e) => void upload([...(e.target.files ?? [])])}
                />
              </div>
              <label className="check">
                <input
                  type="checkbox"
                  checked={force}
                  disabled={busy}
                  onChange={(e) => setForce(e.target.checked)}
                />{" "}
                Force OCR for new uploads
              </label>
              <small className="hint">
                Use for broken text encoding or pages with both text and images.
              </small>
              {busy && (
                <div role="status" className="processing">
                  <span className="spinner" />
                  {progress || "Preparing…"}
                  <button onClick={() => uploadAbort.current?.abort()}>
                    Cancel processing
                  </button>
                  <small>
                    Large scans can take a few minutes. Keep this tab open.
                  </small>
                </div>
              )}
              {error && (
                <div role="alert" className="error">
                  {error}
                  <button
                    onClick={() => setError("")}
                    aria-label="Dismiss error"
                  >
                    ×
                  </button>
                </div>
              )}
              <div className="document-list">
                {docs.length ? (
                  docs.map((d) => (
                    <div
                      key={d.id}
                      className={`document ${selected === d.id ? "selected" : ""}`}
                    >
                      <button
                        className="doc-select"
                        onClick={() => {
                          setSelected(d.id);
                          setPage(1);
                        }}
                      >
                        <span className="file-icon">PDF</span>
                        <span>
                          <b>{d.name}</b>
                          <small>
                            {d.pages.length} pages ·{" "}
                            {(d.size / 1024).toFixed(0)} KB
                            {d.pages.some((p) => p.method === "error")
                              ? " · Partial"
                              : " · Ready"}
                          </small>
                        </span>
                      </button>
                      <button
                        className="remove"
                        disabled={busy}
                        aria-label={`Remove ${d.name}`}
                        onClick={() => remove(d)}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="library-empty">
                    <b>A fresh start.</b>
                    <p>
                      Your PDFs will appear here.
                      <br />
                      Only you can see them.
                    </p>
                  </div>
                )}
              </div>
              <div className="privacy-note">
                <span>◈</span>
                <p>
                  Files stay in this browser tab. Refreshing clears your
                  workspace. Nothing is uploaded to an AI service.
                </p>
              </div>
            </aside>
            <section id="reader" className="reader panel">
              <div className="panel-title">
                <h3>{doc ? doc.name : "Document reader"}</h3>
                <div className="tabs" role="tablist" aria-label="Reader view">
                  <button
                    role="tab"
                    aria-selected={tab === "text"}
                    onClick={() => setTab("text")}
                  >
                    Extracted text
                  </button>
                  <button
                    role="tab"
                    aria-selected={tab === "pdf"}
                    onClick={() => setTab("pdf")}
                  >
                    Original PDF
                  </button>
                </div>
              </div>
              {doc ? (
                <>
                  <div className="page-controls">
                    <span>
                      {current?.method === "ocr"
                        ? `OCR · ${current.confidence?.toFixed(0)}% engine confidence`
                        : current?.method === "error"
                          ? "Page failed"
                          : "Embedded text"}
                    </span>
                    <div>
                      <button
                        aria-label="Previous page"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        ←
                      </button>
                      <span>
                        Page {page} of {doc.pages.length}
                      </span>
                      <button
                        aria-label="Next page"
                        disabled={page >= doc.pages.length}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        →
                      </button>
                    </div>
                  </div>
                  {tab === "pdf" ? (
                    <Viewer url={doc.url} page={page} />
                  ) : (
                    <div className="extracted" role="tabpanel">
                      {current?.error ? (
                        <p role="alert">
                          This page could not be extracted: {current.error}.
                          Other pages remain available.
                        </p>
                      ) : (
                        <>
                          <span className="page-label">
                            PAGE {page.toString().padStart(2, "0")}
                          </span>
                          <p>
                            {current?.text ||
                              "No readable text found on this page."}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="reader-empty">
                  <div className="paper-stack">
                    <span>≡</span>
                    <span className="paper-letter">अ</span>
                  </div>
                  <h3>A clearer view starts here.</h3>
                  <p>
                    Upload a PDF to read its pages and extracted text.
                    <br />
                    English, Hindi, or a little of both.
                  </p>
                  <button className="plain" disabled={busy} onClick={sample}>
                    Explore the sample document →
                  </button>
                </div>
              )}
            </section>
          </div>
          <div className="bottom-grid">
            <SearchPanel chunks={chunks} onSource={source} />
            <section className="panel ask-panel">
              <div className="panel-title">
                <h3>Ask your documents</h3>
                <span className="chip pending">Coming next</span>
              </div>
              <div className="ask-symbol">✧</div>
              <h3>Answers with evidence.</h3>
              <p>
                Document-grounded AI answers are not enabled yet. You can
                already search passages and open their source pages.
              </p>
              <label>
                Answer language
                <select disabled aria-label="Answer language">
                  <option>Auto · match your question</option>
                  <option>English</option>
                  <option>हिन्दी</option>
                </select>
              </label>
              <textarea
                disabled
                aria-label="Ask a question"
                placeholder="Ask in English or Hindi…"
              />
              <button disabled className="primary">
                AI connection pending
              </button>
              <small>No simulated answers. No exposed API keys.</small>
            </section>
          </div>
          {activity.length > 0 && (
            <div className="activity">
              <h3>Recent activity</h3>
              {activity.map((a, i) => (
                <p key={`${i}-${a}`}>✓ {a}</p>
              ))}
            </div>
          )}
        </section>
        <section id="how" className="how">
          <p className="eyebrow">A SIMPLE PATH TO YOUR SOURCES</p>
          <h2>Less searching. More understanding.</h2>
          <div>
            <article>
              <span>01</span>
              <h3>Bring a PDF</h3>
              <p>
                Upload English, Hindi, or mixed-language documents. Text and
                scanned pages are supported.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Make it readable</h3>
              <p>
                Extract embedded text or run bilingual OCR, right in your
                browser.
              </p>
            </article>
            <article>
              <span>03</span>
              <h3>Follow the evidence</h3>
              <p>
                Find matching passages and navigate to the original source page.
              </p>
            </article>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="#">
          DocAnswerly <b>AI</b>
        </a>
        <p>Upload Documents. Ask Questions. Get Answers.</p>
        <span>v0.2.0 · Built for English + हिन्दी</span>
      </footer>
    </>
  );
}
