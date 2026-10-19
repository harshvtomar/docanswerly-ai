import { describe, it, expect } from "vitest";
import { parseGenerationModelConfig } from "./generation-model-config";
const valid = {
  id: "qwen3-0.6b-baseline",
  baseModel: "Qwen/Qwen3-0.6B",
  kind: "baseline",
  file: "Qwen3-0.6B-Q4_K_M.gguf",
  bytes: 396705472,
  sha256: "a".repeat(64),
  review: "original pinned baseline",
};
describe("GGUF model deployment manifest", () => {
  it("accepts the pinned default model", () => {
    expect(parseGenerationModelConfig(valid).kind).toBe("baseline");
  });
  it("accepts vetted same-origin fine-tuned GGUF metadata", () => {
    expect(parseGenerationModelConfig({...valid, id:"qwen3-custom-v1",kind:"approved-finetune",file:"docanswerly-abc123.gguf",review:"signed evaluation run 123"}).kind).toBe("approved-finetune");
  });
  it("rejects remote or path-traversing GGUF paths", () => {
    for (const file of ["../model.gguf", "https://bad.example/model.gguf", "/model.gguf", "a/b.gguf", "model.bin"]) {
      expect(() => parseGenerationModelConfig({...valid,file})).toThrow();
    }
  });
  it("rejects unknown architectures and unverified metadata", () => {
    expect(() => parseGenerationModelConfig({...valid,baseModel:"other"})).toThrow();
    expect(() => parseGenerationModelConfig({...valid,sha256:"unverified"})).toThrow();
    expect(() => parseGenerationModelConfig({...valid,kind:"approved-finetune"})).toThrow();
    expect(() => parseGenerationModelConfig({...valid,extra:"field"})).toThrow();
  });
});
