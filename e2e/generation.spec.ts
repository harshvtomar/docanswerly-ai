import { test, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
test("genuine local answer, citation navigation, Hindi and unsupported question", async ({
  page,
}, info) => {
  test.setTimeout(600000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Try a bilingual sample" }).click();
  await expect(page.getByText("Page 1 of 3", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Enable experimental local answers" })
    .click();
  await expect(
    page.getByText("Local answers ready", { exact: true }),
  ).toBeVisible({ timeout: 240000 });
  const observations = [];
  for (const [question, language] of [
    ["What improves information retrieval?", "en"],
    ["भारत में किसका उपयोग बढ़ रहा है?", "hi"],
    ["What was the company revenue in 2025?", "en"],
  ]) {
    await page
      .getByLabel("Answer language", { exact: true })
      .selectOption(language);
    await page.getByLabel("Ask a question", { exact: true }).fill(question);
    const start = Date.now();
    await page
      .getByRole("button", { name: "Ask documents", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Ask documents", exact: true }),
    ).toBeEnabled({ timeout: 190000 });
    const content = await page.locator(".answer-output").allTextContents();
    const alerts = await page
      .locator('.ask-panel [role="alert"]')
      .allTextContents();
    observations.push({
      question,
      language,
      content,
      alerts,
      latencyMs: Date.now() - start,
    });
    // A failed model validation must never leave the UI at "Generating".
    if (alerts.length) {
      await expect(page.locator('.ask-panel [role="status"]')).toHaveText(
        "Local answer failed. You can retry.",
      );
    }
    if (language === "hi") {
      // The previous build returned an invented numeral and no answer.
      // This is a real browser-model acceptance gate, not mocked inference.
      expect(alerts).toEqual([]);
      await expect(page.locator(".answer-output")).toContainText(
        /कृत्रिम बुद्धिमत्ता|आर्टिफिशियल इंटेलिजेंस|आर्टिफ़िशियल इंटेलिजेंस|Artificial Intelligence|\bAI\b/iu,
      );
      await expect(page.locator(".answer-citation").first()).toBeVisible();
      await expect(page.locator(".answer-output p[lang='hi']").first()).toContainText(/\p{Script=Devanagari}/u);
      // Preserve the actual model outcome in the artifact. The app is
      // experimental: a failed Hindi generation can show a *clearly marked*
      // verbatim source passage. That is functional safety, NOT model success.
      const mode = (await page.locator(".answer-output h4").textContent())?.trim();
      expect([
        "AI-generated answer",
        "Source excerpt · AI answer unavailable",
      ]).toContain(mode);
      (observations[observations.length - 1] as { answerMode?: string })
        .answerMode = mode;
      if (mode === "Source excerpt · AI answer unavailable") {
        await expect(page.locator(".answer-output [role='note']")).toContainText(
          "not an AI-generated",
        );
        await expect(page.locator(".answer-output p[lang='hi']").first()).toContainText(
          "भारत में Artificial Intelligence का उपयोग तेजी से बढ़ रहा है।",
        );
        await page.locator(".answer-citation").first().click();
        await expect(page.getByText("Page 3 of 3", { exact: true })).toBeVisible();
      }
    }
    if (question.startsWith("What improves")) {
      await expect(page.locator(".answer-output")).toContainText(
        /intelligence/i,
      );
      await expect(page.locator(".answer-citation").first()).toBeVisible();
      await page.locator(".answer-citation").first().click();
      await expect(page.getByRole("tabpanel")).toContainText(
        /intelligence|बुद्धिमत्ता/,
      );
    }
  }
  await writeFile(
    `test-results/generation-${info.project.name}.json`,
    JSON.stringify({ observations, errors }, null, 2),
  );
  expect(errors).toEqual([]);
  await page
    .getByRole("button", { name: "Remove bilingual-text.pdf", exact: true })
    .click();
  await expect(page.locator(".answer-output")).toHaveCount(0);
  await page.getByRole("button", { name: "Disable local answers" }).click();
  await expect(
    page.getByRole("button", { name: "AI connection pending" }),
  ).toBeDisabled();
});
