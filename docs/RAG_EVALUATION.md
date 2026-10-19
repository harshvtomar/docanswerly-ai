# RAG evaluation — Session 3

Real browser inference completed 30 cases in run 38331700774 at commit
3ccf32043db6c57941eb19124465bb9cf57513e9. Runner initialization is verified;
answer quality is not accepted. Saved raw results: [historical run](runs/38331700774/rag-evaluation.json).

## Reproduction

`ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci`
`npm test && npm run test:pdf && npm run test:retrieval && npm run test:hybrid`
`npm run build && npm run build:evaluation`
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

## Actual recovered results — 13 October 2026

Initialization: 21,793.3 ms. All 30 rows contain actual model output. Browser page
errors: none. CI failed after evaluation on HEAD / model GGUF / HTTP 200 followed
by net::ERR_ABORTED. Trace also records a successful GET. This is retained as a
warning only when successful model execution is independently demonstrated.
Other failed resources remain fatal. The full evaluation test is still enabled.

| Observation | Actual value |
|---|---:|
| Reference-term matches | 11/30 (36.67%) |
| Source-set matches | 14/30 (46.67%) |
| Supported cases returning an answer | 14/17 (82.35%) |
| Supported explicit refusals | 0/17 |
| Unsupported valid abstentions | 0/13 |
| Unsupported answers | 3/13 (23.08%) |
| Validation errors | 13/30 |

Errors: 11 invalid abstention responses, two missing requested Hindi. Ten of the
errors are on unsupported cases, three on supported cases. Error and refusal are
not interchangeable. Source IDs can be valid while factual content is wrong:
cross-en-2 says six years where evidence says six weeks. Source-set matching's
current refusal branch only checks empty citations; historical results are kept
unchanged and this metric requires review before broader claims. No manual
semantic-faithfulness score is asserted.

Focused evidence reused from the completed corpus, without another inference run:

| Case | Actual result | Inference time |
|---|---|---:|
| en-1 | The Lumen workshop takes place in room 24. | 36,902.5 ms |
| hi-1 | कमल केंद्र में योग गुरुवार को होता है। | 36,848 ms |
| absent-1 | Invalid abstention; raw output includes an irrelevant founding-year sentence | 19,668.1 ms |

See [focused cases](runs/38331700774/focused-cases.json), original full JSON,
[evaluation diagnostics](runs/38331700774/evaluation-diagnostics.json), and both
UI generation observations in the same directory. These are synthetic fixtures,
not personal documents. The UI Hindi sample failed language validation even
though the oracle hi-1 case succeeds. No broad Hindi quality claim follows.

## Successful recovery confirmation

Run 38366200372 at f5d8c85d6514e0125a4942597afa7fc6017f3541 passed all
31 browser tests and deployed. All thirty actual model rows completed; quality
metrics are identical to the recovered run above. Initialization: 23,411.3 ms.
Zero page/HTTP/console errors. The exact HEAD 200 / ERR_ABORTED event remains in
both requests and warnings. [Raw results](runs/38366200372/rag-evaluation.json)
and [diagnostics](runs/38366200372/evaluation-diagnostics.json) are preserved.

Real UI questions also ran on desktop and emulated mobile: English succeeded;
Hindi and unsupported questions retained explicit validation errors. Desktop
latencies: 41,620 / 35,939 / 30,008 ms; mobile: 41,673 / 35,925 / 29,511 ms.
These single-run observations are not performance or answer-quality guarantees.
Artifacts were recovered unchanged on 19 October; no model rerun was needed.

## Session 3B output-recovery metric boundaries (19 October 2026)

A malformed model-declared refusal with nonempty free text, correct schema
and zero citations can now have its text **discarded** in favor of an
application-owned standard refusal. Its `validation` marker is
`refusal-content-discarded`; it must not be described as model-compliant
or proof of evidence insufficiency. The UI displays this limitation.

The evaluation reports **`unsupportedAbstentionRate`** for directly valid
model abstentions only; **`canonicalizedRefusals`** counts safety-converted
responses; **`displayedUnsupportedRefusalRate`** separately reports how often
unsupported cases ended in a refusal UI. Canonicalized cases are excluded from
reference-match and source-set-match quality proxies. Historical evaluation
artifacts remain untouched. All new figures require fresh genuine inference.
