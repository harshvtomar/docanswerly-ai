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
