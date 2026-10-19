import { describe,expect,it } from "vitest";
import { countEvidenceHint, numericFingerprint } from "./bilingual-evidence";
describe("high precision bilingual numeral evidence",()=>{
  it("links a count to the question topic in English passages",()=>{
    expect(countEvidenceHint("कार्यशाला में कितने कलपुर्जे उपयोग होते हैं?",[
      {text:"The clock workshop uses 27 components in its teaching kit. The advanced kit is separate."}
    ])).toEqual({label:"E1",source:"The clock workshop uses 27 components in its teaching kit",count:"27"});
  });
  it("recognizes Devanagari numerals beside purchased chairs",()=>{
    expect(countEvidenceHint("How many folding chairs were purchased?",[
      {text:"समिति ने ५४ मोड़ने वाली कुर्सियाँ खरीदीं। पर्दे पुराने हैं।"}
    ])).toEqual({label:"E1",source:"समिति ने ५४ मोड़ने वाली कुर्सियाँ खरीदीं",count:"54"});
  });
  it("does not infer shipped numbers from planned collections",()=>{
    expect(countEvidenceHint("How many water samples were shipped?",[
      {text:"The team planned to collect 12 samples. The shipment count is unavailable."}
    ])).toBeNull();
  });
  it("refuses unrelated numerals, missing counts, ambiguous sources",()=>{
    expect(countEvidenceHint("How many chairs were purchased?",[
      {text:"The committee purchased 14 tables, and the chairs are not counted."}
    ])).toBeNull();
    expect(countEvidenceHint("How many chairs were purchased?",[
      {text:"The team purchased 4 chairs."},{text:"The team purchased 9 chairs."}
    ])).toBeNull();
    expect(countEvidenceHint("How many students attended?",[
      {text:"The event had 3 banners."}
    ])).toBeNull();
  });
  it("normalizes Hindi but retains numeric mismatch evidence",()=>{
    expect(numericFingerprint("६५ किलोमीटर प्रति घंटा")).toBe("65");
    expect(numericFingerprint("65 kilometers per hour")).toBe("65");
    expect(numericFingerprint("65, 90")).not.toBe("65");
  });
});
