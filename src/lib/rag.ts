import type { Chunk, EmbeddingProvider, SearchHit } from "./types";
export function cosine(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length)
    throw new Error("Embedding dimensions mismatch");
  const dot = a.reduce((s, v, i) => s + v * b[i], 0);
  const norm = Math.hypot(...a) * Math.hypot(...b);
  return norm ? dot / norm : 0;
}
// Provider-neutral index. Production uses the pinned LocalEmbeddings provider.
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

// Rank fusion avoids mixing cosine and lexical scores on incompatible scales.
export function reciprocalRankFusion(
  lists: SearchHit[][],
  limit = 12,
): SearchHit[] {
  const scores = new Map<string, SearchHit>();
  for (const list of lists) {
    const seen = new Set<string>();
    list.forEach((hit, i) => {
      if (seen.has(hit.chunk.id)) return;
      seen.add(hit.chunk.id);
      const previous = scores.get(hit.chunk.id);
      scores.set(hit.chunk.id, {
        chunk: hit.chunk,
        score: (previous?.score ?? 0) + 1 / (60 + i + 1),
      });
    });
  }
  return deduplicate(
    [...scores.values()].sort((a, b) => b.score - a.score),
    limit,
  );
}
export function deduplicate(hits: SearchHit[], limit = 12): SearchHit[] {
  const result: SearchHit[] = [];
  for (const hit of hits) {
    if (
      result.some(
        ({ chunk: c }) =>
          c.documentId === hit.chunk.documentId &&
          c.page === hit.chunk.page &&
          (c.id === hit.chunk.id ||
            Math.max(
              0,
              Math.min(c.end, hit.chunk.end) -
                Math.max(c.start, hit.chunk.start),
            ) /
              Math.max(
                1,
                Math.min(c.end - c.start, hit.chunk.end - hit.chunk.start),
              ) >
              0.5),
      )
    )
      continue;
    result.push(hit);
    if (result.length === limit) break;
  }
  return result;
}
