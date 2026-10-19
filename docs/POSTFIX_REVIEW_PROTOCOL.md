# Post-fix held-out bilingual Qwen3 benchmark and external review
Created 20 October 2026. The 24 new fictional cases in `evaluation/heldout-v2-cases.json` were frozen before this suite's first model run. They are assistant-authored, not independent human labels. They are separate from the original 28-case held-out gold, 30-case development corpus, 12k/500k generated validator cases, and synthetic LoRA pilot.

## Running and interpreting
The GitHub Actions workflow `.github/workflows/postfix-evaluation.yml` executes real browser-local Qwen3-0.6B GGUF inference and preserves raw stages, outputs, failures, source IDs, case-level proxies and latency in a downloadable artifact. The original held-out evaluation and deployment CI are preserved. Passing the job means all cases were **executed**; it does not mean all answers are factually correct.

Report separately: (a) strict direct-model proxy successes on supported facts, (b) strict directly valid model abstentions, (c) app heuristic refusals, (d) app-normalized malformed refusals, (e) source-only excerpts, (f) model errors and wrong-language/format failures. Do not aggregate (b)-(e) as model compliance.

## Independent external bilingual sign-off: REQUIRED, NOT COMPLETED
Invite at least one fluent external English/Hindi reviewer with no involvement in writing prompts, gold labels or questions, and a second person for disagreements. Review without access to the model answer or gold first; independently extract facts and citation sets from question and source. Then inspect raw model stages and displayed response. Rate every case for full requested-fact coverage, invented facts or keys, numeric/units fidelity, Hindi fluency, source-claim entailment, citation IDs and raw-abstention format. Record reviewer name or pseudonym with consent, date, per-case judgement, disagreements and adjudication. Sign-off is valid only with actual reviewer submission and documented independent inspection. An assistant cannot be its own external reviewer.

## Release criteria
Do not publish an independently human-verified accuracy percentage until signed ratings exist. Keep v0.2.0 as the baseline until full CI and public deployment smoke pass. Do not relabel heuristic safety as model success, silently alter frozen gold or train on these cases. All metrics need denominators and provenance. v0.3.0 must not be announced merely because CI passes.
