// Audit *saved* genuine inference outputs; never rerun a model or alter history.
// This is structural/error triage, not a factual-correctness evaluation.
import { readFile } from "node:fs/promises";

const source = process.argv[2] ?? "docs/runs/38366200372/rag-evaluation.json";
const data = JSON.parse(await readFile(source, "utf8"));
if (!Array.isArray(data.rows)) throw Error("Expected evaluation rows.");

const rows = data.rows.map((row) => {
  let parsed = null;
  try {
    parsed = JSON.parse(row.raw);
  } catch {
    // Malformed raw output is a separate diagnostic, never a safe refusal.
  }
  return { ...row, parsed };
});
const unsupported = rows.filter((row) => row.expectedStatus !== "answer");
const IDs = (filter) => rows.filter(filter).map((row) => row.id);
const report = {
  source,
  note: "Saved-run diagnostic counts only. No new inference or semantic grading.",
  cases: rows.length,
  supportedCases: rows.length - unsupported.length,
  unsupportedCases: unsupported.length,
  validationErrors: rows.filter((row) => Boolean(row.error)).length,
  invalidRefusalCases: IDs((row) => row.error === "Invalid abstention response."),
  requestedHindiFailures: IDs(
    (row) => row.error === "The model did not produce the requested Hindi answer.",
  ),
  nonemptyDeclaredRefusals: IDs(
    (row) => row.parsed && row.parsed.status !== "answer" &&
      typeof row.parsed.answer === "string" && Boolean(row.parsed.answer.trim()),
  ),
  unsupportedWrongStatus: unsupported
    .filter((row) => row.parsed?.status === "answer")
    .map((row) => row.id),
  validUnsupportedAbstentions: unsupported.filter(
    (row) => row.answer && row.answer.status === row.expectedStatus,
  ).length,
  englishLabelWithHindiOnlyText: IDs(
    (row) => row.parsed?.status === "answer" && row.parsed.language === "en" &&
      /\p{Script=Devanagari}/u.test(row.parsed.answer ?? "") &&
      !/[A-Za-z]/.test(row.parsed.answer ?? ""),
  ),
};
console.log(JSON.stringify(report, null, 2));
