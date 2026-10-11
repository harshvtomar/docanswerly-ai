import { test, expect } from "@playwright/test";
for (const language of ["english", "hindi", "mixed"])
  for (const kind of ["text", "scan"]) {
    test(`${language} ${kind} PDF ingestion and viewer`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto("./");
      await page
        .getByLabel("Upload PDFs", { exact: true })
        .setInputFiles(`public/fixtures/${language}-${kind}.pdf`);
      await expect(page.getByText("Page 1 of 1", { exact: true })).toBeVisible({
        timeout: 90000,
      });
      const text = page.getByRole("tabpanel");
      await expect(text).toContainText(
        language === "english"
          ? "information retrieval"
          : language === "hindi"
            ? "सूचना"
            : "Artificial Intelligence",
      );
      await expect(text).toContainText(
        language === "english"
          ? "Artificial"
          : language === "hindi"
            ? "बुद्धिमत्ता"
            : "भारत",
      );
      await page.getByRole("tab", { name: "Original PDF" }).click();
      await expect(
        page.getByLabel("PDF page 1", { exact: true }),
      ).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
test("sample page navigation, Hindi search citations and deletion", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Try a bilingual sample" }).click();
  await expect(page.getByText("Page 1 of 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("बुद्धिमत्ता");
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("भारत");
  await page
    .getByLabel("Search documents", { exact: true })
    .fill("बुद्धिमत्ता");
  await page.locator(".result").click();
  await expect(page.getByText("Page 2 of 3", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Remove bilingual-text.pdf", exact: true })
    .click();
  await expect(
    page.getByText("No matching passage. Try a word from the document."),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A clearer view starts here." }),
  ).toBeVisible();
});
test("invalid upload is reported", async ({ page }) => {
  await page.goto("./");
  await page
    .getByLabel("Upload PDFs", { exact: true })
    .setInputFiles("public/fixtures/invalid.pdf");
  await expect(page.getByRole("alert")).toContainText("Invalid PDF header");
});
test("hybrid text and scanned pages retain original page numbers", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByLabel("Upload PDFs", { exact: true })
    .setInputFiles("public/fixtures/hybrid.pdf");
  await expect(page.getByText("Page 1 of 2", { exact: true })).toBeVisible({
    timeout: 90000,
  });
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByRole("tabpanel")).toContainText("सूचना");
  await expect(page.getByText(/OCR · .*engine confidence/)).toBeVisible();
});
test("responsive layout, local model assets, genuine unavailable AI state", async ({
  page,
}) => {
  await page.goto("./");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "AI connection pending" }),
  ).toBeDisabled();
  for (const path of [
    "ocr/lang/eng.traineddata.gz",
    "ocr/lang/hin.traineddata.gz",
    "ocr/worker.min.js",
  ]) {
    const r = await page.request.get(path);
    expect(r.status()).toBe(200);
    expect((await r.body()).length).toBeGreaterThan(1000);
  }
  await page.screenshot({
    path: `test-results/workspace-${test.info().project.name}.png`,
    fullPage: true,
  });
});
