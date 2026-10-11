import type { Chunk, EmbeddingProvider, SearchHit } from "./types";
export function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length)
    throw new Error("Embedding dimensions mismatch");
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return norm ? dot / norm : 0;
}
// Provider-neutral foundation. No model is configured, and the UI never labels keyword results semantic.
export class SemanticIndex {
  private vectors: number[][] = [];
  private chunks: Chunk[] = [];
  constructor(readonly provider: EmbeddingProvider) {}
  async build(chunks: Chunk[]) {
    const vectors = await this.provider.embed(chunks.map((c) => c.text));
    if (vectors.length !== chunks.length)
      throw new Error("Embedding count mismatch");
    this.chunks = chunks;
    this.vectors = vectors;
  }
  async search(query: string, k = 5): Promise<SearchHit[]> {
    if (!this.chunks.length) return [];
    const [q] = await this.provider.embed([query]);
    return this.chunks
      .map((chunk, i) => ({ chunk, score: cosine(q, this.vectors[i]) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
  clear() {
    this.chunks = [];
    this.vectors = [];
  }
}
