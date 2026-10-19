"""Stdlib-only corpus integrity tests: no training, GPU, or fake words."""
import json
import tempfile
import unittest
from pathlib import Path
from prepare_reviewed_corpus import convert, lexical_forms
from validate_data import validate

def row(split, source_id, question, evidence, status="answer", language="en"):
    expected = {"status": status,
                "answer": ("लंबाई 9 मीटर है।" if language == "hi" else "Measured 9 meters.") if status == "answer" else "",
                "language": language,
                "citations": ["E1"] if status == "answer" else []}
    return {"source_id": source_id, "license": "CC-BY-4.0",
            "reviewer_id": "external-reviewer-with-consent", "reviewed": True,
            "split": split, "question": question, "evidence": [evidence],
            "expected": expected}

class ReviewedCorpusTests(unittest.TestCase):
    def test_word_counter_preserves_devanagari_vowel_marks(self):
        words = lexical_forms("किताबें किताबें, विज्ञान Science SCIENCE.")
        self.assertIn("किताबें", words)
        self.assertIn("विज्ञान", words)
        self.assertIn("science", words)
        self.assertEqual(len(words), 3)

    def sample(self, directory):
        records = [
            row("train", "source-A", "मॉडल की लंबाई क्या है?", "The measured length is 9 meters.", language="hi"),
            row("validation", "source-B", "What is the invoice code?", "The invoice code has not been published.", status="insufficient_evidence"),
            row("test", "source-C", "What is the gate number?", "Gate number 3 conflicts with gate number 7.", status="conflict")
        ]
        source = directory / "reviewed.jsonl"
        source.write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in records) + "\n", encoding="utf8")
        return source

    def test_conversion_and_trainer_validation_without_training(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            result = convert(self.sample(root), root / "output", min_unique_words=0)
            self.assertEqual(result["cases_total"], 3)
            self.assertFalse(result["synthetic"])
            self.assertTrue(result["reviewed_by_human"])
            self.assertTrue(result["unique_training_word_forms"] >= 3)
            audit = validate(root / "output")
            self.assertEqual(audit["total"], 3)
            self.assertTrue(audit["human_reviewed"])
            self.assertEqual(audit["weight_updates"], 0)

    def test_target_does_not_claim_fabricated_half_million(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            with self.assertRaisesRegex(ValueError, "500,000"):
                convert(self.sample(root), root / "output")

    def test_rejects_unreviewed_rows(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = self.sample(root)
            items = [json.loads(line) for line in source.read_text(encoding="utf8").splitlines()]
            items[0]["reviewed"] = False
            source.write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in items),encoding="utf8")
            with self.assertRaisesRegex(ValueError, "signed human review provenance"):
                convert(source, root / "output", min_unique_words=0)

    def test_rejects_source_leakage(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = self.sample(root)
            items = [json.loads(line) for line in source.read_text(encoding="utf8").splitlines()]
            items[1]["source_id"] = items[0]["source_id"]
            source.write_text("\n".join(json.dumps(x, ensure_ascii=False) for x in items),encoding="utf8")
            with self.assertRaisesRegex(ValueError, "source-level data leakage"):
                convert(source, root / "output", min_unique_words=0)

if __name__ == "__main__":
    unittest.main()
