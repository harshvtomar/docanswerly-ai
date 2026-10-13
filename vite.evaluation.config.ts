import { defineConfig } from "vite";

// Build independently so the React entry cannot become an evaluation dependency.
export default defineConfig({
  base: "/docanswerly-ai/",
  build: {
    emptyOutDir: false,
    rollupOptions: { input: "evaluation.html" },
  },
});
