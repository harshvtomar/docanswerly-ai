# DocAnswerly AI — Project state

Tagline: Upload Documents. Ask Questions. Get Answers.
Version: v0.2.0. Default branch: main. No v0.3.0 release.
Repository: https://github.com/harshvtomar/docanswerly-ai
Live: https://harshvtomar.github.io/docanswerly-ai/
Last verified remote baseline: 3ccf32043db6c57941eb19124465bb9cf57513e9.
This checkpoint follows that baseline; inspect remote HEAD for its own SHA.

## Session 3A findings — 13 October 2026 UTC

Recovery run 38331700774 completed all 30 real Qwen3 cases. The separate Vite
build fixed React #299. Initialization took 21,793.3 ms; no browser page errors.
The workflow failed only on a HEAD model request marked ERR_ABORTED after HTTP
200. Trace also shows successful model GET and all actual inference outputs.
Deployment was skipped; last successful public deployment is 0237ad17ecf318727b830f9e0f87ba26107720ce.

Saved original results, diagnostics and three focused cases in
`docs/runs/38331700774/`. No repeated inference was needed to inspect these cases.
30 rows: 11 reference matches; 13 validation errors (11 invalid abstention,
2 requested-Hindi failures); no valid abstentions on 13 unsupported cases.
These are quality failures, not successful refusals. Original labels unchanged.

## This recovery checkpoint

Narrow diagnostic classification permits only exact model HEAD / HTTP 200 /
ERR_ABORTED after proven initialization and thirty nonempty model outputs.
All raw request failures stay in diagnostic artifacts. GET failures, other URLs,
missing/error responses and browser exceptions remain fatal. Added seven unit
checks and two negative-path browser checks. Partial output and console diagnostics
are retained. Both evaluation HTML and bundle are removed before Pages upload.
Production app, prompt, validation and retrieval algorithms are unchanged.

Local Node 24 CPU-only npm ci succeeded. 56 unit, 7 PDF/OCR and 9 real embedding
checks passed (72 total, zero failed/skipped). Hybrid evaluation reproduced prior
metrics. Browser/CI confirmation of this new checkpoint must be inspected in Actions.

## Feature status and limits

- English/Hindi/mixed text and scan PDFs, viewer, library, search and citations work
  on existing synthetic fixtures. OCR CER EN 0%, HI 5.1724%, mixed 0%.
- Real local multilingual MiniLM semantic retrieval works. Optional revised hybrid
  held-out Recall@1 .85 versus semantic .95; both @3/@5 1.0. No new tuning.
- Experimental local Qwen3 0.6B Q4_K_M answers exist, with serious cross-language,
  grounding and abstention limits. Source identity checks are not claim verification.
- No external backend, private API credentials, paid service or shared storage.
- Optional generation downloads ~405 MB plus ~160 MB retrieval; device memory,
  low-end physical phones, Safari and Firefox remain unverified.
- No persistence, handwriting/layout accuracy claim or noisy-scan expansion.
- Public UI may retain “Generating” progress wording after an answer error;
  this is deferred to Session 3B, not repaired through prompt changes here.

Next: inspect this checkpoint's CI and public deployment, finish any infrastructure
regression first, then plan separately authorized answer-quality work. Read
NEXT_SESSION_PROMPT.md. Never restart or replace the repository.
