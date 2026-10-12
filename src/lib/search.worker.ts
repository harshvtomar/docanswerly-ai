import { LocalEmbeddings } from "./embeddings";
import { SemanticIndex, reciprocalRankFusion, deduplicate } from "./rag";
import { keywordSearch } from "./text";
import type { Chunk } from "./types";
let model: LocalEmbeddings | undefined,
  index: SemanticIndex | undefined,
  chunks: Chunk[] = [];
// Serialize operations: never query a half-built index.
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    const { id, type } = data;
    try {
      if (type === "init") {
        model = await LocalEmbeddings.load(data.base, (message) =>
          self.postMessage({ id, progress: message }),
        );
        index = new SemanticIndex(model);
        self.postMessage({ id, result: true });
      } else if (type === "index") {
        if (!model || !index) throw new Error("Enable semantic search first");
        chunks = model.split(data.chunks);
        if (chunks.length > 500)
          throw new Error(
            "Semantic search supports up to 500 token-sized passages. Remove documents or use keyword search.",
          );
        self.postMessage({
          id,
          progress: `Indexing ${chunks.length} passages…`,
        });
        await index.build(chunks);
        self.postMessage({ id, result: chunks.length });
      } else if (type === "search") {
        if (!index) throw new Error("Semantic index is unavailable");
        const semantic = await index.search(data.query, 40);
        const hits =
          data.mode === "hybrid"
            ? reciprocalRankFusion([
                keywordSearch(chunks, data.query, 40),
                semantic,
              ])
            : deduplicate(semantic);
        self.postMessage({ id, result: hits });
      }
    } catch (error) {
      self.postMessage({
        id,
        error:
          error instanceof Error ? error.message : "Model inference failed",
      });
    }
  });
};
