#!/usr/bin/env python3
"""Convert validated HF prompt/completion examples to MLX chat JSONL (no training)."""
from __future__ import annotations
import argparse
import json
from pathlib import Path
from validate_data import validate

def export(source: Path, target: Path) -> dict:
    audit=validate(source)
    target.mkdir(parents=True,exist_ok=True)
    counts={}
    for split,name in (("train","train"),("validation","valid"),("test","test")):
        count=0
        with (source/(split+".jsonl")).open(encoding="utf8") as inp, (target/(name+".jsonl")).open("w",encoding="utf8") as output:
            for line in inp:
                if not line.strip():
                    continue
                row=json.loads(line)
                messages=row["prompt"]+row["completion"]
                if [m["role"] for m in messages]!=["system","user","assistant"]:
                    raise ValueError("Invalid MLX chat message roles")
                output.write(json.dumps({"messages":messages},ensure_ascii=False)+"\n")
                count+=1
        counts[name]=count
    if sum(counts.values())!=audit["total"]:
        raise ValueError("MLX conversion sample count mismatch")
    (target/"manifest.json").write_text(json.dumps({
        "status":"synthetic-unreviewed-pilot","splits":counts,
        "training_executed":False,
    },indent=2)+"\n",encoding="utf8")
    return {"result":"pass","counts":counts,"training_executed":False}

if __name__=="__main__":
    ap=argparse.ArgumentParser()
    ap.add_argument("--data",type=Path,default=Path("training/data"))
    ap.add_argument("--output",type=Path,default=Path("training/mlx"))
    opts=ap.parse_args()
    print(json.dumps(export(opts.data,opts.output),indent=2))
