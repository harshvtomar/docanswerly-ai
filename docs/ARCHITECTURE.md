# Architecture

DocAnswerly AI is a React/TypeScript static app on GitHub Pages, with no server-side
execution or document storage. The Vite base remains `/docanswerly-ai/`.

## Document processing

File validation → PDF.js page text → eng+hin Tesseract OCR fallback → NFC
normalization → page metadata → 700-code-point chunks with 100 overlap.
`pdf.ts` limits input to 25 MiB/40 pages, renders up to six million pixels per page,
keeps per-page failures, and frees workers/canvases/PDF resources. The upload queue
accepts at most eight documents. Cancellation discards the current unfinished PDF
and remaining queue; previously completed documents remain. PDF parsing/page
operations have 30-second limits; OCR initialization/recognition have 120-second
limits. An initializing OCR worker cannot be killed until Tesseract returns its
handle; late completion is terminated. A permanently stuck initialization remains
a runtime limitation, although the UI can recover.

## Retrieval

`text.ts` keeps the original immediate keyword search. `SearchPanel.tsx` offers
explicit opt-in local semantic inference, model progress, search modes, errors,
and cancellation. Keyword is the default; hybrid's measured cross-language weakness
is documented in RETRIEVAL_EVALUATION.md.

`SearchClient` starts a Vite module worker only after opt-in. `search.worker.ts`
serializes initialization, indexing and queries. `LocalEmbeddings` loads a pinned
q8 multilingual MiniLM using Transformers.js 3.8.1. Remote model loading is disabled;
all assets come from Pages under the repository base. Actual tokenizer counts split
page chunks to <=128 tokens (including special tokens), preserving code-point
source offsets and immutable derived IDs. Mean pooling and L2 normalization produce
384-dimensional vectors. No random, hardcoded or fallback vectors are used.

The provider-neutral `SemanticIndex` swaps a fully embedded index atomically.
Cosine ranks up to 40 candidates; hybrid combines the lexical and vector rankings
with semantic-first weighted RRF (semantic 1, lexical .15, constant 10).
Original equal-weight constant-60 RRF remains in evaluation comparisons.
Same-document/same-page spans with >50% overlap are deduped.
Different documents and pages keep independent citations, even with identical text.
Result buttons open the original document and page.

Document mutations rebuild the semantic index, capped at 500 token-sized passages.
Effect cleanup rejects stale UI results; document IDs filter deleted-source hits.
Queries debounce 350 ms. Worker initialization/indexing have four-minute deadlines;
queries 30 seconds. Cancel/disable terminates the worker and rejects pending calls.
Reload/disable clears document embeddings; normal browser/model asset caches may
retain public weights, not document text. There is no persistent vector database.

## Privacy and limitations

PDFs, extracted text, queries and vectors stay in browser memory. The site host sees
ordinary public asset requests. No telemetry, external inference requests, secrets,
accounts or uploaded-document storage exist. About 160 MB is downloaded on first
semantic use (model/tokenizer/WASM); runtime memory can be several hundred MB.
CPU/WASM is the supported path; no WebGPU requirement or GPU benchmark is claimed.

Model loading/inference failure is explicit, while keyword remains independently
available. Ranked passages are not answers and retrieval has no validated negative
query abstention. Experimental local QA is described below. OCR ordering, noisy/rotated scans and layout
reconstruction still need broader datasets. Password entry is unsupported.

## Future secure generation

Current generation uses GroundedAnswerProvider and a local InferenceClient.
If an external backend is added, it must hold API
keys server-side, enforce authentication, rate/body limits, explicit origin policy,
timeouts and cost ceilings. Do not treat CORS as authentication. Treat PDFs as
untrusted evidence, validate citation IDs against supplied chunks and test claim
support, contradiction and abstention. No document-triggered privileged actions.
Shared storage requires document ownership checks. No paid service is authorized.

## Local generation and evaluation

Optional AnswerPanel uses real browser-local Qwen3 0.6B Q4_K_M through Wllama 3.8.1.
Semantic retrieval selects up to three whole source chunks / 2100 characters.
GroundedAnswerProvider validates structured output, source IDs, numbers and Hindi
script presence; these checks do not establish semantic grounding. No remote
backend or secrets are used. User-visible failures remain explicit.

Evaluation builds independently from React, preventing missing-root side effects.
Ready must appear within 15 seconds; browser completion is bounded at 20 minutes.
Model load signal is 240 seconds and each inference signal 180 seconds; underlying
runtime cancellation is cooperative. Partial per-case results survive validation
failures. Browser diagnostics record page/console/HTTP/request failures. Only an
exact model HEAD abort after HTTP 200 and demonstrated model execution is non-fatal.
