import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const revision = '50968a4468ef4233ed78cd7c3de230dd1d61a56b';
const file = 'Qwen3-0.6B-Q4_K_M.gguf';
const sha = 'ac2d97712095a558e31573f62f466a3f9d93990898b0ec79d7c974c1780d524a';
await mkdir('public/generation', {recursive:true});
const path = `public/generation/${file}`;
const hash = b => createHash('sha256').update(b).digest('hex');
let existing; try {existing = await readFile(path);} catch {}
if (!existing || hash(existing) !== sha) {
  console.log('Downloading pinned optional local generation model (397 MB)…');
  const response = await fetch(`https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/${revision}/${file}`, {signal:AbortSignal.timeout(240000)});
  if (!response.ok) throw Error(`Model download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length !== 396705472 || hash(bytes) !== sha) throw Error('Generation model integrity check failed');
  await writeFile(path, bytes);
}
await copyFile('node_modules/@wllama/wllama/esm/wasm/wllama.wasm', 'public/generation/wllama.wasm');
await copyFile('node_modules/@wllama/wllama/LICENCE', 'public/generation/WLLAMA-LICENSE.txt');
console.log('Pinned generation model and WASM ready.');
await copyFile('docs/licenses/Qwen3-Apache-2.0.txt', 'public/generation/QWEN-LICENSE.txt');
