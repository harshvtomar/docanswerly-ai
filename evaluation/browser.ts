import cases from "./rag-cases.json";
import heldoutCases from "./heldout-cases.json";
import postfixCases from "./heldout-v2-cases.json";
import novelCases from "./novel-word-heldout.json";
const suiteParam = new URLSearchParams(location.search).get("suite");
const selectedSuite = suiteParam === "heldout" ? heldoutCases
  : suiteParam === "postfix" ? postfixCases
  : suiteParam === "novel" ? novelCases : cases;
import { LocalGeneration, GENERATION_MODEL } from "../src/lib/local-generation";
import {
  GroundedAnswerProvider,
  type AnswerLanguage,
} from "../src/lib/answers";
const status = document.querySelector("#status")!,
  result = document.querySelector("#result")!;
status.textContent = "Ready";
document.querySelector<HTMLButtonElement>("#run")!.disabled = false;
document.querySelector<HTMLButtonElement>("#run")!.onclick = async () => {
  status.textContent = "Loading model";
  document.querySelector<HTMLButtonElement>("#run")!.disabled = true;
  const runtime = new LocalGeneration(
    new URL(import.meta.env.BASE_URL, location.origin).href,
  );
  const rows = [];
  const initStart = performance.now();
  try {
    await runtime.load(
      new URL(import.meta.env.BASE_URL, location.origin).href,
      (s) => (status.textContent = `Loading model: ${s}`),
      AbortSignal.timeout(240000),
    );
    const initializationMs = performance.now() - initStart;
    let raw = "";
    const rawStages: string[] = [];
    const provider = new GroundedAnswerProvider({
      generate: async (...args) => {
        raw = await runtime.generate(...args);
        rawStages.push(raw);
        return raw;
      },
    });
    for (const c of selectedSuite.cases) {
      status.textContent = `Evaluating ${c.id}`;
      const start = performance.now();
      raw = "";
      rawStages.length = 0;
      try {
        const answer = await provider.answer(
          {
            question: c.question,
            language: c.language as AnswerLanguage,
            evidence: c.evidence.map((text, i) => ({
              id: `${c.id}:${i}:1:0`,
              documentId: `${c.id}:${i}`,
              documentName: `${c.id}-${i}.pdf`,
              page: i + 1,
              text,
              start: 0,
              end: [...text].length,
            })),
          },
          AbortSignal.timeout(180000),
        );
        // A canonicalized refusal is safe to display but NOT a valid raw-model
        // abstention. Keep it out of the reference-match quality proxy.
        const modelCompliant = answer.validation === "source-identities-checked";
        const referenceMatch =
          modelCompliant &&
          answer.status === c.expectedStatus &&
          c.requiredTerms.every((term) =>
            new RegExp(term, "iu").test(answer.answer),
          );
        const sourceSetMatches =
          modelCompliant &&
          (answer.status === "answer"
            ? c.supportingEvidence.every((i) =>
                answer.citations.some((s) => s.documentId === `${c.id}:${i}`),
              ) &&
              answer.citations.every((s) =>
                c.supportingEvidence.some(
                  (i) => s.documentId === `${c.id}:${i}`,
                ),
              )
            : answer.citations.length === 0);
        rows.push({
          id: c.id,
          expectedStatus: c.expectedStatus,
          answer,
          raw,
          rawStages: rawStages.slice(),
          referenceMatch,
          sourceSetMatches,
          latencyMs: performance.now() - start,
        });
      } catch (error) {
        rows.push({
          id: c.id,
          expectedStatus: c.expectedStatus,
          raw,
          rawStages: rawStages.slice(),
          error: error instanceof Error ? error.message : String(error),
          referenceMatch: false,
          sourceSetMatches: false,
          latencyMs: performance.now() - start,
        });
      }
      result.textContent = JSON.stringify({
        partial: true,
        initializationMs,
        model: runtime.loadedModelDescription || GENERATION_MODEL,
        rows,
      });
    }
    const supported = rows.filter((r) => r.expectedStatus === "answer"),
      unsupported = rows.filter((r) => r.expectedStatus !== "answer");
    result.textContent = JSON.stringify({
      initializationMs,
      model: runtime.loadedModelDescription || GENERATION_MODEL,
      note: selectedSuite.note,
      generatedAt: new Date().toISOString(),
      metrics: {
        cases: rows.length,
        // Genuine model rows versus deterministic evidence gate decisions.
        // Neither category is a claim of answer correctness.
        modelInvokedCases: rows.filter(
          (r) => r.raw.length > 0,
        ).length,
        precheckedCases: rows.filter(
          (r) => "answer" in r && (
            r.answer?.validation === "heuristic-evidence-gap" ||
            r.answer?.validation === "heuristic-numeric-conflict"
          ) && r.raw === "",
        ).length,
        referenceMatch:
          rows.filter((r) => r.referenceMatch).length / rows.length,
        sourceSetMatches:
          rows.filter((r) => r.sourceSetMatches).length / rows.length,
        supportedAnswerRate:
          supported.filter(
            (r) => "answer" in r && r.answer?.status === "answer" &&
              r.answer?.validation === "source-identities-checked",
          ).length / supported.length,
        displayedSupportedAnswerRate:
          supported.filter(
            (r) => "answer" in r && r.answer?.status === "answer",
          ).length / supported.length,
        falseRefusalRate:
          supported.filter(
            (r) => "answer" in r && r.answer?.status !== "answer",
          ).length / supported.length,
        // Only strictly formatted, direct model abstentions count here.
        unsupportedAbstentionRate:
          unsupported.filter(
            (r) => "answer" in r && r.answer?.status !== "answer" &&
              r.answer?.validation === "source-identities-checked",
          ).length / unsupported.length,
        // Display-safe fallback is distinct from the raw model's format quality.
        heuristicRefusals: rows.filter(
          (r) => "answer" in r && (
            r.answer?.validation === "heuristic-evidence-gap" ||
            r.answer?.validation === "heuristic-numeric-conflict"
          ),
        ).length,
        sourceExtractiveFallbacks: rows.filter(
          (r) => "answer" in r && r.answer?.validation === "source-extractive-fallback",
        ).length,
        canonicalizedRefusals: rows.filter(
          (r) => "answer" in r &&
            r.answer?.validation === "refusal-content-discarded",
        ).length,
        displayedUnsupportedRefusalRate:
          unsupported.filter(
            (r) => "answer" in r && r.answer?.status !== "answer",
          ).length / unsupported.length,
        unsupportedAnswerRate:
          unsupported.filter(
            (r) => "answer" in r && r.answer?.status === "answer",
          ).length / unsupported.length,
        errors: rows.filter((r) => "error" in r).length,
        semanticGroundedness: null,
        inferenceServiceCostUSD: 0,
      },
      rows,
    });
    status.textContent = "Complete";
  } catch (error) {
    result.textContent = JSON.stringify({
      partial: true,
      model: runtime.loadedModelDescription || GENERATION_MODEL,
      elapsedMs: performance.now() - initStart,
      error: String(error),
      rows,
    });
    status.textContent = "Failed: " + String(error);
  } finally {
    await runtime.dispose();
  }
};
