#!/usr/bin/env bash
# Explicit local Apple Silicon pilot; never invoked automatically by CI.
set -euo pipefail
if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Requires Apple Silicon macOS. No training attempted." >&2
  exit 2
fi
if [[ "$(printenv DOCANSWERLY_ALLOW_SYNTHETIC_TRAINING 2>/dev/null || true)" != "1" ]]; then
  echo "Synthetic pilot labels are unreviewed. Set DOCANSWERLY_ALLOW_SYNTHETIC_TRAINING=1 only after review." >&2
  exit 2
fi
command -v mlx_lm.lora >/dev/null || {
  echo "Install: python3 -m pip install 'mlx-lm[train]'" >&2
  exit 2
}
python3 training/prepare_data.py --output training/data
python3 training/validate_data.py --data training/data
python3 training/export_mlx.py --data training/data --output training/mlx
mkdir -p training/output
echo "Starting local Qwen3-0.6B LoRA pilot. No model upload or deployment."
mlx_lm.lora \
  --model Qwen/Qwen3-0.6B \
  --train \
  --data training/mlx \
  --iters 100 \
  --batch-size 1 \
  --num-layers 4 \
  --max-seq-length 512 \
  --mask-prompt \
  --adapter-path training/output/mlx-adapter
echo "Adapter saved privately. Do not deploy before independent evaluation."
