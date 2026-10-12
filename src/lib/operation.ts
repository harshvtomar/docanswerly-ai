export function bounded<T>(
  operation: Promise<T>,
  signal: AbortSignal | undefined,
  timeoutMs: number,
  stop: () => void = () => {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error?: Error, value?: T) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      if (error) reject(error);
      else resolve(value as T);
    };
    const abort = () => {
      stop();
      finish(new DOMException("Processing cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      stop();
      finish(
        new Error("Processing timed out. Try a smaller or clearer document."),
      );
    }, timeoutMs);
    operation.then(
      (value) => finish(undefined, value),
      (e) => finish(e),
    );
    if (signal?.aborted) {
      abort();
      return;
    }
    signal?.addEventListener("abort", abort, { once: true });
  });
}
