import { mkdir, readFile, writeFile, cp } from "node:fs/promises";
import { createHash } from "node:crypto";
const manifest = JSON.parse(
  await readFile(new URL("./model-manifest.json", import.meta.url)),
);
for (const file of manifest.files) {
  const path = `public/models/minilm/${file.path}`;
  let bytes;
  try {
    bytes = await readFile(path);
  } catch {}
  const valid = (b) =>
    b && createHash("sha256").update(b).digest("hex") === file.sha256;
  if (!valid(bytes)) {
    console.log(`Downloading pinned model asset: ${file.path}`);
    const r = await fetch(
      `https://huggingface.co/${manifest.id}/resolve/${manifest.revision}/${file.path}`,
      { signal: AbortSignal.timeout(180000) },
    );
    if (!r.ok) throw new Error(`Model download failed: ${r.status}`);
    bytes = Buffer.from(await r.arrayBuffer());
    if (!valid(bytes)) throw new Error(`Model checksum mismatch: ${file.path}`);
    await mkdir(path.substring(0, path.lastIndexOf("/")), { recursive: true });
    await writeFile(path, bytes);
  }
}
await mkdir("public/onnx", { recursive: true });
for (const file of [
  "ort-wasm-simd-threaded.wasm",
  "ort-wasm-simd-threaded.mjs",
  "ort-wasm-simd-threaded.jsep.mjs",
  "ort-wasm-simd-threaded.jsep.wasm",
]) {
  await cp(`node_modules/onnxruntime-web/dist/${file}`, `public/onnx/${file}`);
}
console.log("Pinned multilingual model and WASM assets ready.");
await mkdir("public/licenses", { recursive: true });
await cp(
  "node_modules/@huggingface/transformers/LICENSE",
  "public/licenses/transformers-Apache-2.0.txt",
);
await cp(
  "docs/licenses/onnxruntime-MIT.txt",
  "public/licenses/onnxruntime-MIT.txt",
);
