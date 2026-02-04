import { src, dest, series, watch } from "gulp";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import cssnano from "gulp-cssnano";
import { rollup } from "gulp-rollup-2";
import strip from "@rollup/plugin-strip";
import { minify } from "rollup-plugin-esbuild-minify";
import sourcemaps from "gulp-sourcemaps";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";

const sass = gulpSass(dartSass);

const styles = () =>
  src("src/style.scss")
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(cssnano())
    .pipe(sourcemaps.write("."))
    .pipe(dest("dist/"));

const copy = () => src("src/manifest.json").pipe(dest("dist/"));

const js = () =>
  src("src/index.js")
    .pipe(sourcemaps.init())
    .pipe(
      rollup({
        plugins: [
          nodeResolve(),
          commonjs(),
          ...(process.env.BUILD_MODE == "production"
            ? [strip(), minify()]
            : []),
        ],
        cache: true,
        output: {
          file: "index.js",
          format: "iife",
          sourcemap: true,
        },
      }),
    )
    .pipe(sourcemaps.write("."))
    .pipe(dest("dist"));

export const build = series(styles, copy, js);

export default () => watch("src/**/*", build);
