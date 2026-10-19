#!/usr/bin/env python3
"""Validate training example structure, citations, splits and safety semantics."""
from __future__ import annotations
import argparse
import json
from pathlib import Path

def validate(data_dir: Path) -> dict:
    manifest = json.loads((data_dir/"manifest.json").read_text(encoding="utf8"))
    if not manifest.get("synthetic") or manifest.get("reviewed_by_human"):
        raise ValueError("Synthetic pilot provenance incorrectly labelled")
    all_rows = set()
    counts = {}
    statuses = set()
    for split in ("train","validation","test"):
        path = data_dir / (split + ".jsonl")
        rows = 0
        for line in path.read_text(encoding="utf8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            if sorted(row) != ["completion","prompt"]:
                raise ValueError("Prompt-completion record has unexpected fields")
            if [m["role"] for m in row["prompt"]] != ["system","user"]:
                raise ValueError("Missing system/user prompt")
            if len(row["completion"]) != 1 or row["completion"][0]["role"] != "assistant":
                raise ValueError("Expected one assistant completion")
            payload = json.loads(row["prompt"][1]["content"])
            output = json.loads(row["completion"][0]["content"])
            if sorted(output) != ["answer","citations","language","status"]:
                raise ValueError("Wrong answer JSON schema")
            if output["language"] not in ("hi","en"):
                raise ValueError("Invalid language")
            if output["status"] not in ("answer","insufficient_evidence","conflict"):
                raise ValueError("Invalid answer status")
            if not isinstance(output["citations"], list) or len(set(output["citations"])) != len(output["citations"]):
                raise ValueError("Invalid duplicate citations")
            valid_ids = {c["id"] for c in payload["evidence"]}
            if not set(output["citations"]).issubset(valid_ids):
                raise ValueError("Invented training citation")
            if output["status"] == "answer":
                if not output["answer"].strip() or not output["citations"]:
                    raise ValueError("Empty supported answer")
                if output["language"] == "hi" and not any('\u0900' <= c <= '\u097f' for c in output["answer"]):
                    raise ValueError("Hindi training answer has no Devanagari")
            elif output["answer"] or output["citations"]:
                raise ValueError("Abstention must have empty answer and citations")
            raw = json.dumps(row, ensure_ascii=False, sort_keys=True)
            if raw in all_rows:
                raise ValueError("Same prompt-completion row appears in multiple splits")
            all_rows.add(raw)
            rows += 1
            statuses.add(output["status"])
        if rows != manifest["examples_per_split"][split]:
            raise ValueError(f"Incorrect split length for {split}")
        counts[split] = rows
    if sum(counts.values()) != manifest["cases_total"]:
        raise ValueError("Invalid total cases")
    if statuses != {"answer","insufficient_evidence","conflict"}:
        raise ValueError("Pilot data does not contain all answer statuses")
    return {
        "result":"pass", "counts":counts,"total":sum(counts.values()),
        "synthetic":True,"human_reviewed":False,"weight_updates":0,
    }

if __name__ == "__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--data",type=Path,default=Path("training/data"))
    args=ap.parse_args()
    print(json.dumps(validate(args.data),ensure_ascii=False,indent=2))
