#!/usr/bin/env python3
"""Explicit, opt-in GPU Qwen3 LoRA training (no hidden paid service).

--check validates data and exits without loading any model.
--train requires CUDA and explicit acknowledgement of synthetic/unreviewed
pilot data. All adapters remain local/private until independently evaluated.
"""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from validate_data import validate

MODEL = "Qwen/Qwen3-0.6B"

def main() -> None:
    ap=argparse.ArgumentParser()
    ap.add_argument("--data",type=Path,default=Path("training/data"))
    ap.add_argument("--output",type=Path,default=Path("training/output/qwen3-docanswerly-lora"))
    ap.add_argument("--train",action="store_true",help="Perform actual LoRA training (CUDA required)")
    ap.add_argument("--check",action="store_true",help="Validate inputs and exit without training (default)")
    ap.add_argument("--allow-synthetic",action="store_true",
                    help="Explicitly acknowledge unreviewed synthetic pilot; not for production deployment")
    ap.add_argument("--max-steps",type=int,default=100)
    args=ap.parse_args()
    audit=validate(args.data)
    print("Dataset verification:",json.dumps(audit,ensure_ascii=False))
    if not args.train:
        print("CHECK ONLY: 0 model training steps, no model weights loaded or modified.")
        return
    if audit["synthetic"] and not args.allow_synthetic:
        raise SystemExit("Training is blocked: the pilot dataset is synthetic and unreviewed. Use --allow-synthetic ONLY for an experimental pilot.")
    if not audit["synthetic"] and not audit["human_reviewed"]:
        raise SystemExit("Training is blocked: reviewed corpus provenance is missing.")
    if args.max_steps < 1 or args.max_steps > 2000:
        raise SystemExit("--max-steps must be 1..2000")
    # Import heavy optional libraries only after a no-GPU preflight check.
    try:
        import torch
    except ImportError as ex:
        raise SystemExit("Install GPU training requirements from training/requirements.txt") from ex
    if not torch.cuda.is_available():
        raise SystemExit("CUDA GPU unavailable. No Qwen3 training attempted; no weights changed.")
    from datasets import load_dataset
    from peft import LoraConfig
    from trl import SFTConfig, SFTTrainer
    args.output.mkdir(parents=True,exist_ok=True)
    data=load_dataset("json",data_files={
        "train":str(args.data/"train.jsonl"),
        "validation":str(args.data/"validation.jsonl"),
    })
    bf16 = torch.cuda.is_bf16_supported()
    cfg=SFTConfig(
        output_dir=str(args.output),
        max_steps=args.max_steps,
        max_length=768,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=1e-4,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        gradient_checkpointing=True,
        eval_strategy="steps",
        eval_steps=50,
        save_strategy="steps",
        save_steps=50,
        save_total_limit=2,
        logging_steps=10,
        bf16=bf16,
        fp16=not bf16,
        completion_only_loss=True,
        report_to="none",
        push_to_hub=False,
        model_init_kwargs={"dtype":torch.bfloat16 if bf16 else torch.float16},
        seed=42,
    )
    adapter=LoraConfig(
        r=8,lora_alpha=16,lora_dropout=0.05,
        target_modules=["q_proj","k_proj","v_proj","o_proj"],
        bias="none",
        task_type="CAUSAL_LM",
    )
    trainer=SFTTrainer(
        model=MODEL,args=cfg,train_dataset=data["train"],
        eval_dataset=data["validation"],peft_config=adapter,
    )
    trainer.train()
    trainer.save_model(str(args.output/"adapter"))
    (args.output/"training_run.json").write_text(json.dumps({
        "base_model":MODEL,"trained":True,"steps":trainer.state.global_step,
        "dataset":audit,"adapter_path":str(args.output/"adapter"),
        "deployment_approved":False,
        "heldout_model_accuracy_evaluated":False,
    },indent=2)+"\n",encoding="utf8")
    print("Trained LoRA adapter saved locally. NOT deployed; evaluate independently first.")

if __name__=="__main__":
    main()
