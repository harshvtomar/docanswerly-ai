import { Wllama } from "@wllama/wllama";
import type { InferenceClient } from "./answers";
import { parseGenerationModelConfig } from "./generation-model-config";
export const GENERATION_MODEL = "Qwen3-0.6B Q4_K_M (Unsloth)";
const quiet = { debug() {}, log() {}, warn() {}, error() {} };
export class LocalGeneration implements InferenceClient {
  private runtime: Wllama;
  private busy = false;
  loadedModelDescription = GENERATION_MODEL;
  constructor(base: string) {
    this.runtime = new Wllama(
      { default: `${base}generation/wllama.wasm` },
      { suppressNativeLog: true, logger: quiet },
    );
    // No unexpected third-party compatibility downloads on Safari/Firefox.
    this.runtime.setCompat(null);
  }
  async load(
    base: string,
    progress: (text: string) => void,
    signal: AbortSignal,
  ) {
    // Only a build-time packaged, same-origin model is loadable. This lets
    // a separately evaluated merged+quantized LoRA GGUF replace the baseline
    // without a backend, arbitrary URLs, hidden uploads or tokenizer changes.
    const manifestResponse = await fetch(`${base}generation/active-model.json`, {
      signal,
      cache: "no-store",
    });
    if (!manifestResponse.ok)
      throw Error("The local generation model manifest is missing.");
    const model = parseGenerationModelConfig(await manifestResponse.json());
    // The manifest is validated by the packaging script, which checks the full
    // SHA-256. Browser file names are content-versioned for cache correctness.
    await this.runtime.loadModelFromUrl(
      `${base}generation/${model.file}`,
      {
        n_ctx: 4096,
        n_batch: 128,
        n_ubatch: 128,
        n_threads: 1,
        n_gpu_layers: 0,
        seed: 42,
        reasoning: false,
        default_template_kwargs: { enable_thinking: false },
        useCache: true,
        signal,
        progressCallback: ({ loaded, total }) =>
          progress(
            `Downloading local answer model · ${Math.round((100 * loaded) / Math.max(total, 1))}%`,
          ),
      },
    );
    if (signal.aborted) {
      await this.dispose();
      throw new DOMException("Cancelled", "AbortError");
    }
    this.loadedModelDescription = model.id + (model.kind === "approved-finetune" ? " · separately reviewed fine-tune" : " · pinned baseline");
  }
  async generate(
    messages: Parameters<InferenceClient["generate"]>[0],
    schema: object,
    signal?: AbortSignal,
  ) {
    if (this.busy) throw Error("An answer is already being generated.");
    this.busy = true;
    try {
      const result = await this.runtime.createChatCompletion({
        messages,
        temperature: 0,
        seed: 42,
        max_tokens: 384,
        abortSignal: signal,
        chat_template_kwargs: { enable_thinking: false },
        response_format: {
          type: "json_schema",
          json_schema: { name: "document_answer", schema, strict: true },
        },
        tools: [],
        tool_choice: "none",
      });
      const choice = result.choices[0];
      if (choice?.finish_reason !== "stop" || !choice.message.content)
        throw Error(
          "The model could not finish a structured answer. Try a shorter question.",
        );
      return choice.message.content;
    } finally {
      this.busy = false;
    }
  }
  async dispose() {
    await this.runtime.exit();
  }
}
