# Roadmap

## Session 1 — document foundation
Repository, tested Pages deployment, local English/Hindi PDF extraction and OCR,
actual PDF viewer, library, Unicode normalization, page-aware chunks, keyword search,
fixtures and honest quality reporting.

## Session 2 — retrieval and reliability
Expand fixtures to multi-column, rotated, noisy and independently authored text
PDFs. Add OCR cancellation/timeouts and improve ordering and fallback. Integrate
a pinned multilingual embedding model, preferably opt-in local inference after
measuring memory/download cost. Evaluate EN→EN, HI→HI, EN→HI, HI→EN, and mixed queries
with labelled source pages and Recall@K. Add hybrid keyword/vector ranking.

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
