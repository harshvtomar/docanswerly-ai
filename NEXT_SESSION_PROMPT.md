# DOCANSWERLY AI — WORK SESSION 3

Continue the existing DocAnswerly AI project. Tagline: Upload Documents. Ask
Questions. Get Answers. Never restart, create a replacement repository, force-push,
reset remote history, or modify unrelated repositories.

Authoritative repository: https://github.com/harshvtomar/docanswerly-ai
Default branch: main. Public site: https://harshvtomar.github.io/docanswerly-ai/
Session 2 target release: v0.2.0; inspect current remote HEAD and PROJECT_STATE.md
for verified release/deployment results rather than assuming this prompt is current.

1. Fetch the CURRENT remote main SHA, inspect status/history and preserve uncommitted
   work. Read README, PROJECT_STATE, SESSION_LOG, ROADMAP, docs/ARCHITECTURE,
   docs/DEPLOYMENT, docs/DECISIONS, docs/TEST_RESULTS, docs/RETRIEVAL_EVALUATION,
   docs/evaluation.json and docs/retrieval-evaluation.json. Inspect source and CI.
2. Verify GitHub Actions build AND deploy jobs. Open the public site. Try a bilingual
   PDF, Hindi text, actual PDF rendering, keyword search, optional local semantic
   inference, source navigation, deletion and cancellation. No claims from builds alone.
3. On Node 24 run npm ci, npm test, npm run test:pdf, npm run test:retrieval and npm
   run build. Playwright browser tests run via npm run test:e2e; CI installs Chromium.
   In restricted Work environments, use Actions for browser automation and public
   browser UI checks. Preserve all existing regression tests.
4. Fix critical regressions before new features. Current semantic model is pinned
   Xenova/paraphrase-multilingual-MiniLM-L12-v2 q8 revision
   2c4055b12046f11709e9df2c122e59ffbdc2f900, Transformers.js 3.8.1. Assets download at
   build time with checksums; runtime uses same-origin assets in a worker. No text
   leaves the tab. 384 dimensions, mean pooling/L2, 128-token-aware source spans.
5. Improve retrieval rigor: current small synthetic set is NOT held out. Semantic
   R@1/3/5 and MRR were 1.0 on 25 simple queries; hybrid R@1/3/5 was only 0.6,
   MRR 0.6334. Equal RRF boosts weak lexical matches in cross-language questions.
   Keep hybrid optional. Create independent development/test splits with harder
   distractors, near-duplicates, multi-page evidence and unsupported questions.
   Evaluate BM25/stopwords, weighted fusion or reranking without tuning to the test
   set. Report failures and category metrics. No blanket accuracy claims.
6. Retrieval currently returns passages for unsupported queries (0/3 abstained).
   It does not generate answers. Implement validated evidence sufficiency and
   secure grounded generation only with available authorized inference access.
   Do not enable paid services or put secrets in VITE_* / browser bundles.
7. A future backend must authenticate/rate-limit, validate schemas/body sizes,
   restrict origins without confusing CORS with authentication, limit costs, enforce
   timeouts and keep keys server-side. PDFs are untrusted evidence, not instructions.
   Validate citation IDs and claim support, answer in selected English/Hindi,
   abstain without evidence, test contradictions, malicious PDF instructions and
   hallucinations. Require document ownership before any shared server storage.
8. Preserve English/Hindi/mixed PDF/OCR. Hindi CER remains 5.1724% on one small
   clean fixture; no accuracy improvement claimed. Expand independently authored,
   noisy, rotated, multi-column and mixed-region fixtures. Cancellation/timeout
   primitives exist; cancellation discards the current unfinished PDF, retaining
   completed documents. Initialization cannot terminate until a worker handle exists.
9. Measure physical low-memory devices, peak browser memory and cold download
   latency. Current ~160 MB semantic download and several hundred MB memory may be
   heavy for mobile. Do not confuse Node process RSS with browser memory.
10. Keep automatic GitHub Pages deployment and source-page citations working. Save
    tested milestones regularly; update docs/results and a Session 4 prompt.

Git access: shell fetch works; authenticated connector create_blob/create_tree/
create_commit/update_ref writes worked. Use current remote head as parent and
expected_sha with force=false. Verify the actual new remote SHA and Actions each
checkpoint. Never ask for tokens in chat or claim an unverified push.

No secure inference backend, persistent workspace, accounts or paid service exists.
AI answer UI must remain explicitly unavailable until genuine inference is verified.
