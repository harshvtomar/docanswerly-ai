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
