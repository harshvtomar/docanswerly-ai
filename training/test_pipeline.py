"""Fast stdlib-only checks; no model download or training."""
import json
import tempfile
import unittest
from pathlib import Path
from prepare_data import ENTITIES, KINDS, example, make
from validate_data import validate

class TrainingPipelineTests(unittest.TestCase):
    def test_disjoint_entities(self):
        sets=[set(names) for names in ENTITIES.values()]
        for i,a in enumerate(sets):
            for b in sets[i+1:]:
                self.assertFalse(a & b)
    def test_dataset_validation(self):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)
            m=make(path,variations=3)
            out=validate(path)
            self.assertEqual(m["cases_total"],len(KINDS)*3*sum(map(len,ENTITIES.values())))
            self.assertEqual(out["result"],"pass")
            self.assertFalse(m["reviewed_by_human"])
    def test_unsupported_and_conflict_answers_are_empty(self):
        for kind in ("unsupported_en","unsupported_hi","conflict_en","partial_fact_en","instruction_in_evidence"):
            x=example("विनय",5,kind)
            output=json.loads(x["completion"][0]["content"])
            self.assertEqual(output["answer"],"")
            self.assertEqual(output["citations"],[])
    def test_cross_language_generated_examples(self):
        x=example("निखिल",4,"en_to_hi_crop")
        y=json.loads(x["completion"][0]["content"])
        self.assertEqual(y["language"],"hi")
        self.assertIn("E1",y["citations"])
        self.assertTrue(any('\u0900'<=c<='\u097f' for c in y["answer"]))

if __name__=="__main__":
    unittest.main()
