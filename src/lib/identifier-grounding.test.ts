import { describe, expect, it } from "vitest";
import { validateIdentifierGrounding as check } from "./identifier-grounding";
describe("exact codeword / identifier grounding", () => {
  it("passes only correct literal English names", () => {
    const source = "The listed fictional codename is novelbalagodiba.";
    expect(() => check("What is the codename?", "The codename is novelbalagodiba.", source)).not.toThrow();
    expect(() => check("What is the codename?", "The codename is novelbalagodibo.", source)).toThrow("not supported verbatim");
  });
  it("passes only correct Hindi codewords", () => {
    const source = "इस काल्पनिक अभिलेख का नया नाम नवकागाबितु है।";
    expect(() => check("नया नाम क्या है?", "नया नाम नवकागाबितु है।", source)).not.toThrow();
    expect(() => check("नया नाम क्या है?", "नया नाम नवकागाबिका है।", source)).toThrow("not supported verbatim");
  });
  it("preserves literal mixed-language IDs", () => {
    const source = "The archive lists identifier ArgoZ38 as its verified codeword.";
    expect(() => check("सांकेतिक नाम क्या है?", "सांकेतिक नाम ArgoZ38 है।", source)).not.toThrow();
    expect(() => check("सांकेतिक नाम क्या है?", "सांकेतिक नाम ArgoZ39 है।", source)).toThrow();
  });
  it("refuses unsupported and ambiguous IDs", () => {
    expect(() => check("What is the codeword?", "The codeword is SecretX.", "The codeword has not been published.")).toThrow("unambiguous");
    expect(() => check("What is the codename?", "The codename is Beta.",
      "The codename is Alpha. The codename is Gamma.")).toThrow("unambiguous");
  });
  it("does not disturb ordinary factual paraphrases", () => {
    expect(() => check("What is the crop?", "They grow wheat.", "The farm grows wheat.")).not.toThrow();
    expect(() => check("विद्यालय कहाँ है?", "विद्यालय मुख्य भवन में है।", "विद्यालय मुख्य भवन में है।")).not.toThrow();
  });
});
