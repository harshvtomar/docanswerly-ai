import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import { createCanvas } from "@napi-rs/canvas";
const refs = JSON.parse(
  await readFile("public/fixtures/references.json", "utf8"),
);
const norm = (s) => s.normalize("NFC").replace(/\s+/g, " ").trim();
function cer(a, b) {
  a = [...norm(a)];
  b = [...norm(b)];
  let r = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let n = [i];
    for (let j = 1; j <= b.length; j++)
      n[j] = Math.min(
        n[j - 1] + 1,
        r[j] + 1,
        r[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    r = n;
  }
  return r[b.length] / Math.max(a.length, 1);
}
const results = [];
let worker;
try {
  for (const [language, reference] of Object.entries(refs))
    for (const kind of ["text", "scan"]) {
      const pdf = await getDocument({
        data: new Uint8Array(
          await readFile(`public/fixtures/${language}-${kind}.pdf`),
        ),
        standardFontDataUrl:
          resolve("node_modules/pdfjs-dist/standard_fonts") + "/",
      }).promise;
      try {
        const p = await pdf.getPage(1);
        const content = await p.getTextContent();
        const embedded = norm(content.items.map((i) => i.str ?? "").join(""));
        if (kind === "scan" && embedded)
          throw new Error("Scan unexpectedly contains embedded text");
        let actual = embedded;
        if (kind === "scan") {
          worker ??= await createWorker(["eng", "hin"], 1, {
            langPath: resolve("public/ocr/lang"),
            cacheMethod: "none",
          });
          const viewport = p.getViewport({ scale: 2 });
          const canvas = createCanvas(
            Math.ceil(viewport.width),
            Math.ceil(viewport.height),
          );
          await p.render({ canvasContext: canvas.getContext("2d"), viewport })
            .promise;
          actual = (await worker.recognize(canvas.toBuffer("image/png"))).data
            .text;
        }
        const errorRate = cer(reference, actual);
        results.push({
          language,
          kind,
          page: 1,
          reference,
          actual: norm(actual),
          characterErrorRate: errorRate,
          passed: kind === "text" ? errorRate === 0 : errorRate <= 0.15,
        });
      } finally {
        await pdf.loadingTask.destroy();
      }
    }
  let invalidRejected = false;
  try {
    await getDocument({
      data: new Uint8Array(await readFile("public/fixtures/invalid.pdf")),
    }).promise;
  } catch {
    invalidRejected = true;
  }
  results.push({ test: "invalid PDF rejected", passed: invalidRejected });
} finally {
  await worker?.terminate();
}
await mkdir("docs", { recursive: true });
await writeFile(
  "docs/evaluation.json",
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      note: "Synthetic single-line fixtures; CER is NFC-normalized Unicode code-point Levenshtein distance after whitespace collapse. Not a real-world accuracy claim.",
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(results, null, 2));
if (results.some((r) => !r.passed)) process.exitCode = 1;
