# DOCANSWERLY AI — WORK SESSION 3B

Continue https://github.com/harshvtomar/docanswerly-ai on main. Public site:
https://harshvtomar.github.io/docanswerly-ai/. Version remains v0.2.0.
Never restart, create a replacement repository, reset history, force-push, remove
working features or modify unrelated repositories. No paid services authorized.

1. Fetch actual remote HEAD and inspect its latest Actions build/deployment.
2. Read README, PROJECT_STATE, SESSION_LOG, ROADMAP, docs/ARCHITECTURE,
   DEPLOYMENT, TEST_RESULTS, RAG_EVALUATION and RETRIEVAL_EVALUATION.
3. Inspect evaluation/browser.ts, evaluation/diagnostics.ts, evaluation.html,
   e2e/rag-evaluation.spec.ts, e2e/generation.spec.ts and both Vite configs.
4. Inspect the live public deployment and run existing regressions before editing.
5. Preserve all existing PDF/OCR, local search, real embeddings and citation flows.

## Verified history and findings

3ccf32043db6c57941eb19124465bb9cf57513e9 is the recovery baseline. Its run
38331700774 DID initialize and finish 30 genuine Qwen3 cases. Do not repeat the
React missing-root repair. CI then failed on a model HEAD request ERR_ABORTED
following HTTP 200. Page errors were empty; actual model GET/inference succeeded.
Original raw outputs and diagnostics survive in docs/runs/38331700774.
Last verified deployment before the 3A fix: 0237ad17ecf318727b830f9e0f87ba26107720ce.
Superseding verified deployment: f5d8c85d6514e0125a4942597afa7fc6017f3541,
run 38366200372 succeeded. Inspect current HEAD/runs before editing.

Session 3A adds a narrowly tested diagnostic classification for that exact probe,
retains all request records, adds module/model failure-path browser tests, and
removes the evaluation HTML AND bundle from Pages artifacts. Production model,
prompt, labels and validation logic were not changed. CI confirmation succeeded: 103 passed, 0 failed, 0 skipped (56 unit + 7 PDF/OCR
+ 9 embedding + 31 browser). Full corpus and both failure-path tests completed.
Raw JSON: docs/runs/38366200372. Quality metrics and 13 validation errors remain
unchanged. No unexpected page/HTTP/console errors; one exact completed HEAD warning
retained. Public sample/Hindi search/page navigation worked after deployment on
13 October; evaluation.html correctly returned 404. Final docs/results-only commit
uses [skip ci] to avoid unchanged inference repetition; no tests were disabled.
CI status/artifacts were reverified and archived on 19 October after a usage-limit
interruption. No new model run was needed for that documentation recovery.

## Actual model results; do not relabel to hide failures

30 synthetic oracle-context rows; 17 supported / 13 unsupported. Reference matches
11/30, structural source-set matches 14/30, validation errors 13 (11 abstention
format, 2 Hindi). Supported answers returned 14/17, not necessarily correct.
Unsupported: 0/13 valid abstentions; 3/13 returned answers; 10/13 validation errors.
Three focused saved cases: en-1 correct room 24, hi-1 Hindi Thursday answer,
absent-1 invalid abstention containing an irrelevant founding-year sentence.
These were selected from completed real inference, not rerun or fabricated.
UI Hindi sample still fails requested-language validation; unsupported UI question
fails abstention format. A status label can remain “Generating” after error.

## Reproduce

Node 24: `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci`.
Run npm test, npm run test:pdf, npm run test:retrieval, npm run test:hybrid,
npm run build, npm run build:evaluation.
Use CI Chromium where local browser execution is unavailable.
`RAG_EVALUATION=1 npx playwright test --project=rag-evaluation --grep 'failure'`
checks both negative paths without expensive inference.
`RAG_EVALUATION=1 npm run test:e2e` retains the full corpus and UI regression suite.
Do not repeatedly run full inference before diagnosing infrastructure. Reuse saved
outputs when the model/prompt has not changed. Passing the runner is not quality
acceptance. Do not disable difficult tests to make CI green.

## Next priorities

Resolve any remaining infrastructure failure first. Keep v0.2.0; v0.3.0 requires
separately verified quality and regression gates. After confirming scope with the
next request, investigate Hindi/cross-language output and honest abstention using
raw evidence. Do not silently accept malformed refusals as successful answers.
The source-set metric's refusal branch only checks empty citations; review before
claiming broader metric correctness. Preserve original historical JSON unchanged.
Avoid unrelated UI redesign, OCR expansion, providers or storage during recovery.

Commit and push verified changes regularly with current HEAD as parent and a
non-forced expected-SHA update. Verify the remote SHA and Actions. Update state/log
and this continuation with actual results; GitHub is authoritative, not chat.

## Session 3B pre-work update — 19 October 2026

Before repeating already completed diagnostics, inspect
`docs/SESSION_3B_PREWORK.md`, run `npm run audit:rag`, and check the
latest GitHub Actions for the pre-work commit. A targeted AnswerPanel error
status fix and browser regression assertion were added, but no model prompt,
structured parser, model weights, or quality labels changed. Do not claim
Hindi generation or abstention has improved. Continue with genuine targeted
Qwen3 inference and prompt/schema investigation. Keep v0.2.0 until release.
