import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/cmd/worker.ts"],
  bundle: true,
  minify: true,
  outfile: "dist/worker.js",
  sourcemap: false,
  define: {
    "import.meta.vitest": "undefined",
  },
  target: "es2021",
  format: "esm",
  mainFields: ["browser", "module", "main"],
  platform: "node",
  charset: "utf8",
});
