/** Versioned, same-origin browser model contract. Never load arbitrary URLs. */
export interface GenerationModelConfig {
  id: string;
  baseModel: "Qwen/Qwen3-0.6B";
  kind: "baseline" | "approved-finetune";
  file: string;
  bytes: number;
  sha256: string;
  review: string;
}
export function parseGenerationModelConfig(raw: unknown): GenerationModelConfig {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw))
    throw Error("Invalid generation-model manifest.");
  const m = raw as Record<string, unknown>;
  if (Object.keys(m).sort().join("|") !== "baseModel|bytes|file|id|kind|review|sha256")
    throw Error("Generation-model manifest has unexpected fields.");
  if (m.baseModel !== "Qwen/Qwen3-0.6B" ||
    (m.kind !== "baseline" && m.kind !== "approved-finetune") ||
    typeof m.id !== "string" || !/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(m.id) ||
    typeof m.file !== "string" || !/^[a-z0-9][a-z0-9._-]{1,120}\.gguf$/i.test(m.file) ||
    !Number.isSafeInteger(m.bytes) || Number(m.bytes) < 1024 ||
    Number(m.bytes) > 650_000_000 ||
    typeof m.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(m.sha256) ||
    typeof m.review !== "string" || !m.review.trim() || m.review.length > 180)
    throw Error("Invalid or unsupported generation model descriptor.");
  if (m.kind === "approved-finetune" && m.review === "original pinned baseline")
    throw Error("Fine-tuned models require independent release approval.");
  return m as unknown as GenerationModelConfig;
}
