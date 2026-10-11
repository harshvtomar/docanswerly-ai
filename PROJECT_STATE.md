# DocAnswerly AI — Project state

Version: v0.1.0 (Session 1 development checkpoint)
Repository: https://github.com/harshvtomar/docanswerly-ai
Default branch: main
Live frontend verified: https://harshvtomar.github.io/docanswerly-ai/
Last verified remote commit: f9679268f0daa9153e6e4926635644338d6619d8

Initial scaffold is live. This checkpoint adds browser-local PDF extraction,
English/Hindi OCR, page viewer, document library, local keyword search and
page-aware chunks. Unit tests: 15 passed. PDF evaluation: 7 passed. Browser
integration suite added; execution pending GitHub Actions. Semantic adapter
is unit-tested with stub vectors only: no multilingual model connected.
LLM answering and external backend pending. No credentials required for local
processing. No uploaded documents persisted or sent to remote inference.

Fixture OCR CER: English 0%, Hindi 5.17%, mixed 0%. Small clean synthetic
single-line samples only; not an estimate for arbitrary documents.

Next: verify browser suite and live operations; fix defects; finish documentation.
