# DocAnswerly AI — Project state

Tagline: Upload Documents. Ask Questions. Get Answers.
Version: v0.2.0. Default branch: main. No v0.3.0 release.
Repository: https://github.com/harshvtomar/docanswerly-ai
Live: https://harshvtomar.github.io/docanswerly-ai/
Last verified code/deployment SHA: f5d8c85d6514e0125a4942597afa7fc6017f3541.
Recovery baseline: 3ccf32043db6c57941eb19124465bb9cf57513e9.
This documentation checkpoint follows the verified code SHA; inspect remote HEAD for its own SHA.

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
metrics. CI confirmation succeeded; see verified completion below.

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

Next: inspect current remote HEAD and CI, then plan separately authorized
answer-quality work. Read
NEXT_SESSION_PROMPT.md. Never restart or replace the repository.

## Verified Session 3A completion

Code/deployment: f5d8c85d6514e0125a4942597afa7fc6017f3541.
[Run 38366200372](https://github.com/harshvtomar/docanswerly-ai/actions/runs/38366200372)
completed successfully on 13 October 2026; status and artifacts reverified on
19 October 2026. Both build 115191822041 and deploy 115198205359 succeeded.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Vitest | 56 | 0 | 0 |
| PDF/OCR | 7 | 0 | 0 |
| Real embedding checks | 9 | 0 | 0 |
| Desktop/mobile UI cases | 28 | 0 | 0 |
| Full thirty-case evaluation infrastructure | 1 | 0 | 0 |
| Module/model failure-path browser tests | 2 | 0 | 0 |
| Total | 103 | 0 | 0 |

The thirty model cases are evaluation rows, not thirty passing correctness tests.
All thirty real outputs completed; 13 answer-validation errors remain unchanged.
Initialization took 23,411.3 ms; browser suite 16.0 minutes. Module failure reached
Failed in 121 ms; injected model HTTP 503 did so in 199 ms. Full-run diagnostics:
zero page/HTTP/console errors and one exact model HEAD 200 / ERR_ABORTED warning.
All raw request failures remain recorded. No other failures were exempted.
Raw JSON and provenance: docs/runs/38366200372/ (relative to repository root).
Historical run docs/runs/38331700774/ remains unchanged.

Post-deployment public smoke on 13 October: index-C1rC7N9P.js matched production;
bilingual sample processed three pages; Hindi search returned page 2 and citation
navigation opened it. No application-origin errors; unrelated extension errors
were excluded. Public evaluation.html returned GitHub Pages 404 as intended.

The final documentation/results-only checkpoint uses [skip ci] to avoid repeating
unchanged expensive inference. No executable file, test or workflow gate changes.
The tested/deployed code remains f5d8c85; inspect current HEAD for final docs SHA.
Version remains v0.2.0. No backend, paid service or prompt/label tuning was added.

## Verified Session 3B Priority 1 checkpoint — 19 October 2026

Code and deployed revision: `08a14f706002843e49e1e0813b901ed21532a546`.
Full [GitHub Actions run 39207953646](https://github.com/harshvtomar/docanswerly-ai/actions/runs/39207953646)
finished successfully: build and Pages deployment succeeded, 84 unit,
7 PDF/OCR, 9 embedding and 31 browser checks passed (131 total).
The 30 oracle-context model evaluation rows are not correctness tests.

Real Qwen3 English-evidence→Hindi reference matches improved from 0/3 to
3/3 on the saved *synthetic* evaluation (Tuesday, weight 3 kilograms and
potatoes). This is an encouraging narrow result, not general Hindi fluency.
The bilingual sample's Hindi model answer still fails language validation.
Desktop and mobile now show a **verbatim source excerpt**, clearly identified
as not AI-generated, only after two genuine model attempts fail. Both UI
tests passed with the correct page-3 citation and no errors. This fallback
does not inflate model-compliant reference matches or supported-answer rates.

The latest 30-case results: 14/30 reference-term matches, 14/17 supported
cases returning model-compliant answers, 3 evaluation errors, 5 pre-inference
gate decisions and 8 canonicalized refusals. The model produced 0/13 valid
strict abstentions. Semantic claim-level groundedness has not been measured.
Session 3C should address evidence sufficiency; remaining Session 3B work
includes broader bilingual factual quality and additional evaluation.
Version remains **v0.2.0**. No v0.3.0 release.

## Session 3B mixed-language Hindi limitation (19 October 2026)

The local 0.6B model still occasionally cannot answer in Hindi from a mixed
Hindi/English document. Source-excerpt fallback is clearly labelled and
cited. The experimental v0.2.0 functional browser regression now verifies
that fallback as a safe alternate outcome, not an AI-generated answer. Full
release-quality mixed-Hindi generation remains unfinished; 3/3 narrowly
measured English-evidence→Hindi oracle references are not general accuracy.
