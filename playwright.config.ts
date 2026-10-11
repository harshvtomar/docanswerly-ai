import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "e2e",
  timeout: 120000,
  workers: 1,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4173/docanswerly-ai/",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/docanswerly-ai/",
    reuseExistingServer: !process.env.CI,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
