import { it, expect, vi } from "vitest";
import { bounded } from "./operation";
it("cancels pending work and invokes resource cleanup", async () => {
  const c = new AbortController(),
    stop = vi.fn();
  const promise = bounded(new Promise(() => {}), c.signal, 1000, stop);
  c.abort();
  await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  expect(stop).toHaveBeenCalledOnce();
});
it("times out hung work with cleanup", async () => {
  vi.useFakeTimers();
  const stop = vi.fn();
  const promise = bounded(new Promise(() => {}), undefined, 50, stop);
  const assertion = expect(promise).rejects.toThrow("timed out");
  await vi.advanceTimersByTimeAsync(50);
  await assertion;
  expect(stop).toHaveBeenCalledOnce();
  vi.useRealTimers();
});
it("removes cancellation listener after success", async () => {
  const c = new AbortController(),
    stop = vi.fn();
  expect(await bounded(Promise.resolve(42), c.signal, 100, stop)).toBe(42);
  c.abort();
  expect(stop).not.toHaveBeenCalled();
});
