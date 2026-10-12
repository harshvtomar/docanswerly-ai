# RAG evaluation — Session 3

Real model integration is under browser validation. Do not treat the unit tests
as real generation or claim the pending results below as successful inference.

## Reproduction

`ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci`
`npm test && npm run test:pdf && npm run test:retrieval && npm run test:hybrid`
`RAG_EVALUATION=1 npm run build`
`RAG_EVALUATION=1 npm run test:e2e`

CI installs Chromium and runs the same commands. The CI-only evaluation HTML is
removed before Pages upload; normal production builds do not include this entry.

The 30 `evaluation/rag-cases.json` cases use supplied oracle evidence, not retrieval.
This isolates generation errors; the UI smoke tests exercise real retrieval plus
generation separately. Cases include English, Hindi, cross-language, mixed,
numeric facts, eight absent answers, three partially supported questions, two
conflicts, one instruction injection and one multi-source question. All are
synthetic, authored separately from the retrieval sets, not a representative
real-world benchmark. No LLM judge is used.

`docs/rag-evaluation.json` is produced by genuine browser Qwen inference in CI.
Raw answers, errors and per-case latency are retained. A completed evaluation test
means the runner finished all cases, NOT that all answers were correct.

## Definitions

- Reference match: expected status and all manually specified answer terms match.
  This proxy can miss paraphrases and does not prove semantic faithfulness.
- Source-set match: returned sources equal the labelled supporting source set.
  Valid IDs alone do not establish claim support.
- Unsupported abstention: an explicit insufficient-evidence/conflict result on a
  labelled unsupported case. Provider/validation errors count separately, not as
  successful abstentions.
- False refusal: supported cases returning explicit abstention / supported count.
- Semantic groundedness: requires manual claim-level review; initially null.
- Service cost: zero for local inference, excluding device/bandwidth resources.

## Security boundaries

Questions/evidence are untrusted JSON in the user message, separate from fixed
system instructions. No tools, secrets, remote inference or document logging.
Three whole evidence spans / 2100 characters, 600-character questions, 384 output
tokens, structured schema, allowed source labels, original metadata and numeric
consistency checks. UI renders plain React text. Any validation failure rejects
an answer; it is never replaced with a fabricated answer. Small-model abstention
and prompt following need empirical evaluation and are not guaranteed.
