import type { Chunk } from "./types";
import { explicitlyMissingRequestedFact } from "./evidence-availability";

/** Limited high-precision checks, NOT general semantic entailment. */
export type EvidenceSafetyResult = {
  status: "insufficient_evidence" | "conflict";
  validation: "heuristic-evidence-gap" | "heuristic-numeric-conflict";
};
const hindiNumbers: Record<string, string> = {
  "एक":"1","दो":"2","तीन":"3","चार":"4","पाँच":"5","पांच":"5",
  "छह":"6","सात":"7","आठ":"8","नौ":"9","दस":"10",
  "ग्यारह":"11","बारह":"12",
};
const englishNumbers: Record<string, string> = {
  one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",
  seven:"7",eight:"8",nine:"9",ten:"10",eleven:"11",twelve:"12",
};
function pieces(text: string): string[] {
  return text.normalize("NFC").toLowerCase()
    .replace(/[०-९]/gu, c => String(c.charCodeAt(0) - 0x966))
    .match(/[\p{L}\p{M}]+|\d+(?:[.,]\d+)*/gu) ?? [];
}
function canonicalNumber(word: string): string {
  return hindiNumbers[word] ?? englishNumbers[word] ?? (/^\d/u.test(word) ? word : "");
}
function numericValues(text: string): string[] {
  return pieces(text).map(canonicalNumber).filter(Boolean);
}
function signature(text: string): string {
  return pieces(text).map(word => canonicalNumber(word) ? "#" : word).join(" ");
}
const stopwords = new Set([
  "the","what","which","where","when","how","does","with","this","that",
  "and","was","were","are","for","current","कितने","किस","कौन",
  "क्या","अभी","है","में","और",
]);
function tokens(text: string): Set<string> {
  return new Set((text.normalize("NFC").toLowerCase()
    .match(/[\p{L}\p{M}]{3,}/gu) ?? [])
    .filter(term => !stopwords.has(term)));
}
function numericConflict(question: string, evidence: Chunk[]): boolean {
  const words = tokens(question);
  for(let i=0; i<evidence.length; i++) for(let j=i+1; j<evidence.length; j++) {
    const a = evidence[i].text, b = evidence[j].text;
    if(a === b) continue;
    const aa = numericValues(a), bb = numericValues(b);
    if(!aa.length || !bb.length || aa.join("|") === bb.join("|")) continue;
    const key = signature(a);
    if(key.length < 20 || key !== signature(b)) continue;
    const context = tokens(a);
    if([...words].filter(w => context.has(w)).length >= 2) return true;
  }
  return false;
}
const slotQuestions: Record<string, RegExp> = {
  money: /\b(?:price|fees?|cost|revenue|profit|salary)\b|कीमत|फीस|शुल्क|राजस्व|मूल्य|लागत/u,
  duration: /\b(?:duration|how long)\b|अवधि|कितने\s+(?:दिन|सप्ताह|महीने|साल)/u,
  weight: /\b(?:weight|weighs?)\b|वजन|वज़न|भार/u,
  time: /\bwhen\b|कब|किस समय/u,
  place: /\bwhere\b|कहाँ|कहां/u,
};
const slotEvidence: Record<string, RegExp> = {
  money: /\b(?:price|fees?|costs?|revenue|profit|salary|rupees?|dollars?|inr|usd|paid|charged)\b|कीमत|फीस|रुपय|मूल्य|शुल्क|राजस्व|लागत|[₹$]/u,
  duration: /\b(?:duration|weeks?|days?|months?|years?|hours?|minutes?)\b|सप्ताह|हफ़्त|हफ्त|महीन|साल|वर्ष|दिन|घंटे/u,
  weight: /\b(?:weighs?|weight|kg|kilograms?|grams?|pounds?|lbs?)\b|किलो|ग्राम|वजन|वज़न|भार/u,
  time: /\d{1,2}:\d{2}|\b(?:starts?|opens?|closes?|on\s+(?:mon|tues|wednes|thurs|fri|satur|sun)day)\b|बजे|समय|दिनांक|तारीख/u,
  place: /\b(?:room|venue|address|location|city)\b|\b(?:in|at)\s+[a-z]{3,}\b|स्थान|पता|जगह|शहर/u,
};
export function evidenceSafetyGate(question: string, evidence: Chunk[]): EvidenceSafetyResult | null {
  if(!evidence.length) return null;
  if(numericConflict(question, evidence))
    return {status:"conflict", validation:"heuristic-numeric-conflict"};
  // A missing requested attribute is a refusal even if other attributes exist.
  // This is a labelled heuristic, never a successful model abstention.
  if (explicitlyMissingRequestedFact(question, evidence.map(e => e.text)))
    return {status:"insufficient_evidence", validation:"heuristic-evidence-gap"};
  // Only preempt obvious multi-slot incompleteness. Do not reject single-slot
  // or fully cross-language questions using weak lexical evidence alone.
  const slots = Object.keys(slotQuestions).filter(
    k => slotQuestions[k].test(question.toLowerCase()));
  if(slots.length < 2) return null;
  const source = evidence.map(e => e.text).join("\n").toLowerCase();
  const found = slots.filter(k => slotEvidence[k].test(source));
  return found.length > 0 && found.length < slots.length
    ? {status:"insufficient_evidence",validation:"heuristic-evidence-gap"}
    : null;
}
