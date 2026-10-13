# Roadmap

## Session 1 — document foundation
Repository, tested Pages deployment, local English/Hindi PDF extraction and OCR,
actual PDF viewer, library, Unicode normalization, page-aware chunks, keyword search,
fixtures and honest quality reporting.

## Session 2 — implemented retrieval and initial reliability
Implemented pinned local q8 multilingual MiniLM, semantic search, optional hybrid
RRF, token-aware source spans, worker isolation and cancellation/timeouts. Evaluated
25 synthetic queries across five language directions. Hybrid cross-language quality
and negative-query abstention need improvement. OCR cancellation added; broader
scan dataset and image-quality improvements remain for Session 3.

## Session 3 — grounded answers
Deploy a secure inference backend only with an authorized free account or explicit
budget. Validate model/runtime/free-tier compatibility first. Add rate limiting,
request limits, timeout handling, citations validated against retrieved chunk IDs,
English/Hindi output selection and evidence-based abstention. Evaluate prompt
injection, unsupported questions, citation correctness and hallucination rate.

## Session 4 — persistence and quality
Opt-in local persistence with deletion controls, document-level access controls
before any shared server storage, reranking, richer OCR/layout support, latency
and cost monitoring, representative corpus evaluation and accessibility review.

## Production hardening
Pinned asset hashes, dependency/security updates, abuse testing, large-document
resource budgets, Safari/Firefox and low-memory device testing, security headers
where hosting supports them, failure recovery and documented data lifecycle.

## Session 3A / 3B adjustment

Local Qwen generation now exists, so an external provider is not required for
inference demonstrations. 3A is evaluation/CI recovery only; keep v0.2.0.
3B starts by verifying current CI, then addresses separately approved quality work.
Hindi, cross-language translation and abstention remain unaccepted. No new release
or storage/OCR/UI expansion is part of the recovery checkpoint.
