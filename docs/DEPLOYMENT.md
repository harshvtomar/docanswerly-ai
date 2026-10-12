# Deployment

Repository: https://github.com/harshvtomar/docanswerly-ai
Public URL: https://harshvtomar.github.io/docanswerly-ai/
Branch: main. GitHub Pages Settings → Source: GitHub Actions.

`.github/workflows/deploy.yml` installs from the lockfile on Node 24, runs unit
and PDF/OCR checks, builds, installs Chromium, runs desktop/mobile browser tests,
uploads browser evidence, then publishes with official configure-pages,
upload-pages-artifact and deploy-pages actions. Failed checks prevent deployment.
Repository permissions: contents read, pages write, id-token write. Deploy job
uses the github-pages environment. The initial and feature deployments succeeded.

Vite base must stay `/docanswerly-ai/`. PDF worker is a Vite asset URL; supporting
PDF assets and OCR paths use `import.meta.env.BASE_URL`. `prepare-assets.mjs`
copies package workers/WebAssembly and downloads versioned eng/hin traineddata
with checksum checks. Fonts are bundled. CI fails if required assets are missing.
The full static artifact is about 56 MB, mostly OCR/PDF engine resources; browsers
fetch only the engine variant they need. First OCR use downloads several MB.

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
