# Deployment

Repository: https://github.com/harshvtomar/docanswerly-ai
Public URL: https://harshvtomar.github.io/docanswerly-ai/
Branch: main. GitHub Pages Settings → Source: GitHub Actions.

`.github/workflows/deploy.yml` installs from the lockfile on Node 24, runs unit
PDF/OCR checks and actual multilingual retrieval evaluation, builds, installs Chromium, runs desktop/mobile browser tests,
uploads browser evidence, then publishes with official configure-pages,
upload-pages-artifact and deploy-pages actions. Failed checks prevent deployment.
Repository permissions: contents read, pages write, id-token write. Deploy job
uses the github-pages environment. The initial and feature deployments succeeded.

Vite base must stay `/docanswerly-ai/`. PDF worker is a Vite asset URL; supporting
PDF assets and OCR paths use `import.meta.env.BASE_URL`. `prepare-assets.mjs`
copies package workers/WebAssembly and downloads versioned eng/hin traineddata
with checksum checks. Fonts are bundled. CI fails if required assets are missing.
The full static artifact is about 237 MiB including model/tokenizer and multiple
WASM variants; browsers fetch only the needed engine. Semantic opt-in downloads
about 160 MB on first use; model/tokenizer total about 135 MB. Public weights are
not committed in Git. scripts/prepare-model.mjs verifies the pinned checksums.
First OCR use downloads several MB. Model data may be cached by browser storage;
changing model revision must also change the runtime URL/cache namespace.

## Reproduce / deploy

1. Clone this repository. Use `npm ci` on Node 24.
2. Run `npm test`, `npm run test:pdf`, `npm run build`.
3. Install Chromium for Playwright and run `npm run test:e2e` where allowed.
4. Commit/push a fast-forward update to main. Never force-push.
5. Inspect Actions, both build and deploy jobs, then open the public URL.
6. Upload the sample, inspect Hindi text, run force OCR, view the original page,
   search a Hindi word and remove the document. Build success alone is insufficient.

## Access used in Session 1

The user authorized creation and public publication. The authenticated GitHub
browser created the repository and selected Actions as Pages source. Shell git
push failed with `could not read Username`; authenticated connector Git tree,
commit and non-force ref updates succeeded. No personal tokens were requested,
written to disk or included in the repository.

## Future backend

No external backend is deployed. Do not point a client to a privileged model API
or put secrets in frontend environment variables. Evaluate current free-tier terms,
runtime compatibility and model access only when selecting a real provider. No
paid service or inference account was activated. Require schema validation, request
limits, origin policy, abuse controls, timeouts and server-side secrets. Do not
store documents remotely until authentication and ownership checks exist.

## Session 3A recovery

Use `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm ci` on Node 24. Build now includes
pinned optional local Qwen3/Wllama assets (~405 MB additional), without backend
credentials. Production and evaluation are separate Vite builds, in that order.
Evaluation HTML and `assets/evaluation-*.js` are removed before Pages upload.
Run 38331700774 completed inference but failed its request assertion, so did not
deploy. All regression gates and the full evaluation remain enabled for the fix.
