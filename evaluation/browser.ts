import cases from "./rag-cases.json";
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
    const provider = new GroundedAnswerProvider({
      generate: async (...args) => {
        raw = await runtime.generate(...args);
        return raw;
      },
    });
    for (const c of cases.cases) {
      status.textContent = `Evaluating ${c.id}`;
      const start = performance.now();
      raw = "";
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
        const referenceMatch =
          answer.status === c.expectedStatus &&
          c.requiredTerms.every((term) =>
            new RegExp(term, "iu").test(answer.answer),
          );
        const sourceSetMatches =
          answer.status === "answer"
            ? c.supportingEvidence.every((i) =>
                answer.citations.some((s) => s.documentId === `${c.id}:${i}`),
              ) &&
              answer.citations.every((s) =>
                c.supportingEvidence.some(
                  (i) => s.documentId === `${c.id}:${i}`,
                ),
              )
            : answer.citations.length === 0;
        rows.push({
          id: c.id,
          expectedStatus: c.expectedStatus,
          answer,
          raw,
          referenceMatch,
          sourceSetMatches,
          latencyMs: performance.now() - start,
        });
      } catch (error) {
        rows.push({
          id: c.id,
          expectedStatus: c.expectedStatus,
          raw,
          error: error instanceof Error ? error.message : String(error),
          referenceMatch: false,
          sourceSetMatches: false,
          latencyMs: performance.now() - start,
        });
      }
      result.textContent = JSON.stringify({
        partial: true,
        initializationMs,
        model: GENERATION_MODEL,
        rows,
      });
    }
    const supported = rows.filter((r) => r.expectedStatus === "answer"),
      unsupported = rows.filter((r) => r.expectedStatus !== "answer");
    result.textContent = JSON.stringify({
      initializationMs,
      model: GENERATION_MODEL,
      note: cases.note,
      generatedAt: new Date().toISOString(),
      metrics: {
        cases: rows.length,
        referenceMatch:
          rows.filter((r) => r.referenceMatch).length / rows.length,
        sourceSetMatches:
          rows.filter((r) => r.sourceSetMatches).length / rows.length,
        supportedAnswerRate:
          supported.filter(
            (r) => "answer" in r && r.answer?.status === "answer",
          ).length / supported.length,
        falseRefusalRate:
          supported.filter(
            (r) => "answer" in r && r.answer?.status !== "answer",
          ).length / supported.length,
        unsupportedAbstentionRate:
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
      model: GENERATION_MODEL,
      elapsedMs: performance.now() - initStart,
      error: String(error),
      rows,
    });
    status.textContent = "Failed: " + String(error);
  } finally {
    await runtime.dispose();
  }
};
