import type { Chunk, DocumentRecord, SearchHit } from "./types";
export function normalizeText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "")
    .replace(/[\t \u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}
export function needsOcr(text: string): boolean {
  const chars = [...text.replace(/\s/g, "")];
  return (
    chars.length < 12 ||
    chars.filter((c) => c === "�" || /[\p{Co}]/u.test(c)).length /
      Math.max(chars.length, 1) >
      0.03 ||
    !/[\p{L}\p{N}]/u.test(text)
  );
}
export function chunkDocument(
  doc: DocumentRecord,
  size = 700,
  overlap = 100,
): Chunk[] {
  if (size < 1 || overlap < 0 || overlap >= size)
    throw new Error("Invalid chunk configuration");
  return doc.pages.flatMap((p) => {
    const result: Chunk[] = [];
    const points = [...p.text];
    for (let start = 0; start < points.length; start += size - overlap) {
      const end = Math.min(points.length, start + size);
      result.push({
        id: `${doc.id}:${p.page}:${start}`,
        documentId: doc.id,
        documentName: doc.name,
        page: p.page,
        text: points.slice(start, end).join(""),
        start,
        end,
      });
      if (end === points.length) break;
    }
    return result;
  });
}
export function tokens(s: string): string[] {
  return (
    normalizeText(s)
      .toLocaleLowerCase()
      .match(/[\p{L}\p{M}\p{N}]+/gu) ?? []
  );
}
export function keywordSearch(
  chunks: Chunk[],
  query: string,
  limit = 12,
): SearchHit[] {
  const terms = [...new Set(tokens(query))];
  if (!terms.length) return [];
  return chunks
    .map((chunk) => {
      const words = tokens(chunk.text);
      const counts = new Map<string, number>();
      words.forEach((w) => counts.set(w, (counts.get(w) ?? 0) + 1));
      const score = terms.reduce(
        (n, t) => n + Math.log1p(counts.get(t) ?? 0),
        0,
      );
      return { chunk, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
export function characterErrorRate(reference: string, actual: string): number {
  const a = [...normalizeText(reference)],
    b = [...normalizeText(actual)];
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++)
      next[j] = Math.min(
        next[j - 1] + 1,
        row[j] + 1,
        row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    row = next;
  }
  return row[b.length] / Math.max(a.length, 1);
}
