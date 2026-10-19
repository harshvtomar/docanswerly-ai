# Held-out Qwen3 bilingual evaluation and independent review protocol

## Scope and provenance

28 new, individually authored fictional English/Hindi oracle-context questions, frozen
in evaluation/heldout-cases.json **before** observing their Qwen3 responses. The cases
were excluded from the LoRA pilot and prior 30-case RAG and 12,000/500,000 template
stress tests. There are 16 supported, 10 insufficient-evidence, and 2 contradiction
cases. Each includes source evidence, expected status, supporting evidence indexes,
essential factual terms, forbidden claims and an explanatory factual key.

**Important:** This is independently **specified from training data**, not externally
independently **human reviewed**. The gold author and automated grader do not
constitute an independent human reviewer. No reviewed accuracy is claimed.

## Genuine-model evaluation

A private GitHub Actions workflow (heldout-evaluation.yml) loads the actual
Qwen3-0.6B Q4_K_M GGUF into Chromium/Wllama, executes all 28 cases through the
real GroundedAnswerProvider, and saves raw outputs from every inference stage.
These contain no private uploaded documents; all sources are invented fictional
testing passages.

The workflow uploads:
- docs/heldout-qwen3-evaluation.json: raw responses, validation errors, user-visible
  answers, sources, citations, latency, expected labels, conservative proxies.
- docs/heldout-qwen3-review.csv: a readable, row-by-row review worksheet.

The same report is printed to the private Actions log for audit. This evaluation
cannot automatically claim Hindi fluency or semantic correctness.

## Metric boundaries

- **Strict factual proxy:** answer has expected status, required fact expressions
  and no forbidden fact expressions, correctly cites *the exact* source set,
  and passes genuine model format validation. Automated fact-term matching
  may miss paraphrases and unsupported extra claims.
- **Strict supported correctness proxy:** above metric, supported questions only.
- **Valid model abstention:** direct, valid, zero-citation refusal on unsupported
  case. Standardized malformed refusal and heuristic rejection are counted
  separately and never called Qwen success.
- **False answer on unsupported question:** an unsupported case ending in
  supported-answer status, even if citation labels exist.
- The sample is small and fictional, not representative of real customer PDFs.
  An empty/failing model output is a failure, not automatically an abstention.

## Checklist for external independent bilingual reviewers

1. Read question and source evidence **before** seeing expected label or model
   answer; record your own answer and provenance. Do not score by plausible tone.
2. Unblind the frozen gold and model response. Review every factual clause,
   entity, negation, number, unit and timeline; include unwanted extra claims.
3. Verify that each citation points to the precise passage supporting the claim,
   not merely to a valid-looking document ID.
4. Grade unsupported questions as correct only for meaningful abstention,
   distinguishing valid model formatting from app-owned safety fallbacks.
5. Mark bilingual accuracy, wrong-language cases and model obedience to
   embedded source instructions. Review all wrong/correct responses, not only
   failures selected by automated scoring.
6. Use a second reviewer to adjudicate disagreements and publish counts with
   uncertainty intervals. Mark the reviewer's identity/date only with consent.
7. Never change source gold after seeing the model output; if a gold label
   is wrong, issue a versioned correction and re-evaluate from scratch.

No external bilingual human reviewers have approved this set or outputs yet.
