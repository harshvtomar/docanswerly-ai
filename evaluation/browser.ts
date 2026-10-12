import cases from "./rag-cases.json";
import { LocalGeneration, GENERATION_MODEL } from "../src/lib/local-generation";
import {
  GroundedAnswerProvider,
  type AnswerLanguage,
} from "../src/lib/answers";
const status = document.querySelector("#status")!,
  result = document.querySelector("#result")!;
document.querySelector<HTMLButtonElement>("#run")!.onclick = async () => {
  const runtime = new LocalGeneration(
    new URL(import.meta.env.BASE_URL, location.origin).href,
  );
  const rows = [];
  try {
    await runtime.load(
      new URL(import.meta.env.BASE_URL, location.origin).href,
      (s) => (status.textContent = s),
      AbortSignal.timeout(240000),
    );
    const provider = new GroundedAnswerProvider(runtime);
    for (const c of cases.cases) {
      status.textContent = `Evaluating ${c.id}`;
      const start = performance.now();
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
          referenceMatch,
          sourceSetMatches,
          latencyMs: performance.now() - start,
        });
      } catch (error) {
        rows.push({
          id: c.id,
          expectedStatus: c.expectedStatus,
          error: error instanceof Error ? error.message : String(error),
          referenceMatch: false,
          sourceSetMatches: false,
          latencyMs: performance.now() - start,
        });
      }
    }
    const supported = rows.filter((r) => r.expectedStatus === "answer"),
      unsupported = rows.filter((r) => r.expectedStatus !== "answer");
    result.textContent = JSON.stringify({
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
    status.textContent = "Failed: " + String(error);
  } finally {
    await runtime.dispose();
  }
};
