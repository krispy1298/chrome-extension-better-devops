import { src, dest, series } from "gulp";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
import cssnano from "gulp-cssnano";
const sass = gulpSass(dartSass);

const styles = () =>
  src("src/style.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(cssnano())
    .pipe(dest("dist/"));

const copy = () => src("src/manifest.json").pipe(dest("dist/"));

export const build = series(styles, copy);
