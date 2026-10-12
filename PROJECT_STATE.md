# DocAnswerly AI — Project state

- Project: DocAnswerly AI
- Tagline: Upload Documents. Ask Questions. Get Answers.
- Technical description: Multilingual RAG-Based Document Question Answering System
- Version: v0.2.0
- Repository: https://github.com/harshvtomar/docanswerly-ai
- Public frontend: https://harshvtomar.github.io/docanswerly-ai/
- Default branch: main
- Starting Session 2 SHA: e57c20cd11be56a263e86e12586ad37e9ab0a7af
- Last verified feature SHA: 708dcd33512179ea9ac1e3ce33bc51ff2ceb9b3c
- Verified feature CI: run 38230886095, all 66 checks passed; build and deploy succeeded.

This release documentation follows the verified feature checkpoint. A commit cannot
contain its own SHA: inspect current remote main HEAD and its Actions run. The final
release version/docs run uses the same mandatory gates before deployment.

## Implemented status

| Area | Status |
|---|---|
| React frontend, library, viewer, upload/deletion | Working on public Pages |
| English/Hindi/mixed selectable PDF extraction | Verified on existing synthetic fixtures |
| English/Hindi/mixed OCR | Genuine Tesseract, baseline preserved |
| OCR cancellation and timeouts | Implemented; cancellation/recovery browser-tested |
| Keyword search | Local Unicode term matching, immediate default |
| English/Hindi semantic and cross-language retrieval | Genuine local model, evaluated and browser-tested |
| Hybrid retrieval | Optional RRF mode; weak cross-language ranking in evaluation |
| Original document/page citations | Working source navigation; no generated answer claims |
| RAG generated answers | Pending, UI disabled |
| Secure external backend | Pending; none deployed, no credentials configured |
| Persistence/shared document storage | None; refresh clears tab memory |

## Model / metrics

Xenova/paraphrase-multilingual-MiniLM-L12-v2 q8 ONNX, revision
2c4055b12046f11709e9df2c122e59ffbdc2f900, Apache-2.0 base model.
Transformers.js 3.8.1 with browser worker WASM; Node CPU evaluation uses same weights.
384 dimensions, normalized mean pooling, max 128 tokens. Build downloads/checksums
assets; browser uses same-origin files only. Opt-in ~160 MB download, substantial
memory; no uploaded PDF/text sent externally. 500 token-sized passages per index.

24 unit + 7 PDF/OCR + 9 real-model checks + 26 browser = 66 passed, 0 failed,
0 skipped at verified feature gate. See docs/TEST_RESULTS.md for historical results.

25-query synthetic development evaluation: semantic Recall@1/3/5 = 1.00,
MRR = 1.00. Keyword Recall@1/3/5 = 0.60, MRR = 0.60. Hybrid Recall@1/3/5 = 0.60,
MRR = 0.6334. All ten cross-language hybrid queries fall below rank 5. No held-out
or general accuracy claim. Unsupported queries: 0/3 automatic abstentions.
OCR CER: English 0%, Hindi 5.1724%, mixed 0% on original clean single-line scans.

## Known limits / priorities

- Improve lexical/hybrid fusion using independently split harder retrieval data.
- Implement calibrated evidence sufficiency; retrieval rankings do not prove support.
- Secure grounded generation requires authorized inference access and server-side
  secrets, authentication/rate limits, validated citations and prompt-injection tests.
- Expand noisy, rotated, mixed-region, multi-column and independently authored PDFs.
- OCR cancellation discards unfinished PDF; completed documents survive. Initializing
  worker cleanup waits for a handle. No claim of perfect termination of stuck runtime.
- No table/handwriting guarantee, password entry, persisted workspace, Safari or
  physical low-memory mobile validation. 25 MiB / 40 pages / 8 docs limits remain.
- No paid services activated. No credentials needed for currently working features.

Continue with NEXT_SESSION_PROMPT.md (Session 3). Never restart or replace this repo.


### Session 3 restoration in progress
Current remote baseline verified: 03c6001e21d7714d3dba61d3fe20134c8348e82f.
40 local checks rerun successfully; baseline browser/deployment gates verified
in Actions 38231588343. CPU-only npm install avoids optional CUDA download.
Generation remains pending while a local model is evaluated.
