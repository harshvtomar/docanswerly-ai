import type { Chunk, SearchHit } from "./types";
export class SearchClient {
  private worker = new Worker(new URL("./search.worker.ts", import.meta.url), {
    type: "module",
  });
  private next = 0;
  private pending = new Map<
    number,
    {
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();
  constructor(private progress: (message: string) => void) {
    this.worker.onmessage = ({ data }) => {
      if (data.progress) {
        this.progress(data.progress);
        return;
      }
      const p = this.pending.get(data.id);
      if (!p) return;
      clearTimeout(p.timer);
      this.pending.delete(data.id);
      if (data.error) p.reject(new Error(data.error));
      else p.resolve(data.result);
    };
    this.worker.onerror = () =>
      this.dispose(
        "Search worker failed. Disable and enable semantic search to retry.",
      );
  }
  private call(
    type: string,
    payload: Record<string, unknown>,
    timeout = 120000,
  ): Promise<unknown> {
    const id = ++this.next;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          this.dispose(
            "Semantic operation timed out. Try fewer documents or keyword search.",
          ),
        timeout,
      );
      this.pending.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, type, ...payload });
    });
  }
  init() {
    return this.call(
      "init",
      { base: new URL(import.meta.env.BASE_URL, location.origin).href },
      240000,
    );
  }
  index(chunks: Chunk[]) {
    return this.call("index", { chunks }, 240000) as Promise<number>;
  }
  search(query: string, mode: string) {
    return this.call("search", { query, mode }, 30000) as Promise<SearchHit[]>;
  }
  dispose(message = "Semantic search cancelled") {
    this.worker.terminate();
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error(message));
    }
    this.pending.clear();
  }
}
