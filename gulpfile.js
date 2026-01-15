import { src, dest, series } from "gulp";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import cssnano from "gulp-cssnano";
import { rollup } from "gulp-rollup-2";

const sass = gulpSass(dartSass);

const styles = () =>
  src("src/style.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(cssnano())
    .pipe(dest("dist/"));

const copy = () => src("src/manifest.json").pipe(dest("dist/"));

const js = () =>
  src("src/index.js")
    .pipe(
      rollup({
        output: {
          file: "index.js",
          format: "iife",
          sourcemap: true,
        },
      })
    )
    .pipe(dest("dist"));

export const build = series(styles, copy, js);
