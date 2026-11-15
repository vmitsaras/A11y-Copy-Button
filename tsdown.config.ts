import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/docs.ts", "src/adapters/table-markdown.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  platform: "neutral",
  outDir: "dist",
  clean: false
});
