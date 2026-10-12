import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
test("record thirty real local-model oracle-context cases", async ({
  page,
}) => {
  test.setTimeout(3600000);
  await page.goto("./evaluation.html");
  await page.getByRole("button", { name: "Run local evaluation" }).click();
  await expect(page.locator("#status")).toHaveText("Complete", {
    timeout: 3500000,
  });
  const result = JSON.parse(await page.locator("#result").innerText());
  await writeFile(
    "docs/rag-evaluation.json",
    JSON.stringify(result, null, 2) + "\n",
  );
  console.log("RAG_QUALITY_METRICS " + JSON.stringify(result.metrics));
  expect(result.rows).toHaveLength(30);
  // This checks evaluation completion, NOT a quality acceptance threshold.
});
