# Session 1 test results

Verified feature commit: 579aede112acecd0b06c88bc05f05fd0c584fbb4.
GitHub Actions run: https://github.com/harshvtomar/docanswerly-ai/actions/runs/38174907155
Build and deployment: successful.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Vitest unit tests | 15 | 0 | 0 |
| Real PDF/OCR evaluation | 7 | 0 | 0 |
| Playwright desktop Chromium | 10 | 0 | 0 |
| Playwright Pixel 7 emulation | 10 | 0 | 0 |
| Total | 42 | 0 | 0 |

Browser suite: 20 passed in 25.5 seconds on the CI runner. Covers six English,
Hindi and mixed text/scan ingestion-and-viewer cases per viewport; sample page
navigation, Hindi source search and deletion; invalid upload; hybrid text/scan
page numbering; responsive overflow and same-origin OCR assets. No application
pageerror events occurred in the six ingestion cases per viewport.

## PDF/OCR evaluation

| Language | Embedded text CER | Scanned OCR CER |
|---|---:|---:|
| English | 0% | 0% |
| Hindi | 0% | 5.1724% |
| Mixed English/Hindi | 0% | 0% |

`npm run test:pdf` renders genuine image-only scan PDFs with PDF.js at scale 2
then runs Tesseract eng+hin. References and actual outputs are in evaluation.json.
CER uses Unicode code-point Levenshtein distance after NFC normalization and
whitespace collapse. The regression threshold is exact extraction for text and
CER <= 15% for these scans. Hindi OCR misread the final `है।` as `gl`.
Engine confidence in the UI is a separate, uncalibrated score.

Fixtures contain a single clean sentence each, not diverse document layouts.
Searchable text fixtures are image-plus-Unicode-overlay PDFs, not a representative
sample of all font encodings. Regeneration and limitations are documented beside
the fixture files. No real-world accuracy or handwritten recognition is claimed.

## Direct public smoke check

Opened the unauthenticated Pages URL after deployment. Successfully loaded the
three-page bilingual sample; checked Hindi extracted text and a page-2 keyword
result; deleted the document; forced OCR on all three sample pages; and rendered
the original Hindi page. All three pages registered as OCR pages. No app-origin
JavaScript errors observed; cloud browser extension metadata errors were separate
from the application. The responsive desktop screenshot is in docs/screenshots.

## Not measured / remaining coverage

Real multilingual semantic retrieval and LLM inference are absent; Recall@K and
answer-quality metrics are N/A. The adapter unit test uses explicitly labelled
stub vectors only. Physical mobile devices, Safari/Firefox, handwriting, rotation,
noisy/multi-column scans, arbitrary legacy Hindi encodings, corrupted individual
page recovery and maximum-size resource exhaustion require further validation.
No tests were skipped in the executed suites; these gaps are not covered tests.

# Session 2 test results

Verified reliability commit: 708dcd33512179ea9ac1e3ce33bc51ff2ceb9b3c.
Actions: https://github.com/harshvtomar/docanswerly-ai/actions/runs/38230886095
Build and deployment succeeded. Check the current HEAD for later release runs.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Vitest unit tests | 24 | 0 | 0 |
| Real PDF/OCR checks | 7 | 0 | 0 |
| Real model/tokenizer acceptance checks | 9 | 0 | 0 |
| Playwright desktop Chromium | 13 | 0 | 0 |
| Playwright Pixel 7 emulation | 13 | 0 | 0 |
| Total | 66 | 0 | 0 |

The original 42-check baseline remains intact. New checks cover RRF ranking, span
deduplication, document-index replacement, failed-provider atomicity, cancellation
and timeout cleanup. Real model checks cover dimensions, token budgets/source
offsets, empty/long query rejection and five language-direction acceptance cases.
Browser tests execute real WASM cross-language search, hybrid mode, correct source
navigation, deletion, model-load failure with keyword fallback, and OCR cancellation
followed by a successful new upload. Browser suite: 26 passed in 49.7 seconds on CI.

25-query ranking quality measurements are evaluation rows, not 25 extra passing
tests. Hybrid ranking failures and all three unsupported-query non-abstentions
remain recorded in RETRIEVAL_EVALUATION.md; passing engineering checks do not erase
these quality limitations. Hindi OCR CER stays 5.1724% on the original single-line
fixture. No new noisy/rotated/multi-column accuracy claim is made.

Public smoke check on the retrieval deployment: model initialized from same-origin
assets, indexed three pages, ranked the Hindi/mixed page 3 first for the English
question about rapidly growing AI usage, and navigated to that page. No app-origin
JavaScript error observed; browser extension metadata errors were unrelated.

Local verification used Node 24: npm ci baseline, npm test, npm run test:pdf,
npm run test:retrieval, npm run build. CI repeats npm ci and all suites, installing
Chromium for the browser tests. Saved Node timing/RSS measurements are not browser
performance benchmarks. Safari/Firefox, physical devices, broad scan quality,
peak-memory stress, calibrated abstention and genuine QA remain untested.

# Session 3A evaluation recovery

Run 38331700774 at 3ccf320: **93 passed, 1 failed, 0 skipped** engineering checks
(49 unit + 7 PDF/OCR + 9 embedding + 28 browser passed; one evaluation assertion
failed). Crucially, all 30 real-model rows were produced before the assertion.
Failure: HEAD model request ERR_ABORTED after HTTP 200. No page errors. Deployment
skipped. Original raw results/diagnostics: `runs/38331700774/`.

New recovery local checks: **56 unit + 7 PDF/OCR + 9 embedding = 72 passed,
0 failed, 0 skipped**. CPU-only npm ci on Node 24 succeeded. Hybrid evaluation
reproduced prior metrics. Seven unit cases protect narrow request classification;
new browser negative-path tests still require CI confirmation at this checkpoint.
No quality failure was reclassified as a pass. See RAG_EVALUATION.md.

## Verified Session 3A completion

Code/deployment: f5d8c85d6514e0125a4942597afa7fc6017f3541.
[Run 38366200372](https://github.com/harshvtomar/docanswerly-ai/actions/runs/38366200372)
completed successfully on 13 October 2026; status and artifacts reverified on
19 October 2026. Both build 115191822041 and deploy 115198205359 succeeded.

| Suite | Passed | Failed | Skipped |
|---|---:|---:|---:|
| Vitest | 56 | 0 | 0 |
| PDF/OCR | 7 | 0 | 0 |
| Real embedding checks | 9 | 0 | 0 |
| Desktop/mobile UI cases | 28 | 0 | 0 |
| Full thirty-case evaluation infrastructure | 1 | 0 | 0 |
| Module/model failure-path browser tests | 2 | 0 | 0 |
| Total | 103 | 0 | 0 |

The thirty model cases are evaluation rows, not thirty passing correctness tests.
All thirty real outputs completed; 13 answer-validation errors remain unchanged.
Initialization took 23,411.3 ms; browser suite 16.0 minutes. Module failure reached
Failed in 121 ms; injected model HTTP 503 did so in 199 ms. Full-run diagnostics:
zero page/HTTP/console errors and one exact model HEAD 200 / ERR_ABORTED warning.
All raw request failures remain recorded. No other failures were exempted.
Raw JSON and provenance: docs/runs/38366200372/ (relative to repository root).
Historical run docs/runs/38331700774/ remains unchanged.

Post-deployment public smoke on 13 October: index-C1rC7N9P.js matched production;
bilingual sample processed three pages; Hindi search returned page 2 and citation
navigation opened it. No application-origin errors; unrelated extension errors
were excluded. Public evaluation.html returned GitHub Pages 404 as intended.

The final documentation/results-only checkpoint uses [skip ci] to avoid repeating
unchanged expensive inference. No executable file, test or workflow gate changes.
The tested/deployed code remains f5d8c85; inspect current HEAD for final docs SHA.
Version remains v0.2.0. No backend, paid service or prompt/label tuning was added.
