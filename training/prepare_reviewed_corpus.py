#!/usr/bin/env python3
"""Import a licensed, human-reviewed bilingual QA corpus for real SFT.

This does NOT generate fake vocabulary or train weights. Word types are
normalized Unicode surface forms, NOT tokenizer tokens and NOT new token IDs.
Input files must remain private/local. No benchmark/test cases may be imported.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from pathlib import Path
from prepare_data import MODEL, SYSTEM

ALLOWED_LICENSES = {"CC0-1.0", "CC-BY-4.0", "Apache-2.0", "MIT"}
SPLITS = ("train", "validation", "test")
STATUSES = {"answer", "insufficient_evidence", "conflict"}

def lexical_forms(text: str) -> set[str]:
    """NFC/casefolded word forms, including Hindi combining vowel marks."""
    import unicodedata
    words, token = set(), []
    for ch in unicodedata.normalize("NFC", text).casefold():
        category = unicodedata.category(ch)
        if category.startswith("L") or (token and category.startswith("M")):
            token.append(ch)
        else:
            if len(token) >= 2:
                words.add("".join(token))
            token = []
    if len(token) >= 2:
        words.add("".join(token))
    return words

def convert(source: Path, output: Path, min_unique_words: int = 500_000) -> dict:
    if not source.is_file():
        raise ValueError("A real input JSONL corpus is required; no samples or nonsense words are invented.")
    if not 0 <= min_unique_words <= 10_000_000:
        raise ValueError("Invalid lexical word target")
    output.mkdir(parents=True, exist_ok=True)
    counts = dict.fromkeys(SPLITS, 0)
    writers = {s: (output / f"{s}.jsonl").open("w", encoding="utf8") for s in SPLITS}
    seen = set()
    source_splits: dict[str, str] = {}
    word_forms = set()
    license_counts: dict[str, int] = {}
    input_hash = hashlib.sha256()
    try:
        with source.open("rb") as stream:
            for n, raw in enumerate(stream, 1):
                input_hash.update(raw)
                if not raw.strip():
                    continue
                try:
                    item = json.loads(raw)
                    if not isinstance(item, dict):
                        raise ValueError("not an object")
                    if set(item) != {"source_id", "license", "reviewer_id", "reviewed", "split", "question", "evidence", "expected"}:
                        raise ValueError("missing or unexpected fields")
                    split = item["split"]
                    if split not in SPLITS: raise ValueError("unknown split")
                    if item["reviewed"] is not True or not isinstance(item["reviewer_id"], str) or not item["reviewer_id"].strip():
                        raise ValueError("signed human review provenance required")
                    license_id = item["license"]
                    if license_id not in ALLOWED_LICENSES:
                        raise ValueError("license missing or not on approved allowlist")
                    source_id = item["source_id"]
                    if not isinstance(source_id, str) or not source_id.strip():
                        raise ValueError("source_id required")
                    if source_id in source_splits and source_splits[source_id] != split:
                        raise ValueError("source-level data leakage between splits")
                    source_splits[source_id] = split
                    question = item["question"]
                    evidence = item["evidence"]
                    expected = item["expected"]
                    if not isinstance(question, str) or not 1 <= len(question.strip()) <= 600:
                        raise ValueError("invalid question")
                    if not isinstance(evidence, list) or not 1 <= len(evidence) <= 3 or any(not isinstance(e, str) or not e.strip() for e in evidence) or sum(map(len, evidence)) > 2100:
                        raise ValueError("evidence must be 1..3 short passages")
                    if not isinstance(expected, dict) or set(expected) != {"status", "answer", "language", "citations"}:
                        raise ValueError("invalid answer schema")
                    status, answer, lang, citations = (expected[k] for k in ("status", "answer", "language", "citations"))
                    if status not in STATUSES or lang not in ("en", "hi") or not isinstance(answer, str) or len(answer) > 3000:
                        raise ValueError("invalid expected status/language/answer")
                    if not isinstance(citations, list) or len(set(map(str, citations))) != len(citations) or any(c not in [f"E{i+1}" for i in range(len(evidence))] for c in citations):
                        raise ValueError("invalid citations")
                    if status == "answer":
                        if not answer.strip() or not citations:
                            raise ValueError("answer requires factual content and source citations")
                        if lang == "hi" and not re.search(r"[\u0900-\u097F]", answer):
                            raise ValueError("Hindi answer is not Devanagari")
                    elif answer or citations:
                        raise ValueError("abstention/conflict must have empty answer and citations")
                    # Exact content duplicates across *all* splits are forbidden.
                    key = hashlib.sha256(json.dumps([question, evidence], sort_keys=True, ensure_ascii=False).encode()).digest()
                    if key in seen: raise ValueError("duplicate question/evidence example")
                    seen.add(key)
                    payload = {"question": question, "evidence": [
                        {"id": f"E{i+1}", "text": text} for i, text in enumerate(evidence)
                    ]}
                    row = {"prompt": [
                        {"role":"system","content": SYSTEM},
                        {"role":"user","content": json.dumps(payload, ensure_ascii=False)}
                    ], "completion": [{"role":"assistant","content": json.dumps(expected, ensure_ascii=False)}]}
                    writers[split].write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")
                    counts[split] += 1
                    license_counts[license_id] = license_counts.get(license_id, 0) + 1
                    if split == "train":
                        word_forms.update(lexical_forms(question))
                        for passage in evidence: word_forms.update(lexical_forms(passage))
                except (KeyError, TypeError, ValueError) as e:
                    raise ValueError(f"Invalid reviewed corpus record {n}: {e}") from e
    finally:
        for file in writers.values(): file.close()
    if any(not counts[s] for s in SPLITS):
        raise ValueError("all train/validation/test splits must be non-empty")
    if len(word_forms) < min_unique_words:
        raise ValueError(
            f"Only {len(word_forms):,} distinct train-source word forms, below requested "
            f"{min_unique_words:,}; no fabricated vocabulary or training run."
        )
    manifest = {
        "base_model": MODEL, "synthetic": False, "reviewed_by_human": True,
        "purpose": "licensed, independently human-reviewed RAG SFT corpus",
        "split_method": "reviewer assigned; source_id disjoint across splits",
        "examples_per_split": counts, "cases_total": sum(counts.values()),
        "source": "local licensed reviewed corpus; not included in GitHub or Pages",
        "input_sha256": input_hash.hexdigest(),
        "licenses": license_counts,
        "unique_training_word_forms": len(word_forms),
        "unique_word_target": min_unique_words,
        "model_weights_trained": False,
        "previous_stress_test_data_used": False,
        "previous_real_model_benchmark_data_used": False,
        "human_review_attestation": "input row reviewer_id and reviewed=true; review authenticity requires external audit",
    }
    (output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    return manifest

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True, help="Local licensed human-reviewed JSONL QA corpus")
    parser.add_argument("--output", type=Path, default=Path("training/data-reviewed"))
    parser.add_argument("--min-unique-words", type=int, default=500_000)
    args = parser.parse_args()
    print(json.dumps(convert(args.input, args.output, args.min_unique_words), ensure_ascii=False, indent=2))
