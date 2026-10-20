/**
 * Small, auditable terminology constraints for English-evidence → Hindi answers.
 * These are source-specific hints, NOT a translator or a general NLI classifier.
 * Evaluate on unseen terms and contexts; never count them as model accuracy.
 */
export interface HindiFactHint {
  category: "weekday" | "crop" | "weight" | "speed";
  source: string;
  hindi: string;
  accepts: RegExp;
}
const FACTS: {category: HindiFactHint["category"]; source: string; inSource: RegExp; hindi: string; accepts: RegExp}[] = [
  {category:"weekday",source:"Monday",inSource:/\bMonday\b/iu,hindi:"सोमवार",accepts:/सोमवार/u},
  {category:"weekday",source:"Tuesday",inSource:/\bTuesday\b/iu,hindi:"मंगलवार",accepts:/मंगलवार/u},
  {category:"weekday",source:"Wednesday",inSource:/\bWednesday\b/iu,hindi:"बुधवार",accepts:/बुधवार/u},
  {category:"weekday",source:"Thursday",inSource:/\bThursday\b/iu,hindi:"गुरुवार",accepts:/गुरुवार|बृहस्पतिवार/u},
  {category:"weekday",source:"Friday",inSource:/\bFriday\b/iu,hindi:"शुक्रवार",accepts:/शुक्रवार/u},
  {category:"weekday",source:"Saturday",inSource:/\bSaturday\b/iu,hindi:"शनिवार",accepts:/शनिवार/u},
  {category:"weekday",source:"Sunday",inSource:/\bSunday\b/iu,hindi:"रविवार",accepts:/रविवार/u},
  {category:"crop",source:"potatoes",inSource:/\b(?:potatoes|potato)\b/iu,hindi:"आलू",accepts:/आलू/u},
  {category:"crop",source:"bananas",inSource:/\bbananas?\b/iu,hindi:"केले",accepts:/केल/u},
  {category:"crop",source:"wheat",inSource:/\bwheat\b/iu,hindi:"गेहूँ",accepts:/गेहूँ|गेहूं/u},
  {category:"crop",source:"rice",inSource:/\brice\b/iu,hindi:"धान",accepts:/धान|चावल/u},
  {category:"crop",source:"corn",inSource:/\b(?:corn|maize)\b/iu,hindi:"मक्का",accepts:/मक्का/u},
  {category:"crop",source:"sugarcane",inSource:/\bsugarcane\b/iu,hindi:"गन्ना",accepts:/गन्न/u},
  {category:"crop",source:"cotton",inSource:/\bcotton\b/iu,hindi:"कपास",accepts:/कपास/u},
  {category:"crop",source:"tomatoes",inSource:/\b(?:tomatoes|tomato)\b/iu,hindi:"टमाटर",accepts:/टमाटर/u},
  {category:"crop",source:"onions",inSource:/\bonions?\b/iu,hindi:"प्याज",accepts:/प्याज|प्याज़/u},
  {category:"crop",source:"carrots",inSource:/\bcarrots?\b/iu,hindi:"गाजर",accepts:/गाजर/u},
  {category:"crop",source:"apples",inSource:/\bapples?\b/iu,hindi:"सेब",accepts:/सेब/u},
  {category:"crop",source:"mangoes",inSource:/\b(?:mangoes|mango)\b/iu,hindi:"आम",accepts:/आम/u},
  {category:"crop",source:"oranges",inSource:/\boranges?\b/iu,hindi:"संतरे",accepts:/संतर/u},
  {category:"crop",source:"peas",inSource:/\bpeas?\b/iu,hindi:"मटर",accepts:/मटर/u},
  {category:"crop",source:"barley",inSource:/\bbarley\b/iu,hindi:"जौ",accepts:/जौ/u},
  {category:"crop",source:"soybeans",inSource:/\bsoybeans?\b/iu,hindi:"सोयाबीन",accepts:/सोयाबीन/u},
  {category:"crop",source:"mustard",inSource:/\bmustard\b/iu,hindi:"सरसों",accepts:/सरसों/u},
  {category:"speed",source:"kilometers per hour",inSource:/\b(?:kilometers?|kilometres?)\s+per\s+hour\b|\bkm\s*\/\s*h\b/iu,hindi:"किलोमीटर प्रति घंटा",accepts:/किलोमीटर\s*(?:प्रति|\/)\s*घंटा|किमी\s*\/\s*घंटा|\bkm\s*\/\s*h\b/iu},
  {category:"weight",source:"kilograms",inSource:/\b(?:kilograms?|kg)\b/iu,hindi:"किलोग्राम",accepts:/किलोग्राम|किलो|\bkg\b/iu},
  {category:"weight",source:"grams",inSource:/\b(?:grams?|g)\b/iu,hindi:"ग्राम",accepts:/ग्राम|\bg\b/iu},
  {category:"weight",source:"pounds",inSource:/\b(?:pounds?|lbs?)\b/iu,hindi:"पाउंड",accepts:/पाउंड|\blbs?\b/iu},
];

export function sourceHindiFactHints(question: string, citedEvidence: string[]): HindiFactHint[] {
  const q = question.toLowerCase();
  const categories: HindiFactHint["category"][] = [];
  if (/किस\s+दिन|कौन\s+से\s+दिन|कब|दिन\s+को|\b(?:weekday|which day|what day)\b/iu.test(q))
    categories.push("weekday");
  if (/फसल|उग|खेती|\b(?:crop|grows?|harvest)\b/iu.test(q))
    categories.push("crop");
  if (/वजन|वज़न|भार|कितने\s+किलो|\b(?:weight|weighs?|heavy|mass)\b/iu.test(q))
    categories.push("weight");
  if (/गति|रफ्तार|रफ़्तार|कितनी\s+तेज|\bspeed\b|\bvelocity\b/iu.test(q))
    categories.push("speed");
  if (!categories.length) return [];
  const text = citedEvidence.join("\n");
  return FACTS.filter(f => categories.includes(f.category) && f.inSource.test(text))
    .slice(0, 8)
    .map(f => ({category:f.category,source:f.source,hindi:f.hindi,accepts:f.accepts}));
}

export function repeatedQuestion(question: string, answer: string): boolean {
  const normalize = (s: string) =>
    s.normalize("NFC").toLocaleLowerCase()
      .replace(/[\p{P}\p{S}\s]+/gu, "");
  return normalize(question) === normalize(answer);
}

/** Small source-scoped translation aid, not a factual entailment engine. */
const HINDI_MATERIAL_GLOSSARY = [
  {source:"बाँस",english:"bamboo",pattern:/बाँस|बांस/u},
  {source:"लकड़ी",english:"wood",pattern:/लकड़ी|लकडी/u},
  {source:"ताँबा",english:"copper",pattern:/ताँब|तांब/u},
  {source:"लोहा",english:"iron",pattern:/लोहा|लोहे/u},
  {source:"काँच",english:"glass",pattern:/काँच|कांच/u},
  {source:"पत्थर",english:"stone",pattern:/पत्थर/u},
  {source:"चाँदी",english:"silver",pattern:/चाँदी|चांदी/u},
  {source:"ऊन",english:"wool",pattern:/ऊन/u},
  {source:"कपास",english:"cotton",pattern:/कपास/u},
  {source:"ईंट",english:"brick",pattern:/ईंट/u},
  {source:"चमड़ा",english:"leather",pattern:/चमड़ा/u},
];
export function sourceEnglishMaterialGlossary(question: string, evidence: string[]) {
  if (!/\b(?:material|made from|made of|constructed from|walls?|fabric|metal|substance)\b|किस\s+से\s+बना|सामग्री/iu.test(question))
    return [];
  const text = evidence.join("\n");
  // If the question asks about one clear subject, keep the matching sentence.
  // This avoids translating the roof's wood as the walls' bamboo.
  const targetSubjects: {q:RegExp;source:RegExp}[] = [
    {q:/\bwalls?\b/iu,source:/दीवार/u},
    {q:/\b(?:roof|ceiling)s?\b/iu,source:/छत/u},
    {q:/\b(?:display\s+)?frames?\b/iu,source:/\bframes?\b|फ्रेम/u},
    {q:/\bdoors?\b/iu,source:/दरवा[ज़ज]|द्वार/u},
    {q:/\bfloors?\b/iu,source:/फर्श/u},
    {q:/\bbenches?\b/iu,source:/बेंच/u},
    {q:/\bcrates?\b/iu,source:/\bcrates?\b|बक्स/u},
  ];
  const requested = targetSubjects.filter(({q})=>q.test(question));
  const sentences = text.split(/[।.!?\r\n]+/u).filter(s => s.trim());
  // An adjacent, different entity is NOT proof of this entity's material.
  // Unknown/compound targets get no strict semantic check, never an invented fact.
  if (requested.length > 1) return [];
  const relevant = requested.length===1
    ? sentences.filter(s=>requested[0].source.test(s)) : sentences;
  if (!relevant.length || (!requested.length && sentences.length > 1)) return [];
  const scoped = relevant.join("\n");
  return HINDI_MATERIAL_GLOSSARY.filter(x=>x.pattern.test(scoped))
    .map(({source,english})=>({source,english}));
}
