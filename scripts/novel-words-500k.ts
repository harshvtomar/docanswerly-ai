/**
 * 500,000 NEW unique invented word forms; actual app boundary diagnostics.
 *
 * WARNING: These are PHONOTACTICALLY FORMED FICTIONAL IDENTIFIERS, not 500k
 * independently attested English/Hindi vocabulary words. No Qwen inference
 * occurs in this test. Correct/incorrect answers are explicitly scripted
 * oracle controls, NOT sampled AI responses or model accuracy estimates.
 *
 * The paired *wrong answer* control detects an important gap: checking only
 * citation identity does not prove that a novel textual entity was supported.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { validateAnswer, type AnswerRequest } from "../src/lib/answers";
const COUNT = 500_000;
const HALF = COUNT / 2;
const enSyllables = ["ba","be","bi","bo","da","de","di","do","ga","ge","gi","go","la","le","li","lo"];
const hiSyllables = ["का","कि","कु","के","को","गा","गि","गु","गे","गो","ता","ति","तु","ते","तो","पा"];
function wordFor(index: number, language: "en" | "hi"): string {
  let n = index;
  let result = "";
  const syllables = language === "hi" ? hiSyllables : enSyllables;
  // Base 16, five digits: 1,048,576 possible word forms per language.
  for (let i=0; i<5; i++) {
    result = syllables[n % 16] + result;
    n = Math.floor(n / 16);
  }
  if (n !== 0) throw Error("Word index outside generator range");
  return language === "hi" ? "नव" + result : "novel" + result;
}
const words = new Set<string>();
const details: Record<string, {words:number;goldControlsAccepted:number;wrongControlsAccepted:number;failedGoldControls:number}> = {
  en: {words:0,goldControlsAccepted:0,wrongControlsAccepted:0,failedGoldControls:0},
  hi: {words:0,goldControlsAccepted:0,wrongControlsAccepted:0,failedGoldControls:0},
};
const failures: {index:number;language:string;error:string}[] = [];
for (let i=0; i<COUNT; i++) {
  const language = i<HALF ? "en" : "hi";
  const k = i % HALF;
  const word = wordFor(k,language);
  const wrongWord = wordFor((k + 1) % HALF,language);
  if (word===wrongWord || words.has(word)) throw Error("Nonunique novel word");
  words.add(word);
  const source = language==="en"
    ? `The listed fictional codename is ${word}. The label belongs to the sample record.`
    : `इस काल्पनिक अभिलेख का नया नाम ${word} है। अन्य नाम यहाँ नहीं दिया गया।`;
  const question = language==="en"
    ? "What fictional codename is listed in the document?"
    : "दस्तावेज़ में कौन सा काल्पनिक नया नाम दिया गया है?";
  const chunk = {
    id:"novel:"+i, documentId:"novel-source:"+i, documentName:"novel-"+i+".pdf",
    page:1, text:source, start:0, end:[...source].length,
  };
  const request: AnswerRequest={question,language,evidence:[chunk]};
  const asRaw = (w:string) => JSON.stringify({
    status:"answer",answer:language==="en" ? `The codename is ${w}.` : `नया नाम ${w} है।`,
    language,citations:["E1"]
  });
  const metric=details[language]; metric.words++;
  try {
    const correct = validateAnswer(asRaw(word),request);
    if (correct.status==="answer" && correct.citations[0].id===chunk.id)
      metric.goldControlsAccepted++;
    else metric.failedGoldControls++;
  } catch(error) {
    metric.failedGoldControls++;
    if(failures.length<20) failures.push({index:i,language,error:String(error)});
  }
  try {
    // Deliberate WRONG scripted response: same citation, wrong textual answer.
    // If structurally accepted, it is NOT semantic factual support.
    const bad = validateAnswer(asRaw(wrongWord),request);
    if (bad.status==="answer") metric.wrongControlsAccepted++;
  } catch { /* true negative from validator */ }
}
const p = details.en, q=details.hi;
const goldAccepted=p.goldControlsAccepted+q.goldControlsAccepted;
const wrongAccepted=p.wrongControlsAccepted+q.wrongControlsAccepted;
const report = {
  suite:"docanswerly-500k-new-nonce-word-boundary-v1",
  generatedAt:new Date().toISOString(),
  kind:"controlled-application-validator-diagnostic",
  inputOrigin:"algorithmically generated novel fictional identifiers in Latin and Hindi script; no external lexicon, no human QA labels",
  wordsAttempted:COUNT,
  uniqueWordForms:words.size,
  englishForms:p.words,hindiForms:q.words,
  groundTruth:"scripted identity-copy oracle, not a model prediction",
  positiveControlsAccepted:goldAccepted,
  positiveControlsRejected:COUNT-goldAccepted,
  deliberateWrongTextControlsAccepted:wrongAccepted,
  deliberateWrongTextControlsRejected:COUNT-wrongAccepted,
  schemaAcceptanceRateOnKnownCorrect:goldAccepted/COUNT,
  semanticFalseAcceptanceRateOnKnownWrong:wrongAccepted/COUNT,
  validatorProvesSemantics:false,
  actualQwenInferenceCases:0,
  actualQwenAccuracy:null,
  wordKnowledgeAccuracy:null,
  modelTrainingSteps:0,
  novelWordsInQwenTokenizerVerified:false,
  notes:[
    "500,000 algorithmically novel words are NOT 500,000 natural-language words.",
    "The application validator is exercised with controlled correct and incorrect outputs.",
    "Citation and numeric validation alone cannot establish exact entity grounding.",
    "A separate real Qwen3 benchmark is required to estimate any model output accuracy."
  ],
  details,failures,
  completed: words.size===COUNT && goldAccepted===COUNT,
};
mkdirSync("docs",{recursive:true});
writeFileSync("docs/novel-words-500k-validator.json",JSON.stringify(report,null,2)+"\n");
console.log("NEW_WORDS_500K_REPORT "+JSON.stringify({
  count:report.wordsAttempted,unique:report.uniqueWordForms,
  correctControlsAccepted:goldAccepted,wrongControlsAccepted:wrongAccepted,
  realQwenInferences:0,realQwenAccuracy:null,completed:report.completed
}));
if (!report.completed) process.exitCode=1;
