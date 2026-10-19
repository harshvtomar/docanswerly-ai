import { mkdir, readFile, writeFile, copyFile, stat, open } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { basename, resolve } from "node:path";
const revision = "50968a4468ef4233ed78cd7c3de230dd1d61a56b";
const baselineFile = "Qwen3-0.6B-Q4_K_M.gguf";
const baselineSha = "ac2d97712095a558e31573f62f466a3f9d93990898b0ec79d7c974c1780d524a";
const baselineBytes = 396705472;
const baseModel = "Qwen/Qwen3-0.6B";
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
await mkdir("public/generation", { recursive: true });

async function fileSha256(path) {
  const digest = createHash("sha256");
  for await (const bytes of createReadStream(path)) digest.update(bytes);
  return digest.digest("hex");
}

// This opt-in import is for a separately reviewed and approved, merged, GGUF
// fine-tune. Raw LoRA adapters or arbitrary remote URLs are never browser models.
const modelFile = process.env.DOCANSWERLY_APPROVED_GGUF_FILE;
const approvalFile = process.env.DOCANSWERLY_APPROVAL_JSON;
let manifest;
if (Boolean(modelFile) !== Boolean(approvalFile))
  throw Error("Fine-tuned GGUF and external release approval must be supplied together.");
if (!modelFile) {
  const path = `public/generation/${baselineFile}`;
  let good = false;
  try {
    const info = await stat(path);
    good = info.size === baselineBytes && await fileSha256(path) === baselineSha;
  } catch { /* download expected on clean CI */ }
  if (!good) {
    console.log("Downloading pinned original Qwen3-0.6B GGUF (~397 MB)…");
    const response = await fetch(
      `https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/${revision}/${baselineFile}`,
      { signal: AbortSignal.timeout(240000) },
    );
    if (!response.ok) throw Error(`Original model download failed: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== baselineBytes || hash(bytes) !== baselineSha)
      throw Error("Original generation model integrity check failed.");
    await writeFile(path, bytes);
  }
  manifest = {
    id: "qwen3-0.6b-baseline",
    baseModel, kind: "baseline", file: baselineFile,
    bytes: baselineBytes, sha256: baselineSha,
    review: "original pinned baseline",
  };
} else {
  const approved = JSON.parse(await readFile(approvalFile, "utf8"));
  // File and attestations are private build inputs; never auto-approve on
  // plausible filenames, synthetic test counts or model training loss.
  if (approved.schemaVersion !== 1 || approved.approvedForPublicRelease !== true ||
      approved.independentHumanReviewCompleted !== true ||
      approved.modelBase !== baseModel ||
      approved.tokenizerUnmodified !== true ||
      approved.format !== "GGUF" ||
      approved.comparisonPassed !== true ||
      approved.safetyRegressionPassed !== true ||
      typeof approved.reviewer !== "string" || !approved.reviewer.trim() ||
      typeof approved.reviewDate !== "string" ||
      !/^20\d\d-\d\d-\d\d$/.test(approved.reviewDate) ||
      typeof approved.evaluationRunUrl !== "string" ||
      !/^https:\/\/github\.com\/[^/]+\/[^/]+\/actions\/runs\/\d+$/.test(approved.evaluationRunUrl) ||
      typeof approved.sha256 !== "string" || !/^[0-9a-f]{64}$/.test(approved.sha256) ||
      typeof approved.modelId !== "string" ||
      !/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(approved.modelId))
    throw Error("Fine-tuned model has no valid independent review and compatibility attestation.");
  const info = await stat(modelFile);
  if (info.size < 1024 || info.size > 900_000_000)
    throw Error("Merged GGUF is outside safe browser size range.");
  const sha = await fileSha256(modelFile);
  if (sha !== approved.sha256) throw Error("Fine-tuned GGUF SHA-256 does not match the approval.");
  const file = `docanswerly-${sha.slice(0,20)}.gguf`;
  await copyFile(modelFile, `public/generation/${file}`);
  manifest = {
    id: approved.modelId, baseModel, kind: "approved-finetune", file,
    bytes: info.size, sha256: sha,
    review: `independent review ${approved.reviewDate}`,
  };
}
await writeFile("public/generation/active-model.json", JSON.stringify(manifest, null, 2) + "\n");
await copyFile("node_modules/@wllama/wllama/esm/wasm/wllama.wasm", "public/generation/wllama.wasm");
await copyFile("node_modules/@wllama/wllama/LICENCE", "public/generation/WLLAMA-LICENSE.txt");
await copyFile("docs/licenses/Qwen3-Apache-2.0.txt", "public/generation/QWEN-LICENSE.txt");
console.log(`Browser model manifest ready: ${manifest.id}, ${manifest.bytes} bytes, ${manifest.kind}.`);
