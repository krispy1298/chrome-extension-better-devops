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

export default defineConfig(({ command }) => ({
  build: {
    minify: command === 'build' ? 'terser' : false,
    watch: command === 'build' ? undefined : {
      include: ["src/**", "manifest.json", "package.json"],
    }
  },
  plugins: [
    webExtension({
      browser: process.env.TARGET || "chrome",
      manifest: generateManifest,
      watchFilePaths: ["src/**", "manifest.json", "package.json"],
      webExtConfig: {
        startUrl: process.env.START_URL?.split(',') || ["https://dev.azure.com/organization/project/_workitems/recentlyupdated/"],
      },
    }),
    ...(command === 'build' ? [strip(), minify()] : []),
  ],
}));
