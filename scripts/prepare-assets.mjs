import { createHash } from "node:crypto";
import {
  mkdir,
  cp,
  copyFile,
  readdir,
  access,
  readFile,
} from "node:fs/promises";
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
const hashes = {
  eng: "45b4cb346724ac1774f1c36f42f182b887bcdb28ebe63e6fff90ac41f3fcff91",
  hin: "f3b6a0d320df38d886178cdd727b90dbf9df3db053adb32bd9cf73f0463cda07",
};
for (const lang of ["eng", "hin"]) {
  const dest = `${out}/ocr/lang/${lang}.traineddata.gz`;
  try {
    await access(dest);
  } catch {
    const url = `https://cdn.jsdelivr.net/npm/@tesseract.js-data/${lang}@1.0.0/4.0.0_best_int/${lang}.traineddata.gz`;
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok)
      throw new Error(`Language download failed: ${res.status} ${lang}`);
    const { writeFile } = await import("node:fs/promises");
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  }
  const actual = createHash("sha256")
    .update(await readFile(dest))
    .digest("hex");
  if (actual !== hashes[lang])
    throw new Error(`OCR language checksum mismatch: ${lang}`);
}
console.log("Local PDF + English/Hindi OCR assets prepared.");

await mkdir(`${out}/licenses`, { recursive: true });
for (const pkg of [
  "pdfjs-dist",
  "tesseract.js",
  "tesseract.js-core",
  "@fontsource/dm-sans",
  "@fontsource/manrope",
  "@fontsource/noto-sans-devanagari",
]) {
  const file = pkg === "tesseract.js" ? "LICENSE.md" : "LICENSE";
  await copyFile(
    `node_modules/${pkg}/${file}`,
    `${out}/licenses/${pkg.replaceAll("/", "-")}.txt`,
  );
}
