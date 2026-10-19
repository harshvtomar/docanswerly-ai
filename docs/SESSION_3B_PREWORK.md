# Session 3B — saved-run failure triage and UI recovery checkpoint

This is a reproducible inspection of **existing** genuine Qwen3 output, not a new
model evaluation. Source: `docs/runs/38366200372/rag-evaluation.json`.
Run `npm run audit:rag` to list structural failure IDs without downloading
or re-executing a generative model.

## Grounded observations

- 30 synthetic oracle-context cases: 17 expected supported; 13 expected
  unsupported or conflicting; these are not end-to-end retrieval cases.
- 13 validation errors: 11 invalid nonempty refusal responses and 2
  requested-Hindi failures (`cross-hi-1`, `cross-hi-3`).
- The 11 malformed declared refusals include the supported injection case
  `injection-1`, plus 10 unsupported cases. They must **not** be normalized
  blindly: for example, `absent-1` repeats the irrelevant founding-year
  statement, while `partial-1` answers only one of two requested facts.
- None of 13 expected unsupported/conflict cases became a valid abstention.
  Three instead emitted `status:"answer"`: `partial-2`, `conflict-1`,
  `conflict-2`. An empty-citations-only check is not a support check.
- `cross-en-1` emits `जयपुर` while marking output language `en`; the
  existing validator checks Devanagari for Hindi but does not enforce English.
  This should be evaluated, not relabelled as correct English.
- `cross-en-2` says **6 years** where the Hindi source explicitly says
  **6 weeks**. A valid citation and matching numeral did not catch the
  unit error. `cross-hi-2` emits `3 किगारी` instead of kilograms.
- Three public-browser observations are saved at
  `docs/runs/38366200372/generation-chromium.json`: supported English works;
  Hindi and abstention fail validation. No improvement to genuine model
  quality can be claimed without fresh inference.

## Small safely scoped code change

Previously a validation exception left the AnswerPanel role=status at
"Generating locally…" even though the Ask button became available and an
error was displayed. AnswerPanel now sets an explicit failed or cancelled
status and clears the completed operation handle. Its existing browser
generation test checks that whenever an error is visible the status is not
stuck at "Generating".

No generation prompt, parser, citation validation, model weights, corpus
labels or historical output was modified by this checkpoint. This UI change
does **not** resolve the eleven refusal-format errors or the two Hindi errors.

## Session 3B next actions

1. Inspect the latest GitHub Actions result for this checkpoint and verify
   public frontend behavior if deployment completes successfully.
2. Preserve raw failures. Investigate Qwen prompt/chat-template, language
   instructions, structured JSON schema and decoding using targeted genuine
   inference. Do **not** accept nonempty refusals automatically.
3. Evaluate English/Hindi output compliance and unit translation against
   independent evidence; source-ID checks alone are insufficient.
4. Re-run targeted model cases after prompt changes, followed by the complete
   corpus once stable. Preserve actual output and denominators.
5. Continue version v0.2.0 until full release gates pass. No external backend,
   paid inference, or model-weight replacement is authorized.

## Additional code checkpoint — 19 October 2026

The latest code now instructs the small generator explicitly to write Hindi
in Devanagari even from English evidence and to keep original time units.
Validation detects English-labelled Devanagari-only answers and common numeric
duration-unit mismatches (e.g. six weeks incorrectly rendered as six years).
These are bounded structural safeguards, **not** semantic entailment checking.

A malformed **declared** refusal with the exact JSON shape, matching requested
language, no citations, and nonempty model answer is handled by **discarding**
all model-generated text and showing the application-owned generic refusal.
Its validation marker is `refusal-content-discarded`, visibly disclosed in the
UI. This does not prove the refusal was warranted and must not be counted as a
format-correct model abstention or factual accuracy gain. Wrong-status answers,
invalid citation IDs and invalid/mismatched shapes remain failures.

These changes require fresh real-model testing to determine actual Hindi and
cross-language quality. Historical 30-case raw results are not modified.
