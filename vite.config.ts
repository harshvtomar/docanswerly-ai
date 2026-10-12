import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "/docanswerly-ai/",
  plugins: [react()],
  build:
    process.env.RAG_EVALUATION === "1"
      ? {
          rollupOptions: {
            input: { app: "index.html", evaluation: "evaluation.html" },
          },
        }
      : undefined,
});
