/**
 * Conservative question-scoped count evidence for bilingual recovery.
 *
 * Only used to ask the REAL local model to reconsider an apparent false
 * refusal. Not a generated answer, not human labels, and not an accuracy
 * metric. We refuse to infer a count when source facts are missing, ambiguous,
 * or in a different subject/relation.
 */
export type CountEvidenceHint = {
  label: string;
  source: string;
  count: string;
};
const topics: { ask: RegExp; mention: RegExp }[] = [
  { ask: /\b(?:components?|parts?)\b|कलपुर्ज|पुर्ज/u, mention: /\b(?:components?|parts?)\b|कलपुर्ज|पुर्ज/iu },
  { ask: /\bchairs?\b|कुर्स/u, mention: /\bchairs?\b|कुर्स/iu },
  { ask: /\bbooks?\b|किताब|पुस्तक/u, mention: /\bbooks?\b|किताब|पुस्तक/iu },
  { ask: /\b(?:tickets?|passes?)\b|टिकट/u, mention: /\b(?:tickets?|passes?)\b|टिकट/iu },
  { ask: /\b(?:students?|pupils?)\b|विद्यार्थ|छात्र/u, mention: /\b(?:students?|pupils?)\b|विद्यार्थ|छात्र/iu },
  { ask: /\b(?:visitors?|attendees?)\b|आगंतुक|दर्शक/u, mention: /\b(?:visitors?|attendees?)\b|आगंतुक|दर्शक/iu },
];
const missing = /\b(?:not\s+(?:yet\s+)?(?:published|specified|available|provided|known|reported|counted)|unknown|unavailable|unspecified|undecided|not\s+determined|planned\s+to|proposed\s+to)\b|नहीं\s+(?:बताया|दिया|गया)|अज्ञात|लंबित|अनिर्णीत|अभी\s+तय\s+नहीं/iu;
function normalizedNumbers(value: string) {
  return value.replace(/[०-९]/gu, c => String(c.charCodeAt(0) - 0x966))
    .match(/(?:^|[^\p{L}\p{N}])\d+(?:[,.]\d+)*(?=$|[^\p{L}\p{N}])/gu)
    ?.map(n => n.replace(/^[^\d]+/u, "")) ?? [];
}
export function countEvidenceHint(question: string, evidence: {text:string}[]): CountEvidenceHint | null {
  if (!/\b(?:how\s+many|number\s+of|count\s+of)\b|कितने|कितनी|कुल\s+कितने/iu.test(question))
    return null;
  const target = topics.filter(t => t.ask.test(question));
  if (target.length !== 1) return null;
  const purchasing = /\b(?:purchased|bought|buy)\b|खरीद/iu.test(question);
  const hits: CountEvidenceHint[] = [];
  for (const [i, chunk] of evidence.entries()) {
    for (const sentence of chunk.text.normalize("NFC").split(/[।.!?\r\n]+/u)) {
      const source = sentence.trim();
      if (!source || !target[0].mention.test(source) || missing.test(source)) continue;
      if (purchasing && !/\b(?:purchased|bought|buy)\b|खरीद/iu.test(source)) continue;
      const counts = [...new Set(normalizedNumbers(source))];
      if (counts.length === 1)
        hits.push({label:"E"+(i+1),source,count:counts[0]});
    }
  }
  // Deliberately do not guess across multiple seemingly related passages.
  return hits.length === 1 ? hits[0] : null;
}
export function numericFingerprint(text: string): string {
  return (text.replace(/[०-९]/gu, c => String(c.charCodeAt(0)-0x966))
    .match(/\d+(?:[.,]\d+)*/gu) ?? []).sort().join("|");
}
