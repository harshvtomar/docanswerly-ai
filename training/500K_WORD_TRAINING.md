# DocAnswerly AI — 500,000 distinct word forms: training and browser compatibility

**State as of 20 October 2026: NO new model training has occurred.**
The live site still uses the original pinned **Qwen3-0.6B Q4_K_M GGUF**. The
existing 500,000-case stress test is *not* training. This working environment
has no CUDA GPU or Apple Metal training device, and no licensed, human-reviewed
500,000-distinct-word corpus is available.

## What "500,000 unique words" means here

A unique **word form** is an NFC-normalized, case-folded Unicode letter sequence,
including Hindi vowel marks; repetitions are counted once, and it is distinct
from a Qwen tokenizer token. Counting 500,000 different strings alone does not
train any weights, expand the model's vocabulary, or demonstrate accuracy.
Random nonce words and templated synthetic variants are not acceptable
training evidence. Training quality needs real document passages and
independently checked question/answer/refusal labels.

The importer counts **distinct word forms in the training split's questions
and evidence**, not in the held-out test split or model output, and by default
rejects data below **500,000**. Reaching the lexical target is a data quantity
check, not a model accuracy certificate.

## 1. Obtain lawful, reviewed training data

Prepare a private UTF-8 JSONL file, e.g. `training/input/reviewed.jsonl`,
using this schema for **each** example (shown as a format illustration, NOT
an actual reviewed or included data row):

```json
{"source_id":"licensed-book-123","license":"CC-BY-4.0","reviewer_id":"reviewer-with-consent","reviewed":true,"split":"train","question":"What is the delivery date?","evidence":["The book is scheduled for delivery on 14 June."],"expected":{"status":"answer","answer":"14 June.","language":"en","citations":["E1"]}}
```

For unsupported questions use `status: "insufficient_evidence"` and an empty
answer and citation array. Conflicts likewise use `status: "conflict"` and
empty answer/citations. The `reviewed` flag and reviewer ID must represent a
real independent check; do not self-certify generated labels. Allowed explicit
licenses: CC0-1.0, CC-BY-4.0, Apache-2.0 and MIT. Confirm attribution and
suitability independently. Do not ingest personal/private PDFs without
permission, copyrighted corpora without appropriate terms, or original
benchmark cases from `evaluation/`. Assign complete source IDs to only one
of train/validation/test; repeated or cross-split sources are rejected.

Run:

```bash
python3 training/prepare_reviewed_corpus.py --input training/input/reviewed.jsonl --output training/data-reviewed --min-unique-words 500000
python3 training/validate_data.py --data training/data-reviewed
python3 training/train_lora.py --data training/data-reviewed --check
```

Without a real corpus the importer correctly refuses to claim 500,000 forms.
The input, converted rows and model weights are gitignored and must remain
private. An optional diagnostic `--min-unique-words 0` is for format
testing **only**; it does not satisfy the requested volume.

## 2. Train only on a provisioned compatible device

Qwen's quantized browser GGUF is **not** a trainable HF checkpoint. On a
privately authorized CUDA GPU, install the dependencies and run the existing
TRL/PEFT LoRA script against the reviewed dataset:

```bash
python3 -m pip install -r training/requirements.txt
python3 training/train_lora.py --data training/data-reviewed --train --max-steps 1000
```

Set training steps/epochs based on the corpus size and report *actual
examples/tokens processed*. Even 1,000 steps do not prove every form has been
seen. Do not use the `--allow-synthetic` flag for reviewed data. Current
training run defaults to a limited pilot and does not provide a scale guarantee.
Training hardware is NOT provisioned by this repository or by GitHub Pages.

After the actual adapter exists, perform an explicit metadata check and merge
using `python3 training/merge_lora.py --adapter training/output/qwen3-docanswerly-lora/adapter --merge`
(with the installed HF/PEFT dependencies). Then use maintained llama.cpp tools
to convert the merged HF directory to GGUF and quantize to a browser-tested
format (e.g. Q4_K_M). **Do not** copy a raw adapter directly into the website.
See [PEFT merging](https://huggingface.co/docs/peft/main/conceptual_guides/lora)
and [TRL SFT documentation](https://huggingface.co/docs/trl/sft_trainer).

## 3. Model deployment contract

The site loads `generation/active-model.json` from the same GitHub Pages
origin. It validates the model identifier, GGUF-only file name, Qwen3 base
architecture, size and hash fields, and **never accepts arbitrary browser URLs**.
The default package is still the checksum-pinned original GGUF.

Only a *trained, merged, quantized, tested and independently human-approved*
model may be bundled as a replacement. On a dedicated build machine provide
two private variables:

```bash
DOCANSWERLY_APPROVED_GGUF_FILE=/secure/models/final-qwen3.gguf
DOCANSWERLY_APPROVAL_JSON=/secure/reviews/release-approval.json
npm run build
```

The private JSON approval record must contain:

```json
{
  "schemaVersion": 1,
  "approvedForPublicRelease": false,
  "independentHumanReviewCompleted": false,
  "modelBase": "Qwen/Qwen3-0.6B",
  "tokenizerUnmodified": true,
  "format": "GGUF",
  "comparisonPassed": false,
  "safetyRegressionPassed": false,
  "reviewer": "",
  "reviewDate": "2026-10-20",
  "evaluationRunUrl": "https://github.com/harshvtomar/docanswerly-ai/actions/runs/39316203719",
  "modelId": "qwen3-reviewed-v1",
  "sha256": "REPLACE_WITH_REAL_64_CHARACTER_SHA256"
}
```

This is a **deliberately unapproved template**. Fill fields only with real
post-training evaluation and independent reviewer evidence; reusing the
baseline test's run as new fine-tune proof would be false. The build checks
true approvals, signed-model SHA-256 correspondence and size (maximum 650 MB) before bundling,
publishes a versioned GGUF filename, and preserves a single compatible
Wllama model for browser inference. Manual public release still requires full
CI, actual English/Hindi browser/model inference, performance/memory checks
and rollback readiness. GitHub Actions **never automatically trains** or
selects a privately supplied model.

## 4. Release requirements

Benchmark the original vs candidate on *new, untouched* bilingual supported
and unsupported cases and real OCR documents. Require corrected human-judged
answers, citations, Hindi fluency, actual valid model refusals, hallucination
resistance, no new security regressions, site performance and browser
compatibility. An improved training loss or a safe application refusal
cannot substitute for these. Preserve the original 28/24-case results and
the v0.2.0 production model until acceptance. A 500,000 unique-word count by
itself is **not** a reason to deploy model weights.
