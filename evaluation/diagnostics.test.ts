import { describe, it, expect } from "vitest";
import { isCompletedModelProbe, type FailedRequest } from "./diagnostics";
const url = "http://localhost/docanswerly-ai/generation/model.gguf";
const probe: FailedRequest = {
  method: "HEAD",
  url,
  error: "net::ERR_ABORTED",
  responseStatus: 200,
};
describe("model probe diagnostics", () => {
  it("keeps a completed HEAD abort non-fatal only after model initialization", () => {
    expect(isCompletedModelProbe(probe, url, true)).toBe(true);
    expect(isCompletedModelProbe(probe, url, false)).toBe(false);
  });
  it.each([
    { method: "GET" },
    { url: url + ".other" },
    { responseStatus: 404 },
    { responseStatus: 500 },
    { responseStatus: undefined },
    { error: "net::ERR_CONNECTION_RESET" },
  ])("does not hide real resource failure %j", (change) => {
    expect(isCompletedModelProbe({ ...probe, ...change }, url, true)).toBe(
      false,
    );
  });
});
