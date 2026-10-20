import {describe,it,expect} from "vitest";
import {assertEnglishHindiFactIntegrity as preserve,mainlyHindiInsteadOfEnglish as mostlyHindi} from "./bilingual-integrity";
describe("Step 2 — bilingual translation factual invariants",()=>{
  it("preserves same values in Devanagari and ASCII digits",()=>{
    expect(()=>preserve("The count is 65.","गिनती ६५ है।")).not.toThrow();
    expect(()=>preserve("65 km per hour","गति ६५ किलोमीटर प्रति घंटा है")).not.toThrow();
  });
  it("rejects missing and changed numbers even if a valid citation exists",()=>{
    expect(()=>preserve("65 kilometers per hour","किलोमीटर प्रति घंटा")).toThrow("numeric facts");
    expect(()=>preserve("65 kilometers per hour","७५ किलोमीटर प्रति घंटा")).toThrow("numeric facts");
    expect(()=>preserve("There are 27 parts and 12 spares.","२७ हिस्से हैं।")).toThrow("numeric facts");
  });
  it("requires unit preservation after the number matches",()=>{
    expect(()=>preserve("65 kilometers per hour","गति ६५ किलोमीटर है।")).toThrow("speed unit");
    expect(()=>preserve("The item weighs 3 kilograms.","वस्तु ३ किलो है।")).not.toThrow();
    expect(()=>preserve("It took 5 weeks.","इसमें ५ साल लगे।")).toThrow("duration-weeks");
    expect(()=>preserve("Temperature was 22 degrees Celsius.","तापमान २२ सेल्सियस था।")).not.toThrow();
  });
  it("rejects swapped calendar months with unchanged years",()=>{
    expect(()=>preserve("Filed in September 2028.","रिपोर्ट अगस्त २०२८ में दाखिल हुई।")).toThrow("calendar month");
    expect(()=>preserve("Filed in September 2028.","रिपोर्ट सितम्बर २०२८ में दाखिल हुई।")).not.toThrow();
  });
  it("refuses removed or invented negation",()=>{
    expect(()=>preserve("Access is not available.","प्रवेश उपलब्ध है।")).toThrow("negation");
    expect(()=>preserve("Access is available.","प्रवेश उपलब्ध नहीं है।")).toThrow("negation");
    expect(()=>preserve("Access is not available.","प्रवेश उपलब्ध नहीं है।")).not.toThrow();
  });
  it("copies exact source identifiers without rewriting or introducing extra IDs",()=>{
    expect(()=>preserve("Verified codeword is Sable-19.","सांकेतिक नाम Sable-19 है।")).not.toThrow();
    expect(()=>preserve("Verified codeword is Sable-19.","सांकेतिक नाम Sable-20 है।")).toThrow("exact source identifier");
    expect(()=>preserve("Verified codeword is Sable-19.","सांकेतिक नाम है।")).toThrow("exact source identifier");
  });
  it("recognizes predominantly Hindi text masquerading as English",()=>{
    expect(mostlyHindi("उद्यान को पानी सोन नदी से मिलता है।")).toBe(true);
    expect(mostlyHindi("The park gets water from सोन नदी.")).toBe(false);
    expect(mostlyHindi("The verified codeword is नवकोकाकातेगि.")).toBe(false);
  });
});
