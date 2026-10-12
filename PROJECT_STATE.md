# DocAnswerly AI — Project state

- Project: DocAnswerly AI
- Tagline: Upload Documents. Ask Questions. Get Answers.
- Technical description: Multilingual RAG-Based Document Question Answering System
- Version: v0.1.0
- Repository: https://github.com/harshvtomar/docanswerly-ai
- Public frontend: https://harshvtomar.github.io/docanswerly-ai/
- Default branch: main
- Last independently verified remote feature SHA: 579aede112acecd0b06c88bc05f05fd0c584fbb4
- Successful feature Actions run: 38174907155

This document is committed after that verified checkpoint. Its own commit cannot
contain its own SHA. Inspect CURRENT remote main HEAD when resuming; never assume
the reference SHA is still the head. Final handoff/docs and text/asset hardening
follow the feature checkpoint and run the same deployment gates.

## Completed and verified

Public GitHub repository and automatic Pages deployment. Responsive React app,
English/Hindi/mixed PDF extraction and OCR; actual PDF viewer; page navigation;
document library, upload and deletion; processing/error states; session-only local
storage; Unicode normalization; page-aware chunks; English/Hindi keyword search
with source-page navigation. Self-hosted runtime assets and fonts. Reproducible
synthetic text, scan and hybrid fixtures and browser CI tests. MIT license.

## Status matrix

| Area | Status |
|---|---|
| English PDF extraction | Verified on fixtures and public sample |
| Hindi PDF extraction | Verified on fixtures and public sample |
| English OCR | Verified genuine Tesseract output |
| Hindi OCR | Verified with observed recognition errors |
| Mixed-language OCR | Verified on fixture and forced-OCR public sample |
| Search | Local same-language keyword search implemented |
| Semantic retrieval | Provider-neutral adapter only; no real model |
| RAG question answering | Pending; UI disabled and explicitly labelled |
| External backend | Pending; none deployed |
| Persistent/shared storage | None; refresh clears tab memory |

Tests: 15 unit + 7 PDF evaluation + 20 browser = 42 passed, 0 failed, 0 skipped
on the verified feature run. Latest reruns are in Actions. OCR fixture CER:
English 0%, Hindi 5.17%, mixed 0%. No semantic Recall@K or QA metrics exist.

## Known limitations and next priorities

- Hindi OCR misread the final है। in its synthetic sentence; review original PDF.
- Text order/table structure and arbitrary font encodings need broader evaluation.
- Mixed text/image regions on one page may need force OCR.
- OCR cancellation and timeout recovery pending; 25 MiB/40-page/8-document limits.
- Small synthetic corpus; physical mobile and Safari/Firefox untested.
- No cross-language semantic search or LLM answers yet.

No credentials required for implemented processing. A future inference backend
needs authorized provider access and server-side secrets; no paid activation is
authorized. Next session: reliability and diverse fixtures, real multilingual
embeddings, labelled retrieval evaluation, then secure evidence-grounded answering.
Read NEXT_SESSION_PROMPT.md and all docs before editing.

## Session 2 in progress

Restoration checkpoint 97d4b5f156a9e35225cefdd75dc40961c44b4c7a verified remotely.
Real local embeddings and optional semantic/hybrid search added; browser inference
verification pending CI. Version remains 0.1.0 until verified. See SESSION_LOG and
docs/retrieval-evaluation.json for actual CPU evaluation; no secure QA backend.
