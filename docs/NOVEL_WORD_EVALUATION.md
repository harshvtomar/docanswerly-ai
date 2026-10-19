# Novel word Qwen3 real-inference accuracy evaluation

New evaluation suite: `evaluation/novel-word-heldout.json` (24 fictional grounded
codeword questions). Generated before first Qwen3 invocation from a deterministic
syllable vocabulary, withheld from training and **distinct from all 500,000
synthetic identifier forms** in `scripts/novel-words-500k.ts`.

Exactly 20 questions require **verbatim identity copying from provided evidence**
across English/English, Hindi/Hindi and cross-language queries; four require
**abstention** for explicitly unpublished identifiers where a distractor
placeholder is present. Labels, target text and citations are frozen.

Run `.github/workflows/novel-word-evaluation.yml` in GitHub Actions to load the
real browser-local Qwen3 GGUF through Wllama and save all raw model stages and
displayed responses. It MUST NOT claim the 500k invented-word validator test
represents 500k model inferences.

Proxy: supported answer requires exact expected word, correct status and
citation, and a direct structurally valid model answer; unsupported cases
require exact zero-citation empty raw model abstention to score as successful
*model* refusals. Heuristic pre-checks and app-repaired refusals are reported
separately. Unverified extra claims may pass the string-match proxy. Cases are
small and assistant-authored; source is oracle-passed (retrieval and OCR omitted).
No independent bilingual human adjudication yet.

**Interpretation**: this measures narrow fictional-name copying and refusal,
not general word understanding or population PDF Q&A accuracy. Word families
are formulaic, artificially generated, not attested lexicon entries.
