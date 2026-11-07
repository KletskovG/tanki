import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL("./src", import.meta.url)),
  base: "./",
  publicDir: fileURLToPath(new URL("./.generated/public", import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL("./dist", import.meta.url)),
    emptyOutDir: true,
    assetsDir: "",
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    rolldownOptions: {
      output: {
        entryFileNames: "index.js",
        chunkFileNames: "[name]-[hash].js",
        assetFileNames: (asset) =>
          asset.names.some((name) => name.endsWith(".css"))
            ? "index.css"
            : "[name][extname]",
        codeSplitting: false,
      },
    },
  },
});
