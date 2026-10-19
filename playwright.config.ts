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
    {
      name: "chromium",
      testIgnore: ["**/rag-evaluation.spec.ts", "**/heldout-evaluation.spec.ts", "**/heldout-postfix-evaluation.spec.ts", "**/novel-word-evaluation.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      testIgnore: ["**/rag-evaluation.spec.ts", "**/heldout-evaluation.spec.ts", "**/heldout-postfix-evaluation.spec.ts", "**/novel-word-evaluation.spec.ts"],
      use: { ...devices["Pixel 7"] },
    },
    ...(process.env.HELDOUT_EVALUATION === "1"
      ? [{
          name: "heldout-evaluation",
          testMatch: "**/heldout-evaluation.spec.ts",
          use: { ...devices["Desktop Chrome"] },
        }]
      : []),
    ...(process.env.POSTFIX_EVALUATION === "1"
      ? [{
          name: "heldout-postfix-evaluation",
          testMatch: "**/heldout-postfix-evaluation.spec.ts",
          use: { ...devices["Desktop Chrome"] },
        }]
      : []),
    ...(process.env.NOVEL_WORD_EVALUATION === "1"
      ? [{
          name: "novel-word-evaluation",
          testMatch: "**/novel-word-evaluation.spec.ts",
          use: { ...devices["Desktop Chrome"] },
        }]
      : []),
    ...(process.env.RAG_EVALUATION === "1"
      ? [
          {
            name: "rag-evaluation",
            testMatch: "**/rag-evaluation.spec.ts",
            use: { ...devices["Desktop Chrome"] },
          },
        ]
      : []),
  ],
  webServer: {
    command: "npm run preview -- --port 4173",
    url: "http://127.0.0.1:4173/docanswerly-ai/",
    reuseExistingServer: !process.env.CI,
  },
  reporter: [["list"], ["html", { open: "never" }]],
});
