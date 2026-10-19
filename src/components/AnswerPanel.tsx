import { useEffect, useRef, useState } from "react";
import {
  GroundedAnswerProvider,
  selectEvidence,
  type AnswerLanguage,
  type GroundedAnswer,
} from "../lib/answers";
import { SearchClient } from "../lib/search-client";
import type { LocalGeneration } from "../lib/local-generation";
import type { Chunk, SearchHit } from "../lib/types";
export function AnswerPanel({
  chunks,
  onSource,
}: {
  chunks: Chunk[];
  onSource: (hit: SearchHit) => void;
}) {
  const [enabled, setEnabled] = useState(false),
    [loaded, setLoaded] = useState(false),
    [ready, setReady] = useState(false);
  const [question, setQuestion] = useState(""),
    [language, setLanguage] = useState<AnswerLanguage>("auto");
  const [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const runtime = useRef<LocalGeneration | null>(null),
    search = useRef<SearchClient | null>(null),
    operation = useRef<AbortController | null>(null);
  const revision = useRef(0);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const abort = new AbortController();
    operation.current = abort;
    const base = new URL(import.meta.env.BASE_URL, location.origin).href;
    const c = new SearchClient((m) => {
      if (active) setMessage(m);
    });
    search.current = c;
    let local: LocalGeneration | undefined;
    (async () => {
      const { LocalGeneration } = await import("../lib/local-generation");
      if (!active) return;
      local = new LocalGeneration(base);
      runtime.current = local;
      await local.load(
        base,
        (m) => {
          if (active) setMessage(m);
        },
        AbortSignal.any([abort.signal, AbortSignal.timeout(240000)]),
      );
      if (!active) return;
      setMessage("Loading multilingual evidence retrieval…");
      await c.init();
      if (active) setLoaded(true);
    })().catch(() => {
      if (active) {
        setError(
          "Local AI could not load. Your browser may lack memory or storage. Disable and retry; document search remains available.",
        );
        setMessage("Local answers unavailable.");
      }
    });
    return () => {
      active = false;
      abort.abort();
      operation.current?.abort();
      c.dispose();
      search.current = null;
      void local?.dispose().catch(() => {});
      runtime.current = null;
    };
  }, [enabled]);
  useEffect(() => {
    const current = ++revision.current;
    operation.current?.abort();
    setAnswer(null);
    setReady(false);
    setBusy(false);
    if (!loaded || !search.current) return;
    setMessage("Indexing evidence for answers…");
    search.current
      .index(chunks)
      .then(() => {
        if (revision.current === current) {
          setReady(true);
          setMessage("Local answers ready");
        }
      })
      .catch((e) => {
        if (revision.current === current) setError(e.message);
      });
  }, [chunks, loaded]);
  function toggle() {
    operation.current?.abort();
    ++revision.current;
    setEnabled(!enabled);
    setLoaded(false);
    setReady(false);
    setBusy(false);
    setAnswer(null);
    setError("");
    setMessage("Preparing optional local AI…");
  }
  async function ask() {
    if (!ready || !runtime.current || !search.current || busy) return;
    const current = revision.current,
      abort = new AbortController();
    operation.current = abort;
    const signal = AbortSignal.any([abort.signal, AbortSignal.timeout(180000)]);
    setBusy(true);
    setError("");
    setAnswer(null);
    setMessage("Retrieving document evidence…");
    try {
      const evidence = selectEvidence(
        await search.current.search(question, "semantic"),
      );
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      setMessage("Generating locally · this can take a minute…");
      const result = await new GroundedAnswerProvider(runtime.current).answer(
        { question, evidence, language },
        signal,
      );
      if (revision.current === current && !signal.aborted) {
        setAnswer(result);
        setMessage("Local answer complete");
      }
    } catch (e) {
      if (revision.current === current) {
        setError(
          signal.aborted
            ? "Answer cancelled or timed out. You can retry."
            : e instanceof Error
              ? e.message
              : "Answer generation failed.",
        );
        setMessage(
          signal.aborted
            ? "Local answer cancelled or timed out. You can retry."
            : "Local answer failed. You can retry.",
        );
      }
    } finally {
      if (revision.current === current) {
        if (operation.current === abort) operation.current = null;
        setBusy(false);
      }
    }
  }
  return (
    <section className="panel ask-panel">
      <div className="panel-title">
        <h3>Ask your documents</h3>
        <span className="chip pending">Experimental · local AI</span>
      </div>
      <h3>Answers with evidence.</h3>
      <p>
        Optional Qwen3 0.6B runs on your device. It can make mistakes,
        especially in Hindi. Check the cited passages.
      </p>
      <button onClick={toggle}>
        {enabled
          ? "Disable local answers"
          : "Enable experimental local answers"}
      </button>
      <p className="hint">
        Downloads about 405 MB plus 160 MB for evidence retrieval. Model files
        are cached on this device; PDFs and questions stay in this tab. Desktop
        recommended; allow at least 2 GB of available memory. No API key or
        payment.
      </p>
      {enabled && <p role="status">{message}</p>}
      <label>
        Answer language
        <select
          aria-label="Answer language"
          value={language}
          disabled={!ready || busy}
          onChange={(e) => setLanguage(e.target.value as AnswerLanguage)}
        >
          <option value="auto">Auto · match your question</option>
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
        </select>
      </label>
      <textarea
        aria-label="Ask a question"
        placeholder="Ask in English or Hindi…"
        disabled={!ready || busy}
        maxLength={600}
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button
        className="primary"
        onClick={ask}
        disabled={!ready || busy || !question.trim() || !chunks.length}
      >
        {enabled ? "Ask documents" : "AI connection pending"}
      </button>
      {busy && (
        <button onClick={() => operation.current?.abort()}>
          Cancel answer
        </button>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {answer && (
        <div className="answer-output" aria-live="polite">
          <h4>
            {answer.status === "answer"
              ? "AI-generated answer"
              : answer.status === "conflict"
                ? "Conflicting evidence"
                : "Insufficient evidence"}
          </h4>
          <p lang={answer.language}>{answer.answer}</p>
          {answer.citations.map((c) => (
            <button
              key={c.id}
              className="answer-citation"
              onClick={() => onSource({ chunk: c, score: 0 })}
            >
              <span>
                {c.documentName} · Page {c.page} ↗
              </span>
              <p>{c.text}</p>
            </button>
          ))}
          <small>
            Source identities are validated. Factual support is not
            independently verified. Retrieval can miss relevant passages.
          </small>
        </div>
      )}
      <small>No simulated answers. No document uploads to an AI service.</small>
    </section>
  );
}
