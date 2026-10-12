import { useEffect, useRef, useState } from "react";
import { SearchClient } from "../lib/search-client";
import { keywordSearch } from "../lib/text";
import type { Chunk, SearchHit } from "../lib/types";
export function SearchPanel({
  chunks,
  onSource,
}: {
  chunks: Chunk[];
  onSource: (hit: SearchHit) => void;
}) {
  const [query, setQuery] = useState(""),
    [mode, setMode] = useState("keyword"),
    [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false),
    [ready, setReady] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]),
    [searching, setSearching] = useState(false);
  const client = useRef<SearchClient | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const c = new SearchClient((m) => {
      if (active) setMessage(m);
    });
    client.current = c;
    c.init()
      .then(() => {
        if (active) setLoaded(true);
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setMessage("Model unavailable. Disable and enable to retry.");
        }
      });
    return () => {
      active = false;
      c.dispose();
      client.current = null;
    };
  }, [enabled]);
  useEffect(() => {
    setReady(false);
    setResults([]);
    if (!loaded || !client.current) return;
    let active = true;
    setError("");
    setMessage("Updating semantic index…");
    client.current
      .index(chunks)
      .then((count) => {
        if (active) {
          setReady(true);
          setMessage(`Semantic search ready · ${count} indexed passages`);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
          setMessage(
            "Semantic indexing unavailable; keyword search still works.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [chunks, loaded]);
  useEffect(() => {
    setResults([]);
    setSearching(false);
    if (mode === "keyword" || !ready || !query.trim()) return;
    let active = true;
    setSearching(true);
    setError("");
    const timer = setTimeout(
      () =>
        client.current
          ?.search(query, mode)
          .then((hits) => {
            if (active) {
              setResults(hits);
              setSearching(false);
            }
          })
          .catch((e) => {
            if (active) {
              setError(e.message);
              setSearching(false);
            }
          }),
      350,
    );
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, mode, ready, chunks]);
  const hits =
    mode === "keyword"
      ? keywordSearch(chunks, query)
      : results.filter((h) =>
          chunks.some((c) => c.documentId === h.chunk.documentId),
        );
  function toggle() {
    setEnabled(!enabled);
    setLoaded(false);
    setReady(false);
    setMode("keyword");
    setResults([]);
    setError("");
    setMessage(enabled ? "" : "Preparing local model…");
  }
  return (
    <section className="panel search-panel">
      <div className="panel-title">
        <h3>Find the right passage</h3>
        <span className="chip">
          {mode === "keyword"
            ? "Keyword search"
            : mode === "semantic"
              ? "Semantic search"
              : "Hybrid search"}
        </span>
      </div>
      <p>Search all processed documents in English or Hindi.</p>
      <button onClick={toggle}>
        {enabled
          ? "Disable / cancel semantic search"
          : "Enable local semantic search"}
      </button>
      <p className="hint">
        Optional: downloads about 160 MB of model and runtime assets. English ↔
        हिन्दी inference runs on your device; document text stays in this tab.
        May need several hundred MB of memory.
      </p>
      {enabled && <p role="status">{message}</p>}
      <label>
        Search mode{" "}
        <select
          aria-label="Search mode"
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          <option value="keyword">Keyword</option>
          <option value="semantic" disabled={!ready}>
            Semantic · English ↔ हिन्दी
          </option>
          <option value="hybrid" disabled={!ready}>
            Hybrid · keywords + meaning
          </option>
        </select>
      </label>
      <label className="search-input">
        <span>⌕</span>
        <input
          aria-label="Search documents"
          placeholder="Ask in English or हिन्दी…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button onClick={() => setQuery("")} aria-label="Clear search">
            ×
          </button>
        )}
      </label>
      <small>
        {mode === "keyword"
          ? "Matches words in the same language. Enable semantic search for cross-language retrieval."
          : "Ranked source passages, not generated answers. Similarity does not prove relevance; unrelated questions can still return results."}
      </small>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="results" aria-live="polite">
        {searching ? (
          <p>Searching locally…</p>
        ) : query.trim() ? (
          hits.length ? (
            hits.map((h) => (
              <button
                className="result"
                key={h.chunk.id}
                onClick={() => onSource(h)}
              >
                <span>
                  {h.chunk.documentName} <b>Page {h.chunk.page} ↗</b>
                </span>
                <p>{h.chunk.text}</p>
              </button>
            ))
          ) : (
            <p className="empty-search">
              {mode !== "keyword" && !ready
                ? "Semantic index is updating or unavailable. Keyword search remains available."
                : "No matching passage. Try a word from the document."}
            </p>
          )
        ) : (
          <p className="empty-search">
            Source passages and page references appear here.
          </p>
        )}
      </div>
    </section>
  );
}
