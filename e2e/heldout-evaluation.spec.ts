import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import suite from "../evaluation/heldout-cases.json";

type Gold = (typeof suite.cases)[number];
type Row = {
  id: string; raw: string; rawStages?: string[];
  answer?: {
    status: string; answer: string; language: string; validation: string;
    citations: { documentId: string }[];
  };
  error?: string; latencyMs: number;
};
function sourceIndexes(answer: Row["answer"]): number[] {
  return (answer?.citations ?? []).map(c => {
    const index = Number(c.documentId.split(":").at(-1));
    return index;
  }).sort((a,b) => a-b);
}
function expressionMatches(expression: string,text: string): boolean {
  return new RegExp(expression,"iu").test(text);
}
function judge(c: Gold, row: Row) {
  const a = row.answer;
  const directModel = a?.validation === "source-identities-checked";
  const statusCorrect = a?.status === c.expectedStatus;
  const requiredFacts = c.requiredTerms.every(re => expressionMatches(re,a?.answer ?? ""));
  const forbiddenFactsAbsent = c.forbiddenTerms.every(re => !expressionMatches(re,a?.answer ?? ""));
  const citationsCorrect = c.expectedStatus === "answer"
    ? JSON.stringify(sourceIndexes(a)) ===
        JSON.stringify([...c.supportingEvidence].sort((x,y)=>x-y))
    : (a?.citations.length ?? 0) === 0;
  const exactProxyPass = Boolean(statusCorrect && directModel && requiredFacts &&
    forbiddenFactsAbsent && citationsCorrect && !row.error);
  return {
    id:c.id, category:c.category, question:c.question, evidence:c.evidence,
    factualGold:c.factCheck, expectedStatus:c.expectedStatus,
    actualStatus:a?.status ?? "error", answer:a?.answer ?? "",
    validation:a?.validation ?? "error",
    citations:sourceIndexes(a),
    statusCorrect, directModel, requiredFacts, forbiddenFactsAbsent,
    citationsCorrect, exactProxyPass,
    modelCalled:(row.rawStages?.length ?? 0)>0,
    modelCallCount:row.rawStages?.length ?? 0,
    rawModelStages:row.rawStages ?? [],
    raw:row.raw, error:row.error ?? null, latencyMs:row.latencyMs,
    externalHumanReview:"pending",
  };
}
function csvValue(s:string) {return '"'+s.replace(/"/g,'""').replace(/\r?\n/g," ")+'"';}

test("run genuine Qwen3 and save blinded-review-ready answers to 28 held-out cases",async({page})=>{
  test.setTimeout(1750000);
  await mkdir("docs",{recursive:true});
  await page.goto("./evaluation.html?suite=heldout");
  await expect(page.locator("#status")).toHaveText("Ready",{timeout:15000});
  await page.locator("#run").click();
  await expect(page.locator("#status")).toHaveText(/^(Complete|Failed:)/,{timeout:1660000});
  const payload = JSON.parse(await page.locator("#result").innerText()) as {
    model?: string; initializationMs?: number; error?: string; rows?: Row[];
  };
  const rows = payload.rows ?? [];
  const observations = suite.cases.map(c => {
    const row=rows.find(r=>r.id===c.id) ?? {
      id:c.id,raw:"",rawStages:[],latencyMs:0,error:"Missing case row"
    };
    return judge(c,row);
  });
  const supported=observations.filter(o=>o.expectedStatus==="answer");
  const unsupported=observations.filter(o=>o.expectedStatus!=="answer");
  const report={
    suite:suite.suite, model:payload.model ?? "unknown",
    commit:process.env.GITHUB_SHA ?? "local",
    timestamp:new Date().toISOString(),
    modelInitialized:(payload.initializationMs ?? 0)>0,
    cases:observations.length, observedRows:rows.length,
    rawModelCaseCount:observations.filter(o=>o.modelCalled).length,
    validDirectModelResponses:observations.filter(o=>o.directModel).length,
    exactFactTermProxy:observations.filter(o=>o.exactProxyPass).length,
    supportedExactProxyPass:supported.filter(o=>o.exactProxyPass).length,
    supportedTotal:supported.length,
    unsupportedValidModelAbstentions:unsupported.filter(o=>o.exactProxyPass).length,
    unsupportedTotal:unsupported.length,
    unsupportedIncorrectAnswers:unsupported.filter(o=>o.actualStatus==="answer").length,
    unsupportedCanonicalized:unsupported.filter(o=>o.validation==="refusal-content-discarded").length,
    unsupportedHeuristic:unsupported.filter(o=>o.validation.startsWith("heuristic-")).length,
    errors:observations.filter(o=>o.actualStatus==="error").length,
    independentlyHumanReviewed:false,
    humanReviewedAccuracy:null,
    datasetOrigin:"28 previously unseen, fictional, manually specified question/evidence gold labels",
    limitations:[
      "This suite uses given oracle passages and isolates generation, not real-PDF retrieval or OCR.",
      "Automated regex/expected-status/source-set checks do not prove semantic factual correctness.",
      "An externally independent human reviewer has not signed off the outputs.",
      "App-generated refusals and heuristic checks are excluded from true model abstention credit.",
      "No training or model weight updates are performed by this evaluation."
    ],
    evaluations:observations,
    infrastructureError:payload.error ?? null,
  };
  await writeFile("docs/heldout-qwen3-evaluation.json",JSON.stringify(report,null,2)+"\n");
  const columns=["id","category","question","evidence","factualGold","expectedStatus",
    "actualStatus","answer","validation","citations","exactProxyPass","error","externalHumanReview"];
  const rowStrings=observations.map(o=>columns.map(k=>csvValue(
    k==="evidence"||k==="citations"?JSON.stringify(o[k]):
      String((o as unknown as Record<string,unknown>)[k] ?? "")
  )).join(","));
  await writeFile("docs/heldout-qwen3-review.csv",[columns.join(","),...rowStrings].join("\n")+"\n");
  console.log("HELDOUT_SUMMARY "+JSON.stringify({
    cases:report.cases,observed:report.observedRows,modelInvoked:report.rawModelCaseCount,
    strictProxy:report.exactFactTermProxy,
    supportedStrict:report.supportedExactProxyPass+"/"+report.supportedTotal,
    strictAbstentions:report.unsupportedValidModelAbstentions+"/"+report.unsupportedTotal,
    canonicalized:report.unsupportedCanonicalized,
    heuristic:report.unsupportedHeuristic,errors:report.errors,
    humanReviewed:false,
  }));
  // Include source/case raw output in PRIVATE CI log so reviewers can inspect
  // actual model failures even if artifact downloads are unavailable.
  for(const o of observations)console.log("HELDOUT_REVIEW_ROW "+JSON.stringify({
    id:o.id,expected:o.expectedStatus,observed:o.actualStatus,
    validation:o.validation,answer:o.answer,rawStages:o.rawModelStages,
    evidence:o.evidence,gold:o.factualGold,proxy:o.exactProxyPass,error:o.error,
  }));
  expect(suite.cases).toHaveLength(28);
  expect(rows).toHaveLength(28);
  expect(report.modelInitialized).toBe(true);
  expect(report.rawModelCaseCount).toBeGreaterThan(0);
  await expect(page.locator("#status")).toHaveText("Complete");
});
