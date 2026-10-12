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
