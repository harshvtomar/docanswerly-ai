/**
 * High-precision literal-ID grounding for questions explicitly requesting a
 * codeword, codename, identifier, password or named access key.
 *
 * Intentionally narrow: this does not judge general semantic entailment.
 * Uncommon identifiers must be reproduced verbatim from the cited passage.
 */
const questionPattern =
  /\b(?:codewords?|codenames?|identifiers?|passcodes?|passwords?|access\s*(?:codes?|keys?)|secret\s*(?:codes?|keys?))\b|सांकेतिक\s*नाम|नया\s*नाम|पहचान\s*(?:कोड|संख्या)|पासवर्ड|गुप्त\s*(?:कोड|कुंजी)/iu;
const literal = String.raw`([\p{L}\p{M}\p{N}_-]{3,80})`;
const patterns = [
  new RegExp(String.raw`\b(?:codeword|codename|identifier|passcode|password|access\s*(?:code|key))\s+(?:is|was|equals|:|=)\s*${literal}`, "giu"),
  new RegExp(String.raw`\b(?:codeword|codename|identifier|passcode|password|access\s*(?:code|key))\s+${literal}(?=\s+(?:as|is|was|has|for|belongs)\b|[.,!?]|$)`, "giu"),
  new RegExp(String.raw`(?:सांकेतिक\s*नाम|नया\s*नाम|पहचान\s*(?:कोड|संख्या)|गुप्त\s*(?:कोड|कुंजी)|पासवर्ड)\s+${literal}(?=\s*(?:है|हैं|था|थी|होगा|।|[,;.!?]|$))`, "gu"),
];
const invalidValues = new Set(["not", "none", "never", "unknown", "unavailable", "unpublished", "unspecified", "has", "been", "the", "नहीं", "अज्ञात"]);
function extractLiterals(text: string): Set<string> {
  const values = new Set<string>();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of text.normalize("NFC").matchAll(pattern)) {
      const word = match[1].toLocaleLowerCase();
      if (!invalidValues.has(word)) values.add(word);
    }
  }
  return values;
}
export function validateIdentifierGrounding(question: string, answer: string, citedSource: string): void {
  if (!questionPattern.test(question)) return;
  const found = extractLiterals(citedSource);
  if (found.size !== 1)
    throw Error("The cited passages do not establish one unambiguous requested identifier.");
  const claimed = extractLiterals(answer);
  if (claimed.size !== 1 || [...claimed].some(value => !found.has(value)))
    throw Error("The answer's requested identifier is not supported verbatim by its citations.");
}
