import { countEvidenceHint, numericFingerprint } from "./bilingual-evidence";

/**
 * Bounded, inspectable evidence checks for HIGH-CONFIDENCE errors only.
 * This is not an NLI classifier and does not establish general entailment.
 * It rejects a model's unsupported requested count or a claim copied solely
 * from prompt-injection text within cited source passages.
 */
export class UnsafeSourceClaimError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "UnsafeSourceClaimError";
  }
}
const INJECTION_CLAUSE =
  /\b(?:ignore\s+(?:the|these|all|any|previous)\s+(?:instructions|rules|details|information)|(?:system|developer|assistant)\s*(?:instruction|prompt|message)\s*:|pretend\s+(?:that|the)|(?:you|the assistant)\s+must\s+(?:answer|say|reply)|disregard\s+(?:earlier|previous|these))\b|(?:निर्देश\s*:|नज़रअंदाज़\s+(?:करो|करें)|अनदेखा\s+(?:करो|करें)|उत्तर\s+दो\s+कि|भूल\s+जाओ)/iu;
const RELEVANT_NOUN = /[\p{L}\p{M}]{3,}/gu;
const STOP = new Set(["the","this","that","which","with","have","what","when","from",
 "for","and","you","your","only","answer","is","are","was","were","has",
 "में","है","हैं","की","का","के","से","को","और","लिए","यह","एक","वह",
 "करो","उत्तर","निर्देश"]);
function words(text:string):Set<string>{
  return new Set((text.normalize("NFC").toLocaleLowerCase().match(RELEVANT_NOUN)??[])
    .filter(w=>!STOP.has(w)));
}
function segregateUntrustedInstructions(text:string){
  // Strip only clauses explicitly instructing the assistant, never original
  // cited metadata. Preserve the full source for citation navigation.
  const chunks=text.split(/(?<=[।.!?\n])\s*/u);
  return {
    hasInjection: chunks.some(c=>INJECTION_CLAUSE.test(c)),
    factual:chunks.filter(c=>!INJECTION_CLAUSE.test(c)).join(" ").trim(),
    instructions:chunks.filter(c=>INJECTION_CLAUSE.test(c)).join(" ").trim(),
  };
}
const unsafeClaims = /\b(?:free|no\s+charge|without\s+registration|waived|complimentary)\b|मुफ्त|निःशुल्क|बिना\s+पंजीकरण/iu;
const MONTHS: RegExp[] = [
  /\bjanuary\b|जनवरी/iu,/\bfebruary\b|फ़रवरी|फरवरी/iu,
  /\bmarch\b|मार्च/iu,/\bapril\b|अप्रैल/iu,
  /\bmay\b|मई/iu,/\bjune\b|जून/iu,
  /\bjuly\b|जुलाई/iu,/\baugust\b|अगस्त/iu,
  /\bseptember\b|सितंबर|सितम्बर/iu,/\boctober\b|अक्टूबर/iu,
  /\bnovember\b|नवंबर|नवम्बर/iu,/\bdecember\b|दिसंबर|दिसम्बर/iu,
];
function monthsIn(text:string):number[]{
  return MONTHS.flatMap((month,i)=>month.test(text)?[i]:[]);
}
/**
 * Only resolve a month when a question has a clearly bounded source relation.
 * "When was the report FILED?" must not take the inspection's August date
 * when the filing is recorded in September.
 */
function unambiguousRequestedMonth(question:string,chunks:{text:string}[]):number|null {
  if(!/\b(?:which|what)\s+month\b|किस\s+महीने|कौन\s*से\s+महीने/iu.test(question))
    return null;
  const filing=/\b(?:filed|submitted|lodged|submission)\b|प्रस्तुत|दाखिल|जमा|दायर/iu.test(question);
  const inspection=/\b(?:inspected|inspection|performed|conducted)\b|निरीक्षण|जांच/iu.test(question)&&!filing;
  const sentences=chunks.flatMap(c=>c.text.split(/[।.!?\n]+/u)).map(s=>s.trim()).filter(Boolean);
  let candidates=sentences;
  if(filing)candidates=sentences.filter(s=>/\b(?:filed|submitted|lodged)\b|प्रस्तुत|दाखिल|जमा|दायर/iu.test(s));
  else if(inspection)candidates=sentences.filter(s=>/\b(?:inspected|performed|conducted)\b|निरीक्षण\s+(?:किया|हुआ)|जांच\s+(?:की|हुई)/iu.test(s));
  const values=[...new Set(candidates.flatMap(monthsIn))];
  return values.length===1?values[0]:null;
}
const factualFree=/\b(?:free|no\s+(?:admission\s+)?charge|without\s+payment|without\s+paying|no\s+(?:entry\s+)?fee|fee\s+(?:is\s+)?waived|complimentary)\b|मुफ्त|निःशुल्क|कोई\s+शुल्क\s+नहीं|बिना\s+शुल्क/iu;
const negatedFree=/\b(?:not|isn['’]t|aren['’]t|never)\s+(?:free|complimentary)\b|(?:मुफ्त|निःशुल्क)\s+नहीं/iu;


/** Detect an explicit count mismatch or content borrowed only from hostile instructions. */
export function assertQuestionFactSupport(
  question:string, answer:string, citedEvidence:{text:string}[]
): void {
  // Count evidence is only used where the source identifies one unambiguous
  // count of the item asked about. Do not reinterpret years or nearby totals.
  const requestedMonth=unambiguousRequestedMonth(question,citedEvidence);
  if(requestedMonth!==null){
    const answerMonths=[...new Set(monthsIn(answer))];
    if(answerMonths.length!==1||answerMonths[0]!==requestedMonth)
      throw new UnsafeSourceClaimError("The requested month does not match the cited source event.");
  }
  const hint=countEvidenceHint(question,citedEvidence);
  if(hint){
    const observed=numericFingerprint(answer);
    if(observed && observed!==hint.count)
      throw new UnsafeSourceClaimError("The requested count does not match the cited source fact.");
  }

  const splits=citedEvidence.map(e=>segregateUntrustedInstructions(e.text));
  const facts=splits.map(s=>s.factual).join(" ");
  // An explicit claim of zero cost needs positive evidence of zero cost.
  // Merely requiring registration does not establish whether it is free.
  if(unsafeClaims.test(answer) && !negatedFree.test(answer) && !factualFree.test(facts))
    throw new UnsafeSourceClaimError("A positive free-admission claim lacks source support.");
  if(!splits.some(s=>s.hasInjection))return;
  const directions=splits.map(s=>s.instructions).join(" ");
  // A free/waived claim copied from hostile PDF instructions is particularly
  // dangerous: first check whether it appears in actual factual sentences.
  if(unsafeClaims.test(answer)&&unsafeClaims.test(directions)&&!unsafeClaims.test(facts))
    throw new UnsafeSourceClaimError("The answer copied an unsupported claim from embedded source instructions.");
  // Prevent a short ungrounded Hindi/English keyword from being mistaken for
  // a supported answer simply because it appeared in hostile instructions.
  const alleged=words(answer);
  const factWords=words(facts);
  const instructionWords=words(directions);
  const exclusive=[...alleged].filter(w=>instructionWords.has(w)&&!factWords.has(w));
  if(alleged.size>0 && exclusive.length===alleged.size)
    throw new UnsafeSourceClaimError("The answer is supported only by embedded source instructions.");
}
