# Retrieval evaluation — Session 2

The exact inputs are in `evaluation/retrieval.json`; actual per-query outputs,
latencies, source IDs and metadata are in `docs/retrieval-evaluation.json`.
Run `npm ci && npm run test:retrieval` on Node 24 to reproduce. Model asset downloads
are pinned and checksummed by `scripts/model-manifest.json`.

## Model and implementation

- Base: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2, Apache-2.0.
- ONNX conversion: Xenova/paraphrase-multilingual-MiniLM-L12-v2.
- Revision: `2c4055b12046f11709e9df2c122e59ffbdc2f900`.
- Transformers.js 3.8.1; ONNX Runtime CPU for this evaluation, WASM in browser worker.
- q8 weights: 118,308,126 bytes; tokenizer: 17,082,913 bytes.
- 384 dimensions, attention-mask mean pooling, L2 normalization, cosine ranking.
- 128 model tokens including special tokens. Actual tokenizer splits passages;
  offsets refer to original page Unicode code points. Long queries are rejected.
- Keyword baseline counts normalized Unicode terms; hybrid uses equal-weight
  reciprocal rank fusion with constant 60, not addition of incomparable raw scores.

Primary model/runtime references:
https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2
https://huggingface.co/docs/transformers.js/v3.8.1/en/custom_usage

## Corpus and measured results

25 authored positive queries, five per language direction, across 30 distinct
passages (including five distractors), plus three unsupported questions. Each
positive query has one labelled relevant passage, so Recall@K equals Hit@K here.
Texts are synthetic records, not extracted PDFs; extraction is evaluated separately.
There was no model training or tuning, but this is a small development set, not a
held-out benchmark. Common factual acceptance cases are included; unseen training
data cannot be established. Simple, distinctive topics make this set easier than
real document libraries. Perfect scores here do not establish general accuracy.

| Method | Recall@1 | Recall@3 | Recall@5 | MRR |
|---|---:|---:|---:|---:|
| Keyword | 0.60 | 0.60 | 0.60 | 0.6000 |
| Semantic | 1.00 | 1.00 | 1.00 | 1.0000 |
| Hybrid RRF | 0.60 | 0.60 | 0.60 | 0.6334 |

| Direction (5 queries each) | Keyword R@1 | Semantic R@1 | Hybrid R@1 | Hybrid MRR |
|---|---:|---:|---:|---:|
| English → English | 1.00 | 1.00 | 1.00 | 1.0000 |
| Hindi → Hindi | 1.00 | 1.00 | 1.00 | 1.0000 |
| English → Hindi | 0.00 | 1.00 | 0.00 | 0.1045 |
| Hindi → English | 0.00 | 1.00 | 0.00 | 0.0622 |
| Mixed | 1.00 | 1.00 | 1.00 | 1.0000 |

For each direction, Recall@3 and @5 equal Recall@1 in this run; all other MRR
values equal their corresponding Recall@1. Full precision values are in the JSON.

## Failures and interpretation

Equal-weight RRF boosts weak same-language matches that appear in both lists.
This displaced all ten cross-language targets below rank 5, even though semantic
ranking placed them first. Hybrid is an explicit optional mode, not the default.
Prefer semantic for cross-language queries. Next work should compare BM25,
stopword handling and weighted fusion on a separate development/held-out split;
do not tune a threshold solely to make these 25 examples look better.

All three unsupported questions returned passages (automatic abstention 0/3).
Top cosine scores were about 0.396, 0.395 and 0.215. Similarity is not a calibrated
probability or evidence sufficiency score. The UI warns users and never generates
an answer from these rankings. Abstention and secure QA remain future work.

The saved run records model initialization and indexing latency, per-query latency,
and process RSS. CPU process RSS includes Node, tokenizer and runtime allocations;
it is NOT a browser peak-memory measurement. Browser tests separately execute real
WASM inference on desktop Chromium and Pixel 7 emulation. Physical phone memory,
battery usage, Safari and Firefox remain unmeasured.
