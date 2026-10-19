/**
 * High-precision, conservative pre-inference guard for facts the evidence
 * explicitly says are unavailable. NOT a semantic entailment or completeness
 * classifier: sentences and topical anchors can both be imperfect.
 *
 * Prevents the local LLM from treating an explicitly missing value, or an
 * embedded instruction to invent a credential, as grounded evidence.
 * The original source passages/citation metadata remain untouched.
 */
const topics: { question: RegExp; source: RegExp }[] = [
  {
    question: /\b(?:access\s*(?:key|code)|api\s*key|secret\s*(?:key|code)|password|passcode|credential|token|codeword|codename|identifier)\b|पासवर्ड|गुप्त\s*(?:कुंजी|कोड)|प्रवेश\s*(?:कुंजी|कोड)|सांकेतिक\s*नाम|नया\s*नाम|पहचान\s*कोड/iu,
    source: /\b(?:access\s*(?:key|code)|api\s*key|secret\s*(?:key|code)|password|passcode|credential|token|codeword|codename|identifier)\b|पासवर्ड|गुप्त\s*(?:कुंजी|कोड)|प्रवेश\s*(?:कुंजी|कोड)|सांकेतिक\s*नाम|नया\s*नाम|पहचान\s*कोड/iu,
  },
  {
    question: /\b(?:accreditation|accredited|certification|certified)\b|मान्यता|प्रमाणन|प्रमाणित/iu,
    source: /\b(?:accreditation|accredited|certification|certified)\b|मान्यता|प्रमाणन|प्रमाणित/iu,
  },
  {
    question: /\b(?:shipping|delivery|postage|fee|fees|charge|charges|price|cost|tuition)\b|शुल्क|फीस|कीमत|लागत|भाड़ा|भाड़ा/iu,
    source: /\b(?:shipping|delivery|postage|fee|fees|charge|charges|price|cost|tuition)\b|शुल्क|फीस|कीमत|लागत|भाड़ा|भाड़ा/iu,
  },
  {
    question: /\b(?:address|location|street|venue)\b|पता|स्थान|जगह/iu,
    source: /\b(?:address|location|street|venue)\b|पता|स्थान|जगह/iu,
  },
  {
    question: /\b(?:battery\s*life|runtime|duration|operating\s*time)\b|बैटरी\s*(?:समय|अवधि)|अवधि/iu,
    source: /\b(?:battery\s*life|runtime|duration|operating\s*time)\b|बैटरी\s*(?:समय|अवधि)|अवधि/iu,
  },
  {
    question: /\b(?:engineer|inspector|reviewer|author|signatory)\b|अभियंता|इंजीनियर|निरीक्षक|लेखक/iu,
    source: /\b(?:engineer|inspector|reviewer|author|signatory)\b|अभियंता|इंजीनियर|निरीक्षक|लेखक/iu,
  },
];
const unavailable = /\b(?:not\s+(?:yet\s+)?(?:provided|specified|available|known|disclosed|published|determined|decided|finali[sz]ed|confirmed|named|assigned|listed|shared|set)|(?:has|have|is|was|were)\s+not\s+(?:yet\s+)?(?:been\s+)?(?:provided|specified|determined|decided|disclosed|published|finali[sz]ed|confirmed|named|assigned|listed|shared|set)|undecided|unspecified|unavailable|unknown|unpublished|undisclosed|pending|under\s+review|to\s+be\s+(?:decided|determined|announced|confirmed)|(?:will|shall)\s+be\s+(?:decided|determined|announced|confirmed|published|set))\b|(?:तय|निर्धारित|घोषित|बताया|दिया|लिखा|उपलब्ध|स्पष्ट|पता|नामित|जारी|प्रकाशित)\s*(?:नहीं|नही)|(?:नहीं|नही)\s*(?:बताया|दिया|गया|मिला|है|हुआ)|अभी\s*(?:तय|निर्धारित|घोषित)\s*(?:नहीं|नही)|विचाराधीन|अज्ञात|अनिर्णीत|लंबित/iu;
const instructToInvent = /\b(?:ignore\s+(?:all\s+|previous\s+|the\s+)?(?:instructions|rules|system)|pretend|fabricate|invent\s+(?:a|the)?\s*(?:key|code|token)|(?:assistant|model|chatbot|ai)\s+(?:must|should)\s+(?:answer|say|claim)|answer\s+(?:with|exactly))\b|निर्देशों\s*को\s*अनदेखा|कल्पना\s*करके\s*(?:कोड|कुंजी)/iu;
const credential = topics[0];
const wordSet = (text: string) =>
  new Set((text.toLowerCase().normalize("NFC").match(/[\p{L}\p{M}]{4,}/gu) ?? [])
    .filter(w => !/^(?:what|when|where|which|with|from|that|this|does|have|were|will|about|क्या|किसने|कहाँ|कौनसा|कितने|होगा|इसका)$/.test(w)));

/**
 * True means "do not answer": at least one requested fact is explicitly
 * described as unavailable, or source text tries to invent a requested secret.
 * False means "no high-precision gap found", NOT "evidence is sufficient".
 */
export function explicitlyMissingRequestedFact(question: string, passages: string[]): boolean {
  const q = question.normalize("NFC");
  const matching = topics.filter(topic => topic.question.test(q));
  const qWords = wordSet(q);
  return passages.some(passage => {
    const sentences = passage.normalize("NFC")
      .split(/(?<=[.!?।])\s+|[\r\n]+/u)
      .map(s => s.trim()).filter(Boolean);
    if (matching.some(t => t === credential) &&
        credential.source.test(passage) && instructToInvent.test(passage))
      return true;
    return sentences.some(sentence => {
      if (!unavailable.test(sentence)) return false;
      if (matching.some(topic => topic.source.test(sentence))) return true;
      const overlap = [...wordSet(sentence)].filter(word => qWords.has(word)).length;
      // Avoid guessing from an unrelated sentence such as "the founder is
      // unknown" when asked about a known exhibition venue.
      return overlap >= 2;
    });
  });
}
