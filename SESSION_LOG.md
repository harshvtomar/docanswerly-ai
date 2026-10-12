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
