# Third-party notices

The application source is MIT licensed. Dependencies retain their own licenses.
Exact versions and dependency license metadata are recorded in package-lock.json.

- PDF.js (`pdfjs-dist`), Mozilla contributors: Apache-2.0.
- Tesseract.js and tesseract.js-core: Apache-2.0.
- Tesseract eng/hin trained data: Apache-2.0; distributed from versioned
  @tesseract.js-data npm packages. https://github.com/tesseract-ocr/tessdata
- React and React DOM: MIT.
- Vite, Vitest, Playwright and TypeScript: see their packaged licenses (MIT or Apache-2.0).
- DM Sans, Manrope, Noto Sans Devanagari: SIL Open Font License 1.1, distributed by
  Fontsource. The font license copies are bundled in public/licenses at build time.
- PDF standard font and decoder license files are retained in copied asset folders.

Synthetic fixture sentences are project-authored; no private documents are in the repository.

## Session 2 retrieval

Multilingual MiniLM base model: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
(Apache-2.0). ONNX conversion: Xenova/paraphrase-multilingual-MiniLM-L12-v2,
revision 2c4055b12046f11709e9df2c122e59ffbdc2f900. Model source and attribution
are preserved in scripts/model-manifest.json and docs/RETRIEVAL_EVALUATION.md.
Transformers.js: Apache-2.0. ONNX Runtime: MIT. The build copies their license
texts into the public licenses directory alongside the existing dependencies.
Model weights are downloaded during the build, not committed to Git history.

## Optional local answer generation (Session 3)

- Wllama 3.8.1: MIT, bundled license copied to `/generation/WLLAMA-LICENSE.txt`.
- Qwen3-0.6B: Apache-2.0, license in `docs/licenses/Qwen3-Apache-2.0.txt`.
- GGUF quantization: `unsloth/Qwen3-0.6B-GGUF`, revision
  `50968a4468ef4233ed78cd7c3de230dd1d61a56b`, file `Qwen3-0.6B-Q4_K_M.gguf`,
  396,705,472 bytes, SHA256
  `ac2d97712095a558e31573f62f466a3f9d93990898b0ec79d7c974c1780d524a`.
  Build verifies bytes/hash. Weights are downloaded during build, never committed.
