# Architecture

DocAnswerly AI v0.1.0 is a static React/TypeScript application deployed by Vite
and GitHub Actions to GitHub Pages. There is no Node/Python server on Pages.

## Implemented flow

File input/drop → extension/size/header validation → PDF.js parsing → per-page
Unicode text → OCR fallback → NFC normalization → page records → overlapping
chunks → local keyword ranking → source page navigation.

- `src/lib/pdf.ts`: 25 MiB and 40-page limits; embedded text extraction; six
  million pixel render cap; one reusable bilingual Tesseract worker per document;
  cleanup of canvas/worker/PDF resources; per-page errors preserve other pages.
- `src/lib/text.ts`: Unicode-safe normalization and tokenization, code-point
  chunks of 700 with 100 overlap, document/page IDs, keyword scoring and CER.
- `src/lib/types.ts`: document, page, chunk, embedding and answer contracts.
- `src/lib/rag.ts`: provider-neutral cosine index. Its unit test uses a stub;
  this is not an integrated multilingual model or an evaluation of retrieval.
- `src/components/Viewer.tsx`: PDF.js canvas viewer. Off-screen rendering prevents
  stale page requests from painting over the current selection.
- `src/App.tsx`: session-local library, upload queue, selected page, text/PDF tabs,
  same-language keyword search, source references, processing status and activity.
- `scripts/prepare-assets.mjs`: bundles local OCR worker/core/languages and PDF
  support assets at build time. Fonts are bundled from Fontsource packages.

## Privacy and lifecycle

PDF bytes and extracted text remain in tab memory; no document uploads, telemetry,
remote inference or public document storage. Reload clears the workspace. OCR
language data may be cached by the browser; this is not a document cache. Removing
a document revokes its object URL and removes its searchable chunks. At most eight
documents are accepted. No user accounts exist in this version.

## Pending AI architecture

Choose and pin a genuinely multilingual embedding model; benchmark English/Hindi
same-language and cross-language queries before enabling the semantic label.
Hybrid lexical/vector retrieval and reranking follow. The AnswerProvider must
receive retrieved evidence with immutable chunk IDs, return validated citation IDs,
and abstain without support. Treat all document text as untrusted data, including
instructions embedded in PDFs. Generated answer text and citations must render as
text, never arbitrary HTML.

A future external inference service must keep keys server-side, apply schema and
body limits, authentication/rate limits, explicit origin policy, timeouts, budget
ceilings and minimal logs. Shared storage requires authenticated document ownership
checks on every read/write. No such service is currently deployed or configured.

## Limits

No layout/table reconstruction, handwriting guarantee, rotation correction, OCR
cancellation, resumable jobs, persisted workspace, password entry, or semantic QA.
Sparse valid text may trigger OCR. ASCII-looking legacy Hindi encodings may evade
the heuristic; force OCR is available. Pages mixing good embedded text and scanned
regions need force OCR to include those regions. OCR is not a truth guarantee.
