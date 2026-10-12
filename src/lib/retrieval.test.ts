import { describe, it, expect } from "vitest";
import { SemanticIndex, reciprocalRankFusion, deduplicate } from "./rag";
import type { Chunk } from "./types";
const chunk = (id: string, start = 0, end = 100, documentId = "a"): Chunk => ({
  id,
  start,
  end,
  documentId,
  documentName: `${documentId}.pdf`,
  page: 2,
  text: "परीक्षण test",
});
describe("retrieval integrity", () => {
  it("fuses ranks without mixing raw score scales", () => {
    const a = { chunk: chunk("a"), score: 100000 },
      b = { chunk: chunk("b", 0, 100, "b"), score: 0.1 };
    expect(reciprocalRankFusion([[a, b], [b]])[0].chunk.id).toBe("b");
  });
  it("deduplicates overlapping spans only on the same document and page", () => {
    const hits = [
      chunk("a"),
      chunk("overlap", 10, 90),
      chunk("other", 10, 90, "other"),
      { ...chunk("page", 0, 100), page: 3 },
    ].map((chunk) => ({ chunk, score: 1 }));
    expect(deduplicate(hits).map((h) => h.chunk.id)).toEqual([
      "a",
      "other",
      "page",
    ]);
  });
  it("keeps separated passages from the same page", () =>
    expect(
      deduplicate(
        [chunk("a"), chunk("b", 110, 200)].map((chunk) => ({
          chunk,
          score: 1,
        })),
      ),
    ).toHaveLength(2));
  it("does not count duplicate IDs twice within a rank list", () => {
    const h = { chunk: chunk("a"), score: 1 };
    expect(reciprocalRankFusion([[h, h]])[0].score).toBe(1 / 61);
  });
  it("replaces deleted document vectors atomically", async () => {
    const index = new SemanticIndex({
      model: "unit-test-only",
      embed: async (texts) => texts.map(() => [1, 0]),
    });
    await index.build([chunk("old")]);
    await index.build([chunk("new", 0, 100, "new")]);
    expect((await index.search("test"))[0].chunk.documentId).toBe("new");
    index.clear();
    expect(await index.search("test")).toEqual([]);
  });
  it("retains prior index after provider failure", async () => {
    let fail = false;
    const index = new SemanticIndex({
      model: "unit-test-only",
      embed: async (texts) => {
        if (fail) throw Error("offline");
        return texts.map(() => [1, 0]);
      },
    });
    await index.build([chunk("safe")]);
    fail = true;
    await expect(index.build([chunk("bad")])).rejects.toThrow("offline");
    fail = false;
    expect((await index.search("test"))[0].chunk.id).toBe("safe");
  });
});
