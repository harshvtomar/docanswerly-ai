# DOCANSWERLY AI — WORK SESSION 3 CONTINUATION 2

Continue the existing project. Never restart, replace the repository, reset history,
force-push, or modify unrelated repositories. No paid services without permission.

Repository: https://github.com/harshvtomar/docanswerly-ai
Live: https://harshvtomar.github.io/docanswerly-ai/
Default branch: main. Recorded version: v0.2.0 (v0.3.0 not accepted yet).
Reference source checkpoint: 16eb6f137df75c1ae8061d5fded919706b3fe69f.
Last verified deployment: 0237ad17ecf318727b830f9e0f87ba26107720ce.
These references are historical; inspect CURRENT remote HEAD and Actions first.

Read README.md, PROJECT_STATE.md, SESSION_LOG.md, ROADMAP.md and all architecture,
deployment, decisions, test and evaluation documents in docs/. Inspect current
source, workflow and open changes before editing. GitHub is authoritative.

## Immediate blockers

1. Failed run 38287529836 passed 93 checks (49 unit, 7 PDF/OCR, 9 embedding,
   28 browser) but the 30-case oracle-context evaluation never initialized.
   Its trace shows React error #299: a shared application bundle tried to mount
   into a missing root. Repair separates evaluation and React Vite builds.
   Verify actual built imports, browser requests and diagnostic artifacts.
2. English local Qwen3 0.6B Q4_K_M / Wllama 3.8.1 answers and source navigation
   passed. The Hindi UI case returned no valid Devanagari answer. The unsupported
   query returned invalid abstention content. Those are errors, not successful
   refusals. Inspect raw predictions before adjusting prompts/schema.
3. Run the full 30-case genuine generation corpus. Do not invent results or call
   runner completion answer-quality acceptance. Keep original labels and failures.
4. Semantic-first hybrid improves held-out Recall@1 to .85 from .60, but semantic
   alone is .95. Keep hybrid optional. @3/@5 are 1 for semantic and revised hybrid.
5. Final docs and v0.3.0 release remain pending actual quality/browser verification.

## Reproduction

Node 24. `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci`.
Run `npm test`, `npm run test:pdf`, `npm run test:retrieval`,
`npm run test:hybrid`, `npm run build`, `npm run build:evaluation`, then
`RAG_EVALUATION=1 npm run test:e2e`. Use CI Chromium when local browser testing
is unavailable. The evaluation page must be removed before Pages upload.
Do not weaken/remove difficult tests. Capture page errors, resource failures,
raw synthetic model outputs and partial evaluation progress. No private data logs.

## Safety and release gates

Keep local PDF/OCR, semantic retrieval, document deletion and source navigation.
Generation is opt-in (~405 MB plus ~160 MB embedding assets). No remote document
transmission, secrets or paid inference. Source ID checks do not prove grounding.
Test English, Hindi, both output language overrides, unsupported/partial/conflicting
evidence, multiple sources, prompt injection and cancellation/retry. Add the
photosynthesis Hindi acceptance case from the continuation request.

Only release v0.3.0 after genuine inference, completed evaluation, regression CI,
public Pages smoke tests and accurate documentation. Otherwise retain v0.2.0
and update this continuation instead of starting Session 4 features.

## Preservation

Commit verified milestones every 20–30 minutes. Shell pushes may lack credentials;
GitHub Git Data connector writes have worked. Create trees/commits based on current
remote HEAD, use expected SHA and non-forced ref updates, verify remote SHA, then
check Actions. Do not overwrite concurrent work. Keep working public deployment
when CI fails. Update PROJECT_STATE.md and SESSION_LOG.md each checkpoint.

At completion, save raw/summary evaluation, update documentation and this prompt,
verify final remote HEAD and successful deployment, and report remaining failures.
