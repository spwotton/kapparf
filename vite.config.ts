import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

function externalizeOnnxWasm(): Plugin {
  const cdnBase =
    "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0-dev.20260416-b7804b056c/dist/";
  return {
    name: "externalize-onnx-wasm",
    enforce: "pre",
    transform(code, id) {
      const isOnnx = id.includes("onnxruntime-web");
      const isTransformers = id.includes("@huggingface/transformers");
      if ((isOnnx || isTransformers) && code.includes("ort-wasm")) {
        return {
          code: code.replace(
            /new URL\("(ort-wasm[^"]+\.wasm)"[^)]*\)\.href/g,
            `"${cdnBase}$1"`,
          ),
          map: null,
        };
      }
    },
    async writeBundle() {
      const { readdirSync, unlinkSync, existsSync } = await import("fs");
      const { resolve } = await import("path");
      const assetsDir = resolve(
        path.dirname(new URL(import.meta.url).pathname),
        "dist/public/assets",
      );
      if (existsSync(assetsDir)) {
        for (const file of readdirSync(assetsDir)) {
          if (file.endsWith(".wasm") && file.startsWith("ort-wasm")) {
            unlinkSync(resolve(assetsDir, file));
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    externalizeOnnxWasm(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
