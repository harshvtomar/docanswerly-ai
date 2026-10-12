import {
  env,
  pipeline,
  type FeatureExtractionPipeline,
} from "@huggingface/transformers";
import type { Chunk, EmbeddingProvider } from "./types";
export const MODEL = {
  id: "Xenova/paraphrase-multilingual-MiniLM-L12-v2",
  revision: "2c4055b12046f11709e9df2c122e59ffbdc2f900",
  dimensions: 384,
  maxTokens: 128,
} as const;
export class LocalEmbeddings implements EmbeddingProvider {
  model = `${MODEL.id}@${MODEL.revision}:q8:mean:normalized`;
  private constructor(private extractor: FeatureExtractionPipeline) {}
  static async load(
    base: string,
    progress: (message: string) => void = () => {},
  ) {
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = `${base}models/`;
    env.backends.onnx.wasm!.numThreads = 1;
    env.backends.onnx.wasm!.proxy = false;
    if (typeof window !== "undefined" || typeof self !== "undefined")
      env.backends.onnx.wasm!.wasmPaths = `${base}onnx/`;
    const extractor = await pipeline("feature-extraction", "minilm", {
      dtype: "q8",
      device:
        typeof process !== "undefined" && process.versions?.node
          ? "cpu"
          : "wasm",
      progress_callback: (p) =>
        progress(
          "progress" in p
            ? `Loading ${p.file}: ${Math.round(p.progress)}%`
            : `Loading multilingual model…`,
        ),
    });
    return new LocalEmbeddings(extractor);
  }
  tokenCount(text: string) {
    return this.extractor.tokenizer.encode(text).length;
  }
  // Split on code points while checking actual model tokens. Never silently truncate Hindi.
  split(chunks: Chunk[]): Chunk[] {
    return chunks.flatMap((chunk) => {
      const points = [...chunk.text],
        result: Chunk[] = [];
      let start = 0;
      while (start < points.length) {
        let lo = 1,
          hi = points.length - start;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi) / 2);
          if (
            this.tokenCount(points.slice(start, start + mid).join("")) <=
            MODEL.maxTokens
          )
            lo = mid;
          else hi = mid - 1;
        }
        const end = start + lo;
        const text = points.slice(start, end).join("");
        if (this.tokenCount(text) > MODEL.maxTokens)
          throw new Error("Unable to fit text into model token budget");
        result.push({
          ...chunk,
          id: `${chunk.id}:s${start}`,
          text,
          start: chunk.start + start,
          end: chunk.start + end,
        });
        if (end === points.length) break;
        start = end - Math.min(24, Math.floor(lo / 5));
      }
      return result;
    });
  }
  async embed(texts: string[]) {
    const vectors: number[][] = [];
    for (const text of texts) {
      if (!text.trim()) throw new Error("Enter a non-empty search query");
      if (this.tokenCount(text) > MODEL.maxTokens)
        throw new Error(
          "Query is too long. Use a shorter question (maximum 128 model tokens).",
        );
      const tensor = await this.extractor(text, {
        pooling: "mean",
        normalize: true,
      });
      const vector = Array.from(tensor.data, Number);
      if (
        vector.length !== MODEL.dimensions ||
        vector.some((v) => !Number.isFinite(v)) ||
        Math.abs(Math.hypot(...vector) - 1) > 0.01
      )
        throw new Error("Invalid model embedding");
      vectors.push(vector);
    }
    return vectors;
  }
  async dispose() {
    await this.extractor.dispose();
  }
}
