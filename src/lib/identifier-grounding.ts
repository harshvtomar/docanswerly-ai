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
  // The factual statement can identify a codeword through another label.
  new RegExp(String.raw`\b(?:lists?|records?|displays?)\s+(?:the\s+)?(?:verified\s+)?(?:identifier|codeword|codename)\s+${literal}(?=\s+(?:as|is|was|for)\b|[.,!?]|$)`, "giu"),
  new RegExp(String.raw`\b(?:codeword|codename|identifier|passcode|password|access\s*(?:code|key))\s+(?:is|was|equals|:|=)\s*${literal}`, "giu"),
  new RegExp(String.raw`\b(?:codeword|codename|identifier|passcode|password|access\s*(?:code|key))\s+${literal}(?=\s+(?:as|is|was|has|for|belongs)\b|[.,!?]|$)`, "giu"),
  new RegExp(String.raw`(?:सांकेतिक\s*नाम|नया\s*नाम|पहचान\s*(?:कोड|संख्या)|गुप्त\s*(?:कोड|कुंजी)|पासवर्ड)\s+${literal}(?=\s*(?:है|हैं|था|थी|होगा|।|[,;.!?]|$))`, "gu"),
];
const invalidValues = new Set(["not", "none", "never", "unknown", "unavailable", "unpublished", "unspecified", "has", "been", "the", "listed", "provided", "published", "given", "available", "disclosed", "identified", "recorded", "shown", "specified", "नहीं", "अज्ञात"]);
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
  // Valid answers may use "codeword for record X is ...", quote the word
  // without any surrounding sentence, or give its name in Hindi. Requiring
  // one fixed syntactic answer template wrongly rejects these true positives.
  const expected = [...found][0];
  const answerTokens: string[] = answer.normalize("NFC").toLocaleLowerCase()
    .match(/[\p{L}\p{M}\p{N}_-]{3,}/gu) ?? [];
  if (!answerTokens.includes(expected))
    throw Error("The answer's requested identifier is not supported verbatim by its citations.");
  // Preserve precision for long opaque IDs: do not allow a wrong near-match
  // alongside the correct ID (e.g. "novelgood" AND "novelbad").
  if (expected.length >= 9) {
    const prefix = [...expected].slice(0,5).join("");
    if (answerTokens.some(word => word !== expected && word.length >= 8 && word.startsWith(prefix)))
      throw Error("The answer includes a conflicting identifier absent from the cited source.");
  }
  const claimed = extractLiterals(answer);
  if ([...claimed].some(word => word !== expected))
    throw Error("The answer's requested identifier is not supported verbatim by its citations.");
}
