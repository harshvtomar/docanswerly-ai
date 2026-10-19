# Session log

## Session 1 — 12 October 2026 (Asia/Kolkata)

Created public harshvtomar/docanswerly-ai without modifying another repository.
Configured Pages to use GitHub Actions. Implemented React/TypeScript/Vite app,
local PDF/OCR pipeline, viewer, library, keyword source search and semantic/answer
provider contracts. Added all continuity documents, MIT license, fixtures, unit,
PDF evaluation and desktop/mobile browser tests. Verified public sample processing,
Hindi extraction/search, deletion, force OCR on all three pages and original PDF.

### Verified remote checkpoints

- e22338a84f62a5d850693416a812a7188556304a — repository and initial README created.
- f9679268f0daa9153e6e4926635644338d6619d8 — React scaffold, docs, Pages workflow.
  Actions run 38174155646 succeeded; public URL opened successfully.
- 579aede112acecd0b06c88bc05f05fd0c584fbb4 — bilingual PDF/OCR workspace, search,
  fixtures and evaluation. Actions run 38174907155: 42 checks passed, build and
  deploy succeeded. Remote main verified with git ls-remote.
- Final handoff checkpoint (see current main HEAD): completed documents, screenshot,
  precise PDF text-span concatenation, checksummed language assets and notices.
  The same full CI gate runs on this checkpoint.

### Verification and resolved development failures

Initial scaffold: 1 unit test and production build passed. Feature checkpoint:
15 unit tests, 7 PDF checks, 20 Playwright cases passed; 0 failed, 0 skipped.
OCR CER: English 0%, Hindi 5.1724%, mixed 0% on clean synthetic sentences.

Shell git push failed because there was no credential helper/authentication.
Used the authenticated GitHub connector for blob/tree/commit/ref writes instead.
No tokens were copied, printed or requested. PDF.js 6.4 type checking caught removed
API members; switched to loadingTask.destroy. Initial JSX nesting error was fixed
before committing the feature checkpoint. Initial shaped PDF fixtures produced PUA
text mappings despite correct appearance; replaced with explicit Unicode overlays
and image-only scans, and added PUA detection to the extraction fallback heuristic.

### Files / decisions

Source: src/App.tsx, src/components/Viewer.tsx, src/lib/{pdf,text,rag,types}.ts,
CSS and bundled fonts. Tooling: scripts/{prepare-assets,evaluate}.mjs, fixture
generator, Vitest and Playwright configs, e2e/workspace.spec.ts, deploy.yml.
Docs: README, PROJECT_STATE, ROADMAP, SESSION_LOG, NEXT_SESSION_PROMPT, architecture,
deployment, test results, decisions, evaluation JSON and screenshot.

Architecture choices and source references: docs/DECISIONS.md. No backend account
or paid service activated. Semantic model, cross-language retrieval, generation,
persistence, stronger OCR recovery and larger evaluation corpus remain pending.

### Resumed handoff verification

After the interruption, remote main was still 579aede. Re-ran unit and PDF tests.
Fixed final asset packaging to use Tesseract's LICENSE.md filename (the other
packages use LICENSE). Verified the production build again before publishing
handoff files. The failed packaging attempt did not affect the live deployment.

## Session 2 — restoration, 12 October 2026

Verified remote main e57c20cd11be56a263e86e12586ad37e9ab0a7af; clean local
source tree. Reviewed continuity documents and source. Re-ran Node 24 npm ci,
15 unit tests, 7 real PDF/OCR checks and production build successfully.
Existing Actions run 38201513927 has successful build and deployment (20 browser
cases from Session 1). Public homepage loaded and sample processing rechecked.
Session 2 work begins with pinned local multilingual embeddings and measured
retrieval; generation remains pending. No paid services activated.

### Real retrieval implementation checkpoint

Added Transformers.js 3.8.1, pinned q8 MiniLM ONNX assets (SHA-256 verified),
384-dimensional normalized mean pooling, actual 128-token-aware splitting,
worker isolation, opt-in search controls, timeouts/cancel and RRF hybrid ranking.
25-query/30-passage synthetic development evaluation: semantic Recall@1/3/5
and MRR = 1.0; keyword Recall@1/3/5 and MRR = 0.6; hybrid Recall@1/3/5 = 0.6,
MRR = 0.63335. These are easy development cases, not a general quality claim.
Hybrid has cross-language failures from generic lexical matches; not default.
Negative queries still return ranked passages; no abstention or QA claim.
Browser validation of new inference follows through CI before deployment.

### Verified inference deployment and reliability checkpoint

Remote 454e6c83e18019a3d9e810b424d19d7f03f3ce08, Actions 38203217575:
build and deployment successful; 21 unit + 7 PDF/OCR + 6 real-model checks +
24 browser cases passed (58 total at this checkpoint). Public Pages loaded the
model, indexed 3 sample pages and ranked page 3 first for the English question
"Where is artificial intelligence usage growing rapidly?". Clicking opened the
correct original page text. No app-origin JavaScript errors observed.

Added PDF/OCR cancellation and bounded operations, three lifecycle unit tests and
a cancellation/recovery browser case per viewport. Added real-tokenizer budget,
source-span and invalid-query checks (real-model suite now 9 checks). Local unit
suite now 24 passed, PDF suite 7 passed, real-model suite 9 passed; build succeeds.
New cancellation browser cases await CI on this checkpoint.

Packaging fix: onnxruntime-web omits a LICENSE file in its npm tarball; preserved
the MIT license from its exact upstream __commit.txt revision in docs/licenses.
No deployed regression occurred. Broader OCR datasets and secure QA remain pending.

### Session 2 release handoff

Reliability deployment run 38230886095 succeeded: 66 checks passed, 0 failed,
0 skipped. Prepared v0.2.0 version labels and complete Session 3 continuation.
README, state, architecture, deployment, decisions, roadmap, test results and
retrieval evaluation reflect actual functionality and known quality gaps.
Captured public semantic search evidence in docs/screenshots/semantic-search.jpg.
Final release docs/version commit runs the same gates; inspect current HEAD.

Remaining: secure generated answers/backend, evidence abstention, stronger hybrid
ranking, independently held-out retrieval, broader OCR fixtures, persistent local
storage and physical-device memory validation. No private data/secrets committed.


## Session 3 — restoration checkpoint (2026-10-12 UTC)

Remote main verified at 03c6001e21d7714d3dba61d3fe20134c8348e82f.
Restored existing source and documentation without replacing history.
`npm ci` initially failed fetching optional ONNX CUDA binaries. The documented
`ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci` CPU-only installation succeeds; CI now
sets that flag. Re-ran 24 unit, 7 PDF/OCR and 9 real embedding checks: 40 passed,
0 failed, 0 skipped; production build passed. Existing release Actions run
38231588343 has successful build (including 26 browser tests) and deployment.
OCR CER unchanged: English 0, Hindi 0.051724, mixed 0.
No external inference credentials are configured. Investigating optional local
Qwen3 0.6B GGUF generation with Wllama; inference is not yet implemented or verified.

### Session 3 — local inference foundation
Added pinned Wllama 3.8.1 and an optional Qwen3 0.6B Q4_K_M adapter, SHA256
verified 396,705,472-byte GGUF. No provider credentials or paid services used.
Implemented structured output, citation allowlisting, original source metadata,
new-numeral rejection, language validation, request limits, cancellation, and
explicit abstention status. Added 22 boundary unit tests: 46 unit checks now pass.
Browser inference acceptance gate added; actual model behavior remains unverified
until that CI gate completes. Model-generated answers are marked experimental.

### Session 3 — retrieval/evaluation checkpoint
Frozen semantic-first fusion (1/.15, rank constant 10) improves held-out
Recall@1 from .60 to .85, @3/.5 to 1.00; semantic-only remains .95 at rank 1.
No held-out tuning; hybrid remains optional. Added independent 20-query corpus
and full machine-readable evaluation. Unit total now 49 passing.
Added a 30-case oracle-context real-model browser evaluation, distinct from
retrieval data, with raw outputs and explicit proxy metric definitions. Awaiting
CI execution; no generation-quality results claimed at this checkpoint.

## Session 3 continuation — 2026-10-13 UTC
Remote 16eb6f137df75c1ae8061d5fded919706b3fe69f verified. Failed run
38287529836: 49 unit + 7 PDF/OCR + 9 embedding + 28 browser passed; one
oracle-context evaluation failed initialization. Trace shows React error #299:
the shared application entry mounted into a missing root. The evaluation button
remained Ready without a handler. Absolute script URL was not the root cause.
Separate Vite evaluation build added; initialization now fails in 15 seconds,
with page errors, failed resource requests and partial outputs in artifacts.
First UI observations: English supported answer succeeds; Hindi answer rejected
for missing Devanagari; unsupported query rejected as invalid abstention. Those
validation errors are not successful abstentions. Release remains v0.2.0.

## Session 3A — 13 October 2026 UTC

Inspected remote main 3ccf32043db6c57941eb19124465bb9cf57513e9 and run
38331700774 before edits. Build failed, deployment skipped. Contrary to the prior
pending report, evaluation initialized and completed all 30 genuine cases.
Only final request assertion failed: model HEAD HTTP 200 then ERR_ABORTED; trace
shows GET 200 and all predictions. No React/page errors. Preserved artifact
11783388247 results/diagnostics under docs/runs/38331700774 before expiry.
Focused English, Hindi and unsupported examples reused from these real outputs.
13 answer-validation errors remain, no label/prompt/algorithm changes.

Added exact HEAD diagnostic classification, seven unit checks, module-load and
model-load failure browser checks, partial/console diagnostics, evaluation type
checking and removal of evaluation JS before publication. Full 30-case test remains
enabled; one CI rerun will verify the corrected assertion, not tune answer quality.
Node 24 CPU-only npm ci passed. Local unit 56, PDF/OCR 7, real embedding 9 passed;
hybrid metrics unchanged. Browser results for the new checkpoint are pending CI.
Restored stale local scratch from authoritative remote files; no remote history
reset or force push. Updated README/state and standalone Session 3B handoff.

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

### Handoff recovery — 19 October 2026

The final documentation push on 13 October was blocked by automatic approval
review because the Work usage limit was reached. Code/deployment f5d8c85 was
already preserved. Scratch was subsequently pruned. Re-cloned the same repository,
confirmed unchanged remote HEAD and successful CI, recovered the unexpired
11798185153 artifact, and restored final documentation from verified evidence.
No repository replacement, force-push or new inference run.

## Session 3B pre-work — focused Chat-mode checkpoint (19 October 2026)

Analyzed all 30 previously saved genuine-model cases without new inference.
Recorded 11 nonempty refusal-format errors, two requested-Hindi failures,
incorrect cross-language units (6 weeks → 6 years), and English-labelled
Devanagari output. Added a reproducible saved-run audit command and detailed
failure triage in docs/SESSION_3B_PREWORK.md. Fixed AnswerPanel status remaining
at “Generating” after errors/cancellation and strengthened its existing browser
regression assertion. This checkpoint does not assert improved LLM answer
quality; full real-model tests and deployment status must be checked in Actions.
Version remains v0.2.0.

### Session 3B — targeted answer-boundary improvement (19 October 2026)
Added explicit language and evidence-unit prompting; guards English-labelled
Devanagari-only answers and wrong numbered duration units. Malformed citation-free
model-declared refusals now discard all text into a distinct, visibly marked
application-owned standard refusal; the model's original malformed output is
not counted as a valid raw-model refusal. Added focused boundary tests.
Fresh genuine-model performance must be measured before claiming improvement.

### Session 3B — CI type-check repair and honest evaluation metrics
The first output-boundary checkpoint passed 72 existing unit/PDF/embedding
checks but failed TypeScript build on a narrow unknown-type cast. Added the
required explicit discriminator type, and separated canonicalized refusal
presentation from raw-model abstention-quality metrics. Changes must pass the
new GitHub Actions gate before claiming a deployment.

#### TypeScript build follow-up
GitHub Actions caught another TypeScript narrowing issue: the numeric-unit
callback captured a JSON property still typed `unknown`. Added an explicitly
typed local string after the existing schema assertion. These build errors were
caught before deployment and do not imply working model quality.

### Session 3B — language-prompt regression recovery (19 October 2026)
GitHub Actions run 39192265672 compiled and completed the 30-case RAG evaluator
but the longer all-language system prompt regressed the previously verified English
UI answer on both desktop and mobile; 29 browser checks passed, 2 failed. Reverted
to the concise Session 3A English prompt; Hindi now has a small language-specific
instruction. Wrong-language outputs get at most one bounded, separately prompted
retry under unchanged citation, numeral and structural validation. There is no
automatic retry of factual errors. Fresh browser acceptance is required.

### Session 3B — conservative unsupported-answer safeguards
Added independent safety gates for repeated near-identical conflicting numeric
source claims (including Hindi number words) and incomplete multi-attribute
questions. These bypass unreliable generation only when narrow detectable rules
match. Explicit validation labels distinguish heuristics from model-grounded
abstention; evaluation counts them separately. Added targeted unit checks and
user-facing limitations. Genuine model-quality and CI status remain to be verified.

### Session 3B — measured-unit fidelity check
Extended answer validation to Hindi numeric durations and source-backed weight
units so malformed unit translations are rejected rather than presented as
verified answers. Added focused tests. This is fail-closed validation, not a
successful regeneration or new model-quality metric. Verify the latest CI.

### Session 3B — 30-case evaluation gate-aware CI repair
Run 39194393368: production builds and 30 browser checks passed, but the
30-case evaluator test failed because an old invariant demanded nonempty raw
LLM output even on new pre-inference heuristic decisions. This is a test
contract issue, not an inference initialization failure. Updated evaluation
metrics and acceptance test to require an explicit validated gate label for any
model-free row, keeping genuine raw-model rows mandatory otherwise. No tests
were disabled; original historical model outputs remain untouched.
