import { readFile, writeFile } from "node:fs/promises";
import { LocalEmbeddings, MODEL } from "../src/lib/embeddings";
import { SemanticIndex, reciprocalRankFusion } from "../src/lib/rag";
import { keywordSearch } from "../src/lib/text";
import type { Chunk } from "../src/lib/types";
const data = JSON.parse(await readFile("evaluation/retrieval.json", "utf8"));
const texts: string[] = [
  ...data.cases.map((c: string[]) => c[1]),
  ...data.distractors,
];
const chunks: Chunk[] = texts.map((text, i) => ({
  id: `fixture-${i}:1:0`,
  documentId: `fixture-${i}`,
  documentName: `fixture-${i}.pdf`,
  page: 1,
  text,
  start: 0,
  end: [...text].length,
}));
const started = performance.now();
const model = await LocalEmbeddings.load(`${process.cwd()}/public/`);
const initMs = performance.now() - started;
const index = new SemanticIndex(model);
const indexing = performance.now();
await index.build(model.split(chunks));
const indexMs = performance.now() - indexing;
const vector = (await model.embed(["भारत की राजधानी नई दिल्ली है।"]))[0];
if (vector.length !== 384) throw new Error("Vector dimensionality mismatch");
const results = [];
for (const [i, c] of data.cases.entries()) {
  const [category, , query] = c;
  const start = performance.now();
  const semantic = await index.search(query, 30);
  const latencyMs = performance.now() - start;
  const lexical = keywordSearch(model.split(chunks), query, 30);
  const hybrid = reciprocalRankFusion([lexical, semantic], 30);
  const rank = (hits: typeof semantic) => {
    const r = hits.findIndex((h) => h.chunk.documentId === `fixture-${i}`);
    return r < 0 ? null : r + 1;
  };
  results.push({
    category,
    query,
    relevant: chunks[i].id,
    keywordRank: rank(lexical),
    semanticRank: rank(semantic),
    hybridRank: rank(hybrid),
    latencyMs,
    semanticTop: semantic[0].chunk.id,
  });
}
const summary: Record<string, unknown> = {};
for (const category of ["all", ...new Set(results.map((r) => r.category))]) {
  const rows =
    category === "all"
      ? results
      : results.filter((r) => r.category === category);
  summary[category] = Object.fromEntries(
    ["keyword", "semantic", "hybrid"].map((mode) => {
      const ranks = rows.map((r) => (r as any)[`${mode}Rank`] as number | null);
      return [
        mode,
        {
          count: rows.length,
          recallAt1: ranks.filter((r) => r && r <= 1).length / rows.length,
          recallAt3: ranks.filter((r) => r && r <= 3).length / rows.length,
          recallAt5: ranks.filter((r) => r && r <= 5).length / rows.length,
          mrr: ranks.reduce((s, r) => s + (r ? 1 / r : 0), 0) / rows.length,
        },
      ];
    }),
  );
}
const negatives = [];
for (const query of data.negatives) {
  const hits = await index.search(query, 3);
  negatives.push({
    query,
    topScore: hits[0].score,
    topSource: hits[0].chunk.id,
    abstained: false,
  });
}
const output = {
  generatedAt: new Date().toISOString(),
  model: MODEL,
  runtime: "Transformers.js 3.8.1 / ONNX Runtime Node CPU q8",
  note: data.note,
  initMs,
  indexMs,
  rssBytes: process.memoryUsage().rss,
  summary,
  results,
  negatives,
  negativePolicy:
    "Retriever ranks passages even for unsupported questions. No answer or automatic abstention is claimed.",
};
await writeFile(
  "docs/retrieval-evaluation.json",
  JSON.stringify(output, null, 2) + "\n",
);
console.log(JSON.stringify({ initMs, indexMs, summary, negatives }, null, 2));
await model.dispose();
// Functional acceptance set A-E must retrieve the correct source within top three.
for (const i of [0, 5, 10, 15, 20])
  if (!results[i].semanticRank || results[i].semanticRank! > 3)
    throw new Error(`Cross-language acceptance failed: ${i}`);
console.log(
  "Real inference: dimensions plus 5 multilingual acceptance checks passed. Full 25-query metrics recorded.",
);
