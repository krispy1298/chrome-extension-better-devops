import { minify } from "rollup-plugin-esbuild-minify";
import strip from "@rollup/plugin-strip";
import { defineConfig } from "vite";
import webExtension, { readJsonFile } from "vite-plugin-web-extension";
import dotenv from "dotenv";
import replace from "@rollup/plugin-replace";
import markdown from "@wcj/markdown-to-html";

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
    minify: command === "build" ? "terser" : false,
    watch:
      command === "build"
        ? undefined
        : {
            include: ["src/**", "manifest.json", "package.json"],
          },
  },
  plugins: [
    replace({
      values: {
        "process.env.VERSION_NUMBER":
          process.env.VERSION_NUMBER || process.env.npm_package_version,
        "process.env.UPDATE_NOTES": markdown(process.env.UPDATE_NOTES || ""),
      },
    }),
    webExtension({
      browser: process.env.TARGET || "chrome",
      manifest: generateManifest,
      watchFilePaths: ["src/**", "manifest.json", "package.json"],
      webExtConfig: {
        startUrl: process.env.START_URL?.split(",") || [
          "https://dev.azure.com/organization/project/_workitems/recentlyupdated/",
        ],
      },
    }),
    ...(command === "build" ? [strip(), minify()] : []),
  ],
}));
