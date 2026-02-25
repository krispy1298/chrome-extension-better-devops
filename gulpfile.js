import { minify } from "rollup-plugin-esbuild-minify";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { rollup } from "gulp-rollup-2";
import { src, dest, series, watch } from "gulp";
import * as dartSass from "sass";
import commonjs from "@rollup/plugin-commonjs";
import cssnano from "gulp-cssnano";
import gulpReplace from "gulp-replace";
import gulpSass from "gulp-sass";
import replace from "@rollup/plugin-replace";
import sourcemaps from "gulp-sourcemaps";
import strip from "@rollup/plugin-strip";

const sass = gulpSass(dartSass);

const rollupSettings = ["inject", "popup", "options", "service-worker"].map(
  (file) => ({
    input: `src/${file}.js`,
    plugins: [
      nodeResolve(),
      commonjs(),
      ...(process.env.BUILD_MODE == "production" ? [strip(), minify()] : []),
    ],
    cache: true,
    output: {
      file: `${file}.js`,
      format: "iife",
      sourcemap: true,
    },
  }),
);

const styles = () =>
  src("src/*.scss")
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: ["node_modules"],
      }).on("error", sass.logError),
    )
    .pipe(cssnano())
    .pipe(sourcemaps.write("."))
    .pipe(dest("dist/"));

const copy = () =>
  src("src/{manifest.json,*.html}")
    .pipe(
      gulpReplace(
        "process.env.VERSION_NUMBER",
        process.env.VERSION_NUMBER || process.env.npm_package_version,
      ),
    )
    .pipe(
      gulpReplace("process.env.UPDATE_NOTES", process.env.UPDATE_NOTES || ""),
    )
    .pipe(dest("dist/"));

const js = () =>
  src("src/*.js")
    .pipe(sourcemaps.init())
    .pipe(rollup(rollupSettings))
    .pipe(sourcemaps.write("."))
    .pipe(dest("dist"));

export const build = series(styles, copy, js);

export default () => watch("src/**/*", build);
