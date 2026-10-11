import { test, expect } from "vitest";
import {
  normalizeText,
  needsOcr,
  chunkDocument,
  keywordSearch,
  characterErrorRate,
} from "./text";
import { cosine, SemanticIndex } from "./rag";
import type { DocumentRecord } from "./types";
const hindi = "कृत्रिम बुद्धिमत्ता सूचना पुनर्प्राप्ति में सुधार करती है।";
const mixed = "भारत में Artificial Intelligence का उपयोग तेजी से बढ़ रहा है।";
const doc: DocumentRecord = {
  id: "a",
  name: "sample.pdf",
  size: 12,
  url: "blob:test",
  createdAt: "",
  pages: [
    {
      page: 1,
      text: "Artificial intelligence improves information retrieval.",
      method: "text",
    },
    { page: 2, text: hindi, method: "text" },
    { page: 3, text: mixed, method: "ocr" },
  ],
};
test("Hindi and mixed normalization preserve Unicode", () => {
  expect(normalizeText(hindi)).toBe(hindi.normalize("NFC"));
  expect(normalizeText(mixed)).toBe(mixed.normalize("NFC"));
});
test("control characters removed without dropping Hindi marks", () =>
  expect(normalizeText("  भारत\u0000\t में\r\nAI ")).toBe("भारत में\nAI"));
test("OCR detects blank, replacement and private-use text", () => {
  for (const s of ["", "�".repeat(30), "\ue001".repeat(30)])
    expect(needsOcr(s)).toBe(true);
  expect(needsOcr(hindi)).toBe(false);
});
test("chunks retain document and original page references", () => {
  const c = chunkDocument(doc, 30, 5);
  expect(c.some((c) => c.page === 3)).toBe(true);
  expect(
    c.every((c) => c.documentId === "a" && c.documentName === "sample.pdf"),
  ).toBe(true);
});
test("chunk overlap and no lost text", () => {
  const c = chunkDocument(
    { ...doc, pages: [{ page: 5, text: "abcdefghijklmnop", method: "text" }] },
    8,
    2,
  );
  expect(c.map((x) => x.text)).toEqual(["abcdefgh", "ghijklmn", "mnop"]);
  expect(c.every((x) => x.page === 5)).toBe(true);
});
test("invalid chunk size is rejected", () =>
  expect(() => chunkDocument(doc, 5, 5)).toThrow());
test("English keyword search returns source passage", () =>
  expect(keywordSearch(chunkDocument(doc), "retrieval")[0].chunk.page).toBe(1));
test("Hindi search preserves combining marks", () =>
  expect(keywordSearch(chunkDocument(doc), "बुद्धिमत्ता")[0].chunk.page).toBe(
    2,
  ));
test("mixed search matches English and Hindi terms", () =>
  expect(
    keywordSearch(chunkDocument(doc), "भारत Intelligence")[0].chunk.page,
  ).toBe(3));
test("empty and absent queries return no evidence", () => {
  expect(keywordSearch(chunkDocument(doc), "")).toEqual([]);
  expect(keywordSearch(chunkDocument(doc), "nonexistent")).toEqual([]);
});
test("removing a document removes its search evidence", () =>
  expect(keywordSearch([], "भारत")).toEqual([]));
test("CER uses Unicode code points and edit distance", () => {
  expect(characterErrorRate("abc", "abc")).toBe(0);
  expect(characterErrorRate("abc", "axc")).toBeCloseTo(1 / 3);
  expect(characterErrorRate(hindi, hindi)).toBe(0);
});
test("cosine handles zero vectors and rejects dimensional mismatch", () => {
  expect(cosine([1, 0], [1, 0])).toBe(1);
  expect(cosine([0, 0], [1, 0])).toBe(0);
  expect(() => cosine([1], [1, 2])).toThrow();
});
test("semantic adapter ranks supplied vectors (unit stub, not a model benchmark)", async () => {
  const i = new SemanticIndex({
    model: "test-only-stub",
    embed: async (t) => t.map((x) => (x.includes("भारत") ? [1, 0] : [0, 1])),
  });
  await i.build(chunkDocument(doc));
  expect((await i.search("भारत"))[0].chunk.page).toBe(3);
  i.clear();
  expect(await i.search("भारत")).toEqual([]);
});
