import { readFile, writeFile } from "node:fs/promises";
import { LocalEmbeddings } from "../src/lib/embeddings";
import {
  SemanticIndex,
  reciprocalRankFusion,
  semanticFirstFusion,
} from "../src/lib/rag";
import { keywordSearch } from "../src/lib/text";
import type { Chunk, SearchHit } from "../src/lib/types";
const model = await LocalEmbeddings.load(`${process.cwd()}/public/`);
const reports = [];
for (const split of ["development", "heldout"]) {
  const data = JSON.parse(
    await readFile(
      `evaluation/${split === "development" ? "retrieval" : "retrieval-heldout"}.json`,
      "utf8",
    ),
  );
  const chunks: Chunk[] = [
    ...data.cases.map((c: string[]) => c[1]),
    ...data.distractors,
  ].map((text: string, i: number) => ({
    id: `${split}:${i}`,
    documentId: `${split}:${i}`,
    documentName: `${i}.pdf`,
    page: 1,
    start: 0,
    end: [...text].length,
    text,
  }));
  const tokenChunks = model.split(chunks),
    index = new SemanticIndex(model);
  await index.build(tokenChunks);
  const rows = [];
  for (const [i, [category, , query]] of data.cases.entries()) {
    const semantic = await index.search(query, 50),
      keyword = keywordSearch(tokenChunks, query, 50);
    const methods = {
      keyword,
      semantic,
      originalHybrid: reciprocalRankFusion([keyword, semantic], 50),
      improvedHybrid: semanticFirstFusion(semantic, keyword, 50),
    };
    const ranks = Object.fromEntries(
      Object.entries(methods).map(([name, hits]) => {
        const rank =
          hits.findIndex((h) => h.chunk.documentId === chunks[i].documentId) +
          1;
        return [name, rank || null];
      }),
    );
    rows.push({ category, query, ranks });
  }
  const metrics = (selected: typeof rows) =>
    Object.fromEntries(
      ["keyword", "semantic", "originalHybrid", "improvedHybrid"].map(
        (name) => [
          name,
          {
            count: selected.length,
            recallAt1:
              selected.filter((r) => r.ranks[name] && r.ranks[name] <= 1)
                .length / selected.length,
            recallAt3:
              selected.filter((r) => r.ranks[name] && r.ranks[name] <= 3)
                .length / selected.length,
            recallAt5:
              selected.filter((r) => r.ranks[name] && r.ranks[name] <= 5)
                .length / selected.length,
            mrr:
              selected.reduce(
                (n, r) => n + (r.ranks[name] ? 1 / r.ranks[name] : 0),
                0,
              ) / selected.length,
          },
        ],
      ),
    );
  const negatives = [];
  for (const query of data.negatives) {
    const hits = await index.search(query, 1);
    negatives.push({
      query,
      topScore: hits[0]?.score,
      automaticAbstention: false,
    });
  }
  reports.push({
    split,
    note: data.note,
    metrics: metrics(rows),
    byCategory: Object.fromEntries(
      [...new Set(rows.map((r) => r.category))].map((c) => [
        c,
        metrics(rows.filter((r) => r.category === c)),
      ]),
    ),
    rows,
    negatives,
  });
}
const result = {
  generatedAt: new Date().toISOString(),
  parameters: {
    semanticWeight: 1,
    lexicalWeight: 0.15,
    rankConstant: 10,
    frozenBeforeHeldout: true,
  },
  reports,
};
await writeFile(
  "docs/hybrid-evaluation.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    reports.map((r) => ({ split: r.split, metrics: r.metrics })),
    null,
    2,
  ),
);
