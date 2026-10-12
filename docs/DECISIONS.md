# Engineering decisions

1. **Local-first Session 1.** Browser processing gives a working public demo with
   no secret handling, inference charges or uploaded-document storage.
2. **GitHub is authoritative.** Public repository created via the authorized
   GitHub browser session. Shell cloning works; shell pushing failed because no
   Git credential is installed. Checkpoints use the connected GitHub tree/commit/
   ref APIs with expected parent SHA and non-forced fast-forward updates.
3. **Static deployment.** Vite base `/docanswerly-ai/`; official upload/deploy Pages
   actions; tests/build/browser checks gate production.
4. **Self-host runtime assets.** PDF.js worker is emitted by Vite. OCR workers,
   WebAssembly, English/Hindi data and PDF supporting resources are included in
   `dist`; no CDN request is needed while reading a document. Build downloads
   versioned language data; an unavailable CDN fails the build rather than silently
   shipping missing OCR resources.
5. **Unicode and evidence first.** NFC normalization preserves Devanagari combining
   marks; text stays attached to original page numbers. OCR uses eng+hin together.
6. **Explicit feature boundaries.** Same-language keyword search is working.
   Semantic index interfaces exist, but no model is configured. No fake QA,
   fake analytics or hardcoded generated answers are present.
7. **Fixtures disclose their structure.** ReportLab-shaped glyphs produced private-
   use mappings in initial experiments. Final text fixtures use an original-Unicode
   overlay over shaped images; scan fixtures have no text layer. This is a limited
   synthetic corpus and must be expanded before broad quality claims.
8. **Dependencies.** Installed versions are locked by package-lock.json. PDF.js
   6.4 uses `pdf.loadingTask.destroy()`. Tesseract.js 7 initializes with an eng/hin
   language array. MIT application license; PDF.js/Tesseract Apache-2.0 and fonts
   SIL OFL retain their upstream licensing.

## Primary technical references checked during Session 1

- https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.html
- https://github.com/naptha/tesseract.js/blob/master/docs/api.md
- https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md
- https://github.com/actions/deploy-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Candidate for Session 2 only: https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2

## Session 2

10. Local q8 MiniLM avoids API credentials and document transmission. Pinned
    Transformers.js 3.8.1 runs the ONNX conversion in a dedicated WASM worker;
    Node CPU runs reproducible evaluation with the same weights/tokenizer.
11. Build-time model downloads verify SHA-256 and produce same-origin assets.
    Opt-in UI discloses ~160 MB first download and substantial memory. Page load
    and keyword search do not require this download. No paid service activated.
12. Token-aware subdivision avoids silently truncating Hindi. Queries over 128
    tokens are rejected. Source offsets remain original normalized page code points.
13. Equal-weight RRF is intentionally reported with its observed failures. Hybrid
    is optional; keyword stays default. No threshold was fitted to the tiny corpus.
14. Source passage retrieval is not answer generation or evidence sufficiency.
    Unsupported queries still produce rankings; no fabricated answers/citations.
15. OCR cancellation discards only the unfinished document/remaining queue. Completed
    documents survive. OCR timeouts release available worker handles; late-created
    handles are terminated. Broader scan-quality work remains for Session 3.
