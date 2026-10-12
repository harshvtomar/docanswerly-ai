import { test, expect } from "@playwright/test";
test("real local model cross-language search, hybrid, citations and deletion", async ({
  page,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Try a bilingual sample ↗" }).click();
  await expect(
    page.getByText("Processed bilingual-text.pdf", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Enable local semantic search" })
    .click();
  await expect(page.getByText(/Semantic search ready/)).toBeVisible({
    timeout: 180000,
  });
  await page.getByLabel("Search mode").selectOption("semantic");
  await page
    .getByLabel("Search documents")
    .fill("Where is artificial intelligence usage growing rapidly?");
  await expect(page.locator(".result").first()).toContainText("भारत", {
    timeout: 30000,
  });
  await page.locator(".result").first().click();
  await expect(page.getByText("Page 3 of 3")).toBeVisible();
  await page.getByLabel("Search mode").selectOption("hybrid");
  await expect(page.locator(".result").filter({ hasText: "भारत" })).toBeVisible(
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: "Remove bilingual-text.pdf" }).click();
  await expect(page.locator(".result")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Disable / cancel semantic search" })
    .click();
  expect(errors).toEqual([]);
});
test("model load failure is explicit and keyword search survives retry", async ({
  page,
}) => {
  await page.route("**/models/minilm/**", (route) => route.abort());
  await page.goto("./");
  await page
    .getByRole("button", { name: "Enable local semantic search" })
    .click();
  await expect(page.getByRole("alert")).toBeVisible({ timeout: 30000 });
  await page
    .getByRole("button", { name: "Disable / cancel semantic search" })
    .click();
  await page.getByRole("button", { name: "Try a bilingual sample ↗" }).click();
  await page.getByLabel("Search documents").fill("बुद्धिमत्ता");
  await expect(page.locator(".result").first()).toContainText("Page 2");
});
