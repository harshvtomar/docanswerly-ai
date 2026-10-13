import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
test("record thirty real local-model oracle-context cases", async ({
  page,
}, info) => {
  test.setTimeout(1200000);
  const errors: string[] = [],
    requests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("requestfailed", (r) =>
    requests.push(`${r.method()} ${r.url()} ${r.failure()?.errorText}`),
  );
  page.on("response", (r) => {
    if (r.status() >= 400) requests.push(`${r.status()} ${r.url()}`);
  });
  try {
    await page.goto("./evaluation.html");
    await expect(page.locator("#status")).toHaveText("Ready", {
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: "Run local evaluation" }),
    ).toBeEnabled();
    await page.getByRole("button", { name: "Run local evaluation" }).click();
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
    expect(errors).toEqual([]);
    expect(requests).toEqual([]);
  } finally {
    await info.attach("evaluation-diagnostics", {
      body: JSON.stringify(
        {
          errors,
          requests,
          status: await page
            .locator("#status")
            .textContent()
            .catch(() => null),
          partial: await page
            .locator("#result")
            .textContent()
            .catch(() => null),
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  }
  // Runner completion is distinct from answer-quality acceptance.
});
