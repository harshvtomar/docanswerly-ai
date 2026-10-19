import { test, expect, type Request } from "@playwright/test";
import { writeFile } from "node:fs/promises";
import {
  isCompletedModelProbe,
  type FailedRequest,
} from "../evaluation/diagnostics";

test("record thirty oracle-context cases with genuine-model and labelled gate outcomes", async ({
  page,
}, info) => {
  test.setTimeout(1200000);
  const errors: string[] = [],
    requests: FailedRequest[] = [],
    httpErrors: string[] = [];
  const consoleMessages: { type: string; text: string }[] = [];
  const responseStatuses = new Map<Request, number>();
  const modelUrl = new URL(
    "generation/Qwen3-0.6B-Q4_K_M.gguf",
    String(info.project.use.baseURL),
  ).href;
  let modelInitialized = false;
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      consoleMessages.push({ type: message.type(), text: message.text() });
  });
  page.on("response", (r) => {
    responseStatuses.set(r.request(), r.status());
    if (r.status() >= 400) httpErrors.push(`${r.status()} ${r.url()}`);
  });
  page.on("requestfailed", (r) =>
    requests.push({
      method: r.method(),
      url: r.url(),
      error: r.failure()?.errorText ?? "Unknown failure",
      responseStatus: responseStatuses.get(r),
    }),
  );
  try {
    await page.goto("./evaluation.html");
    await expect(page.locator("#status")).toHaveText("Ready", {
      timeout: 15000,
    });
    const button = page.getByRole("button", { name: "Run local evaluation" });
    await expect(button).toBeEnabled();
    await button.click();
    await expect(page.locator("#status")).not.toHaveText("Ready", {
      timeout: 10000,
    });
    await expect(page.locator("#status")).toHaveText(/^(Complete|Failed:)/, {
      timeout: 1100000,
    });
    await expect(page.locator("#status")).toHaveText("Complete");
    const result = JSON.parse(await page.locator("#result").innerText());
    await writeFile(
      "docs/rag-evaluation.json",
      JSON.stringify(result, null, 2) + "\n",
    );
    console.log("RAG_QUALITY_METRICS " + JSON.stringify(result.metrics));
    expect(result.rows).toHaveLength(30);
    expect(result.initializationMs).toBeGreaterThan(0);
    // A bounded pre-inference evidence check can return a labelled decision
    // without calling the model. Every other case MUST have genuine raw model
    // output, even if that output fails quality validation.
    const hasRawOutput = (r: { raw?: string }) =>
      typeof r.raw === "string" && r.raw.length > 0;
    const isPrechecked = (r: {
      raw?: string;
      answer?: { validation?: string; status?: string };
      error?: string;
    }) =>
      r.raw === "" &&
      !r.error &&
      ["heuristic-evidence-gap", "heuristic-numeric-conflict"].includes(
        r.answer?.validation ?? "",
      ) &&
      ["insufficient_evidence", "conflict"].includes(
        r.answer?.status ?? "",
      );
    const rawModelRows = result.rows.filter(hasRawOutput);
    const precheckedRows = result.rows.filter(isPrechecked);
    expect(rawModelRows.length).toBeGreaterThan(0);
    expect(rawModelRows.length + precheckedRows.length).toBe(30);
    expect(precheckedRows.length).toBe(result.metrics.heuristicRefusals);
    expect(result.metrics.modelInvokedCases).toBe(rawModelRows.length);
    expect(result.metrics.precheckedCases).toBe(precheckedRows.length);
    modelInitialized = true;
    expect(errors).toEqual([]);
    expect(httpErrors).toEqual([]);
    expect(
      requests.filter(
        (r) => !isCompletedModelProbe(r, modelUrl, modelInitialized),
      ),
    ).toEqual([]);
  } finally {
    const diagnostics = {
      errors,
      requests,
      httpErrors,
      consoleMessages,
      warnings: requests.filter((r) =>
        isCompletedModelProbe(r, modelUrl, modelInitialized),
      ),
      status: await page
        .locator("#status")
        .textContent({ timeout: 1000 })
        .catch(() => null),
      partial: await page
        .locator("#result")
        .textContent({ timeout: 1000 })
        .catch(() => null),
    };
    const body = JSON.stringify(diagnostics, null, 2);
    await writeFile("test-results/evaluation-diagnostics.json", body + "\n");
    await info.attach("evaluation-diagnostics", {
      body,
      contentType: "application/json",
    });
  }
  // Runner completion is distinct from answer-quality acceptance.
});

test("evaluation module failure becomes Failed promptly", async ({ page }) => {
  await page.route("**/assets/evaluation-*.js", (route) =>
    route.abort("failed"),
  );
  await page.goto("./evaluation.html");
  await expect(page.locator("#status")).toHaveText(/^Failed:/, {
    timeout: 15000,
  });
  await expect(page.locator("#run")).toBeDisabled();
});

test("model loading failure produces diagnostics without inference", async ({
  page,
}) => {
  await page.route("**/generation/*.gguf", (route) =>
    route.fulfill({
      status: 503,
      body: "Model unavailable for failure-path test",
    }),
  );
  await page.goto("./evaluation.html");
  await expect(page.locator("#status")).toHaveText("Ready", { timeout: 15000 });
  await page.locator("#run").click();
  await expect(page.locator("#status")).toHaveText(/^Failed:/, {
    timeout: 30000,
  });
});
