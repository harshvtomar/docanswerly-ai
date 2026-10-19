/**
 * Deterministic 12,000-case bilingual answer-boundary stress evaluation.
 *
 * NOT Qwen model training, NOT 12,000 LLM inferences, NOT an accuracy benchmark.
 * Exercises actual application validation on independent fixture variations.
 * Each case has a known expected accept/reject outcome; failures block CI.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { validateAnswer, type AnswerRequest } from "../src/lib/answers";
import type { Chunk } from "../src/lib/types";

type Expectation = "accept" | "reject";
type Case = {
  name: string;
  group: string;
  expectation: Expectation;
  request: AnswerRequest;
  raw: string;
  expectedStatus?: string;
};
const weekdays = [
  ["Monday", "सोमवार"], ["Tuesday", "मंगलवार"], ["Wednesday", "बुधवार"],
  ["Thursday", "गुरुवार"], ["Friday", "शुक्रवार"], ["Saturday", "शनिवार"],
  ["Sunday", "रविवार"],
] as const;
const crops = [
  ["potatoes", "आलू"], ["wheat", "गेहूँ"], ["rice", "धान"],
  ["corn", "मक्का"], ["soybeans", "सोयाबीन"], ["barley", "जौ"],
  ["cotton", "कपास"], ["sugarcane", "गन्ना"], ["bananas", "केले"],
  ["tomatoes", "टमाटर"], ["onions", "प्याज"], ["carrots", "गाजर"],
  ["apples", "सेब"], ["mangoes", "आम"],
] as const;

function makeEvidence(id: number, sourceText: string): Chunk {
  return {
    id: "stress:" + id + ":0",
    documentId: "synthetic-" + id,
    documentName: "synthetic-" + id + ".pdf",
    page: 1 + id % 7,
    text: sourceText,
    start: 0,
    end: sourceText.length,
  };
}
function answer(status: string, text: string, language: string, citationIDs: string[]) {
  return JSON.stringify({ status, answer: text, language, citations: citationIDs });
}
function fixture(group: string, i: number): Case {
  const year = 2000 + i % 25;
  const x = "Batch " + (10000 + i);
  const wk = weekdays[i % weekdays.length];
  const wrongDay = weekdays[(i + 1) % weekdays.length][1];
  const crop = crops[i % crops.length];
  const wrongCrop = crops[(i + 1) % crops.length][1];
  const name = group + "-" + i;
  const accept = (q: string, evidence: string, a: string, lang: "en" | "hi",
                  status="answer"): Case => ({
    name, group, expectation: "accept",
    request: {question:q,language:lang,evidence:[makeEvidence(i, evidence)]},
    raw: answer(status, a, lang, status === "answer" ? ["E1"] : []),
    expectedStatus:status,
  });
  const reject = (q: string, evidence: string, a: string, lang: "en" | "hi",
                  status="answer", ids=["E1"]): Case => ({
    name, group, expectation:"reject",
    request:{question:q,language:lang,evidence:[makeEvidence(i,evidence)]},
    raw:answer(status,a,lang,ids),
  });
  switch (group) {
    case "valid-en-number":
      return accept("When did " + x + " begin?",
        x + " began in " + year + ".", "It began in " + year + ".", "en");
    case "valid-hi-number":
      return accept("कार्यक्रम " + i + " किस वर्ष शुरू हुआ?",
        "कार्यक्रम " + i + " वर्ष " + year + " में शुरू हुआ था।",
        "कार्यक्रम वर्ष " + year + " में शुरू हुआ था।", "hi");
    case "valid-en-source-hi-crop":
      return accept("क्षेत्र " + i + " में कौन सी फसल उगाई जाती है?",
        "Farm region " + i + " grows " + crop[0] + ".",
        "क्षेत्र " + i + " में " + crop[1] + " उगाई जाती है।", "hi");
    case "valid-en-source-hi-day":
      return accept("वार्ड " + i + " का केंद्र किस दिन बंद है?",
        "Ward " + i + " center is closed every " + wk[0] + ".",
        "केंद्र " + wk[1] + " को बंद रहता है।", "hi");
    case "valid-schema-abstention":
      return accept("What is the unpublished salary for " + x + "?",
        x + " was founded in " + year + ".", "", "en",
        "insufficient_evidence");
    case "invalid-unknown-citation":
      return reject("When did " + x + " begin?",
        x + " began in " + year + ".", "It began in " + year + ".", "en",
        "answer", ["E3"]);
    case "invalid-invented-numeral":
      return reject("When did " + x + " begin?",
        x + " began in " + year + ".", "It began in " + (year + 40) + ".", "en");
    case "invalid-english-in-hindi":
      return reject("यह केंद्र कब खुलता है?", "This center is open every " + wk[0] + ".",
        "The center opens every " + wk[0] + ".", "hi");
    case "invalid-crop-translation":
      return reject("क्षेत्र " + i + " में कौन सी फसल उगाई जाती है?",
        "Farm region " + i + " grows " + crop[0] + ".",
        "क्षेत्र में " + wrongCrop + " उगाई जाती है।", "hi");
    case "invalid-weekday-translation":
      return reject("वार्ड " + i + " का केंद्र किस दिन बंद है?",
        "Ward " + i + " center is closed every " + wk[0] + ".",
        "केंद्र " + wrongDay + " को बंद रहता है।", "hi");
    case "invalid-nonempty-abstention":
      return reject("What is the unpublished salary for " + x + "?",
        x + " was founded in " + year + ".",
        "The company was founded in " + year + ".", "en",
        "insufficient_evidence", []);
    case "invalid-question-echo":
      return reject("भारत में किसका उपयोग बढ़ रहा है?",
        "भारत में Robotics का उपयोग तेजी से बढ़ रहा है।",
        "भारत में किसका उपयोग बढ़ रहा है?", "hi");
    default:
      throw Error("Unrecognized group " + group);
  }
}
const groups = [
  "valid-en-number", "valid-hi-number", "valid-en-source-hi-crop",
  "valid-en-source-hi-day", "valid-schema-abstention",
  "invalid-unknown-citation", "invalid-invented-numeral",
  "invalid-english-in-hindi", "invalid-crop-translation",
  "invalid-weekday-translation", "invalid-nonempty-abstention",
  "invalid-question-echo",
] as const;
const eachGroup = 1000;
const summary: Record<string, {cases:number;passed:number;failed:number}> = {};
const failures: {caseId:string;reason:string}[] = [];
let total=0,passed=0,heldout=0,heldoutPassed=0;
for (const group of groups) {
  const metric={cases:0,passed:0,failed:0};
  summary[group]=metric;
  for(let i=0;i<eachGroup;i++){
    const test=fixture(group,i);
    let accepted=false;
    let actualStatus:string|undefined;
    let error="";
    try {
      const response=validateAnswer(test.raw,test.request);
      accepted=true;
      actualStatus=response.status;
    } catch (e) {
      error=e instanceof Error ? e.message : String(e);
    }
    const correct=(test.expectation==="accept")
      ? accepted && actualStatus===test.expectedStatus
      : !accepted;
    metric.cases++;
    total++;
    const isHeldout = i % 5 === 0;
    if(isHeldout)heldout++;
    if(correct){
      metric.passed++;
      passed++;
      if(isHeldout)heldoutPassed++;
    }else{
      metric.failed++;
      failures.push({caseId:test.name,reason:error||("Incorrectly accepted: "+actualStatus)});
    }
  }
}
const report = {
  title:"DocAnswerly AI deterministic bilingual validation stress evaluation",
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  kind:"automated-synthetic-boundary-tests",
  result:passed===total?"pass":"fail",
  caseCount:total,
  passed,failed:total-passed,
  heldoutCaseCount:heldout,
  heldoutPassed,
  heldoutFailed:heldout-heldoutPassed,
  distinctCategoryCount:groups.length,
  categoryMetrics:summary,
  failureExamples:failures.slice(0,50),
  modelInferenceRuns:0,
  modelTrainingSteps:0,
  modelFineTuned:false,
  modelAccuracyClaim:null,
  interpretation:"Template-varied deterministic validation tests; neither genuine model inference nor real-world answer-quality or Hindi fluency measurement. No Qwen weights changed.",
};
mkdirSync("docs",{recursive:true});
writeFileSync("docs/stress-evaluation.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({
  result:report.result,cases:total,passed,failed:report.failed,
  heldout,heldoutPassed,
  categories:groups.length,
  actualQwenInferences:0,trainingSteps:0,
},null,2));
if (total < 10000 || failures.length) {
  console.error("Sample failures:",JSON.stringify(failures.slice(0,15),null,2));
  process.exitCode=1;
}
