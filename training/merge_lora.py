#!/usr/bin/env python3
"""Merge an independently evaluated LoRA adapter into the exact Qwen3 base.

This is explicitly opt-in, CPU/RAM intensive, and does NOT create a GGUF.
Use llama.cpp's current convert_hf_to_gguf.py and llama-quantize afterwards.
Never publish the merged model before external evaluation + browser smoke.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path

BASE = "Qwen/Qwen3-0.6B"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--adapter", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("training/output/merged-hf"))
    parser.add_argument("--merge", action="store_true", help="Explicitly execute merge")
    args = parser.parse_args()
    adapter_config = args.adapter / "adapter_config.json"
    if not adapter_config.is_file():
        raise SystemExit("No PEFT adapter_config.json. Train an actual compatible adapter first.")
    config = json.loads(adapter_config.read_text(encoding="utf8"))
    if config.get("base_model_name_or_path") not in (BASE,):
        raise SystemExit("Adapter base model does not match Qwen/Qwen3-0.6B.")
    if not args.merge:
        print("CHECK ONLY: compatible adapter metadata found; no weight merge attempted.")
        return
    try:
        import torch
        from peft import PeftModel
        from transformers import AutoModelForCausalLM, AutoTokenizer
    except ImportError as exc:
        raise SystemExit("Install training/requirements.txt to merge LoRA.") from exc
    base = AutoModelForCausalLM.from_pretrained(
        BASE, torch_dtype=torch.float32, device_map="cpu", trust_remote_code=False,
    )
    model = PeftModel.from_pretrained(base, str(args.adapter), is_trainable=False)
    merged = model.merge_and_unload()
    args.output.mkdir(parents=True, exist_ok=True)
    merged.save_pretrained(str(args.output), safe_serialization=True)
    AutoTokenizer.from_pretrained(BASE, trust_remote_code=False).save_pretrained(str(args.output))
    (args.output / "docanswerly-merge-metadata.json").write_text(
        json.dumps({
            "base_model": BASE, "merged_adapter": str(args.adapter),
            "trained_model_benchmark_approved": False,
            "ready_for_GGUF_conversion": True,
            "ready_for_public_deployment": False,
            "tokenizer_changed": False,
        }, indent=2) + "\n", encoding="utf8",
    )
    print("Merged Hugging Face model saved. Convert, quantize, independently evaluate and explicitly approve before publishing.")

if __name__ == "__main__":
    main()
