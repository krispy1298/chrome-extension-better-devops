import { minify } from "rollup-plugin-esbuild-minify";
import strip from "@rollup/plugin-strip";
import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import dotenv from "dotenv";

dotenv.config();

function generateManifest() {
  const manifest = readJsonFile("manifest.json");
  const pkg = readJsonFile("package.json");
  return {
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
    ...manifest,
  };
}

export default defineConfig({
  build: {
    minify: process.env.CI ? 'terser' : false,
  },
  plugins: [
    webExtension({
      browser: process.env.TARGET || "chrome",
      manifest: generateManifest,
      watchFilePaths: ["package.json", "manifest.json"],
      webExtConfig: {
        startUrl: process.env.START_URL?.split(',') || ["https://dev.azure.com/organization/project/_workitems/recentlyupdated/"],
      },
    }),
    ...(process.env.BUILD_MODE == "production" ? [strip(), minify()] : []),
  ],
});
