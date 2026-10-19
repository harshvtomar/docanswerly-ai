# DocAnswerly AI — Qwen3 LoRA training experiment

## Status: NOT TRAINED

The deployed application runs a quantized Qwen3-0.6B GGUF inference model
via Wllama. GGUF quantized inference weights cannot simply be fine-tuned
through the browser. Fine-tuning must use the compatible **full precision
Hugging Face Qwen/Qwen3-0.6B checkpoint**, not the shipped Q4_K_M file.

An opt-in GPU training script has been added, but **there are no trained
adapters, no fine-tuned weights, and no approved model replacement**.

## 1. Prepare the synthetic pilot and inspect it

\`\`\`bash
python3 training/prepare_data.py --output training/data
python3 training/validate_data.py --data training/data
python3 -m unittest discover -s training -p 'test_*.py'
python3 training/train_lora.py --data training/data --check
\`\`\`

The default pilot creates 1,400 original *synthetic template* examples
(840 train / 280 validation / 280 test), split by disjoint fictional
entities into train/validation/test.
It covers Hindi/English source-answer direction, source IDs, abstentions,
contradictory facts, numeric fidelity, prompt injection and mixed-language text.
It reuses template families across splits, so even its held-out test split
is not a strong generalization benchmark. It is **not human-reviewed** and
must not be promoted as 10k vetted QA pairs.

Neither the prior 12k validation suite nor the original 30 genuine-model
evaluation is used for training. Never train on those benchmark targets.

## 2. Optional GPU pilot — explicit action, no automatic charges

On an environment with a CUDA GPU, access to the full licensed model weights,
appropriate disk/RAM, and GPU training dependencies:

\`\`\`bash
python3 -m pip install -r training/requirements.txt
python3 training/train_lora.py --data training/data --train --allow-synthetic --max-steps 100
\`\`\`

This command is illustrative. Run it only after inspecting and approving
the synthetic data and environment. The script refuses CPU-only hardware and
refuses the unreviewed pilot without \`--allow-synthetic\`. It does not push
data, models or artifacts to the Hub. Actual output is written to the
gitignored \`training/output/\` folder and would be a LoRA *adapter*.

## 3. Required accuracy proof before deployment

- Review and replace or improve synthetic examples with lawful, diverse,
  human-checked document-grounded Hindi-English QA.
- Build truly out-of-distribution, untouched test sets with Hindi, English,
  mixed-language PDFs and unsupported requests.
- Compare baseline vs fine-tuned model on exact same external evaluation
  using answer correctness, citation validity, false refusals, unsupported
  hallucination, language compliance, latency and performance confidence
  intervals. Audit for benchmark leakage.
- Only if it consistently wins with no safety regression, merge the adapter
  into the original compatible HF model, convert to GGUF and quantize for
  Wllama, and verify browser memory/download limits. Use the maintained
  llama.cpp tools and check compatibility.
- Any public upgrade needs normal CI, separate binary license review,
  measured latency and explicit release approval. Version stays v0.2.0
  until then.

Official model: https://huggingface.co/Qwen/Qwen3-0.6B (Apache-2.0)
Official TRL SFT docs: https://huggingface.co/docs/trl/sft_trainer
Official llama.cpp adapter conversion:
https://github.com/ggml-org/llama.cpp/blob/master/convert_lora_to_gguf.py
