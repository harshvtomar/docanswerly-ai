# DOCANSWERLY AI — WORK SESSION 2

You are continuing DocAnswerly AI, a multilingual document intelligence project.
Tagline: Upload Documents. Ask Questions. Get Answers.
Repository: https://github.com/harshvtomar/docanswerly-ai (public, default branch main)
Live frontend: https://harshvtomar.github.io/docanswerly-ai/
Version at Session 1: v0.1.0.

Never restart from scratch. Never create a replacement repository. Do not modify
unrelated repositories, force-push, reset remote history, or remove working features.
GitHub is the authoritative state; this prompt does not supersede current files.

1. Inspect the CURRENT remote default-branch HEAD and clone/fetch safely. Read
   README.md, PROJECT_STATE.md, SESSION_LOG.md, ROADMAP.md, docs/ARCHITECTURE.md,
   docs/DECISIONS.md, docs/DEPLOYMENT.md and docs/TEST_RESULTS.md, plus evaluation JSON.
2. Inspect the architecture, package lock, current workflow and latest GitHub Actions
   results. Open the public Pages website and test a sample upload and source search.
3. With Node.js 24, run npm ci, npm test, npm run test:pdf and npm run build.
   Run npm run test:e2e where browser automation is available (CI installs Chromium).
   Preserve the existing passing deployment if changes fail any gate.
4. Resolve critical defects before adding features. Review the fixture limitations,
   text ordering, mixed text/image pages, OCR cancellation/timeouts and memory limits.
5. Integrate a real multilingual embedding provider and evaluate all four English/
   Hindi query-document directions plus mixed language. Candidate model only:
   sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2. Verify current model
   license, runtime, revision and footprint. Do not report stub vectors as inference.
6. Add opt-in semantic and hybrid retrieval, a labelled question set and actual
   Recall@K. Keep keyword search working. Do not label keyword search cross-language.
7. Add genuine document-grounded QA only if a secure inference integration is
   available. Keep API keys server-side; never VITE_* secrets. No paid activation
   without explicit authorization. Authenticate and rate-limit backend access;
   require document ownership checks before any shared storage. Validate citations,
   add abstention, language choice and prompt-injection tests.
8. Save tested milestones regularly to this repository, verify every remote SHA
   and Actions deployment, and update authoritative documentation with actual results.
9. Finish with a verified live URL, passing/failing/skipped counts, known limits,
   latest remote SHA and a standalone Session 3 prompt.

GitHub access note: Session 1 shell git clone worked but shell push had no credential.
The GitHub connector's create_blob/create_tree/create_commit/update_ref operations
worked. Use current remote HEAD as parent and expected_sha; force=false. Browser UI
was used only for repository creation and Pages settings. Do not request tokens in chat.

Current generation is deliberately unavailable, not simulated. The next session must
preserve the distinction between searchable passages and AI-generated answers.
