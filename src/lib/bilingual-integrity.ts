/**
 * Small, inspectable cross-language fact invariants.
 *
 * This is NOT machine translation or semantic entailment: it only rejects
 * unambiguous drift in quantities, negation, calendar months, measurement
 * dimensions and alphanumeric identifiers from a validated English draft.
 */
const toAsciiDigits = (s: string) =>
  s.replace(/[०-९]/gu, c => String(c.charCodeAt(0) - 0x966));
export function factNumbers(s:string):string[] {
  return (toAsciiDigits(s).match(/\d+(?:[.,]\d+)*/gu) ?? []).sort();
}
const months=[
  {en:/\bjanuary\b/iu,hi:/जनवरी/u},
  {en:/\bfebruary\b/iu,hi:/फरवरी|फ़रवरी/u},
  {en:/\bmarch\b/iu,hi:/मार्च/u},
  {en:/\bapril\b/iu,hi:/अप्रैल/u},
  {en:/\bmay\b/iu,hi:/मई/u},
  {en:/\bjune\b/iu,hi:/जून/u},
  {en:/\bjuly\b/iu,hi:/जुलाई/u},
  {en:/\baugust\b/iu,hi:/अगस्त/u},
  {en:/\bseptember\b/iu,hi:/सितंबर|सितम्बर/u},
  {en:/\boctober\b/iu,hi:/अक्टूबर/u},
  {en:/\bnovember\b/iu,hi:/नवंबर|नवम्बर/u},
  {en:/\bdecember\b/iu,hi:/दिसंबर|दिसम्बर/u},
];
const units=[
  {name:"speed",en:/\b(?:kilomet(?:ers|res)?\s+per\s+hour|km\s*\/\s*h|kph)\b/iu,
    hi:/किलोमीटर\s*(?:प्रति|\/)\s*घंटा|किमी\s*\/\s*घंटा|\bkm\s*\/\s*h\b|किलोमीटर\s+घंटे\s+में/iu},
  {name:"weight-kg",en:/\b(?:kilograms?|kg)\b/iu,hi:/किलोग्राम|किलो|\bkg\b/iu},
  {name:"weight-g",en:/\b(?:grams?|g)\b/iu,hi:/\bgrams?\b|ग्राम/iu},
  {name:"celsius",en:/\b(?:degrees?\s+celsius|celsius)\b|°\s*C\b/iu,
    hi:/सेल्सियस|डिग्री\s*सी|°\s*C\b|\bcelsius\b/iu},
  {name:"duration-years",en:/\b(?:years?|yrs?)\b/iu,hi:/साल|वर्ष|\byears?\b/iu},
  {name:"duration-months",en:/\bmonths?\b/iu,hi:/महीन|माह|\bmonths?\b/iu},
  {name:"duration-weeks",en:/\bweeks?\b/iu,hi:/सप्ताह|हफ़्त|हफ्त|\bweeks?\b/iu},
  {name:"duration-days",en:/\bdays?\b/iu,hi:/दिन|\bdays?\b/iu},
  {name:"duration-hours",en:/\bhours?\b/iu,hi:/घंट|\bhours?\b/iu},
];
const enNeg = /\b(?:no|not|never|none|without|cannot|can't|isn't|aren't|wasn't|weren't|doesn't|didn't|won't|unavailable|unknown|undecided)\b/iu;
const hiNeg = /नहीं|नही|मत\s|बिना|अज्ञात|अनुपलब्ध|अनिर्णीत|नामालूम|असमर्थ|निषेध/u;
const identifier = /\b(?=[A-Za-z0-9_-]*[A-Za-z])(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]{3,}\b/gu;
const exactIds=(s:string)=>[...new Set(s.match(identifier)??[])].sort();
/**
 * The validator deliberately throws: the caller can run at most one *real*
 * correction inference, otherwise propagates the failure or safe fallback.
 */
export function assertEnglishHindiFactIntegrity(english:string,hindi:string):void {
  if(factNumbers(english).join("|")!==factNumbers(hindi).join("|"))
    throw Error("The Hindi translation changed the source answer's numeric facts.");
  const sourceMonths=months.flatMap((x,i)=>x.en.test(english)?[i]:[]);
  const targetMonths=months.flatMap((x,i)=>x.hi.test(hindi)?[i]:[]);
  if(sourceMonths.join("|")!==targetMonths.join("|"))
    throw Error("The Hindi translation changed the source answer's calendar month.");
  for(const unit of units){
    if(unit.en.test(english)&&!unit.hi.test(hindi))
      throw Error("The Hindi translation omitted or changed the source "+unit.name+" unit.");
  }
  const enIsNegative=enNeg.test(english),hiIsNegative=hiNeg.test(hindi);
  if(enIsNegative!==hiIsNegative)
    throw Error("The Hindi translation changed the source answer's negation.");
  const expected=exactIds(english);
  const observed=exactIds(hindi);
  if(expected.join("|")!==observed.join("|"))
    throw Error("The Hindi translation changed an exact source identifier.");
}
/** Low-risk language detection: preserve exact single-script source proper nouns. */
export function mainlyHindiInsteadOfEnglish(text:string):boolean {
  const devanagari=text.match(/[\p{Script=Devanagari}]{2,}/gu)??[];
  const latin=text.match(/[A-Za-z]{2,}/gu)??[];
  return devanagari.length>=3 && devanagari.length>2*latin.length;
}
