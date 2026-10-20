import { describe, expect, it } from "vitest";
import { validateIdentifierGrounding as check, sourceIdentifierHint } from "./identifier-grounding";
describe("exact codeword / identifier grounding", () => {
  it("passes only correct literal English names", () => {
    const source = "The listed fictional codename is novelbalagodiba.";
    expect(() => check("What is the codename?", "The codename is novelbalagodiba.", source)).not.toThrow();
    expect(() => check("What is the codename?", "The codename is novelbalagodibo.", source)).toThrow("not supported verbatim");
  });
  it("accepts fluent sentence variants and bare Hindi IDs", () => {
    expect(() => check("What is the codename?",
      "The verified codename for this archive is 'novelbalagodiba'.",
      "The codename is novelbalagodiba.")).not.toThrow();
    expect(() => check("सांकेतिक नाम क्या है?", "नवकागाबितु",
      "इस काल्पनिक अभिलेख का नया नाम नवकागाबितु है।")).not.toThrow();
  });
  it("extracts a codeword from 'lists the identifier X as' evidence", () => {
    const src = "The fictional archive record Sable-1 lists the identifier novelbolodogiba as its verified codeword. No other codeword is listed.";
    expect(() => check("What is the verified codeword?", "The verified codeword for Sable-1 is 'novelbolodogiba'.", src)).not.toThrow();
    expect(() => check("What is the verified codeword?", "The codeword is 'novelbolodogibo'.", src)).toThrow("not supported verbatim");
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

describe("uniquely anchored multilingual source identifier hints",()=>{
  it("finds a Latin codeword from its exact verification sentence",()=>{
    expect(sourceIdentifierHint("What is the verified codeword?",[
      {text:"The archival record lists the identifier novelbololilagi as its verified codeword. No other codeword is listed."}
    ])).toEqual({label:"E1",value:"novelbololilagi"});
  });
  it("finds a Hindi codeword despite the English question",()=>{
    expect(sourceIdentifierHint("What is the verified codeword?",[
      {text:"काल्पनिक अभिलेख Sable-19 का सत्यापित सांकेतिक नाम नवकोकाकातेगि है। अन्य नाम दर्ज नहीं है।"}
    ])).toEqual({label:"E1",value:"नवकोकाकातेगि"});
  });
  it("does not guess from unverified placeholders or multiple IDs",()=>{
    expect(sourceIdentifierHint("What is the codeword?",[{text:"The codeword has not been published."}])).toBeNull();
    expect(sourceIdentifierHint("What is the codename?",[{text:"The codename is AlphaOne. The codename is BetaTwo."}])).toBeNull();
  });
});
