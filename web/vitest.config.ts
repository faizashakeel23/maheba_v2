import path from "node:path";
import { defineConfig } from "vitest/config";

// Mirrors tsconfig "@/*" so lib files (which import "@/types") load in tests.
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { environment: "node" },
});
