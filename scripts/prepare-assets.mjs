import { mkdir, cp, copyFile, readdir, access } from "node:fs/promises";
const out = "public";
await mkdir(`${out}/ocr/core`, { recursive: true });
await mkdir(`${out}/ocr/lang`, { recursive: true });
await copyFile(
  "node_modules/tesseract.js/dist/worker.min.js",
  `${out}/ocr/worker.min.js`,
);
for (const file of await readdir("node_modules/tesseract.js-core"))
  if (/\.(wasm|js)$/.test(file))
    await copyFile(
      `node_modules/tesseract.js-core/${file}`,
      `${out}/ocr/core/${file}`,
    );
for (const dir of ["cmaps", "standard_fonts", "wasm"])
  await cp(`node_modules/pdfjs-dist/${dir}`, `${out}/pdf/${dir}`, {
    recursive: true,
  });
for (const lang of ["eng", "hin"]) {
  const dest = `${out}/ocr/lang/${lang}.traineddata.gz`;
  try {
    await access(dest);
  } catch {
    const url = `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}@1.0.0/4.0.0_best_int/${lang}.traineddata.gz`;
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Language download failed: ${res.status} ${lang}`);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
}
console.log("Local PDF + English/Hindi OCR assets prepared.");
