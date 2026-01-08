import { src, dest, series } from "gulp";
import scss from "gulp-scss";

const styles = src("src/style.scss").pipe(scss()).pipe(dest("dist/"));
const copy = src("src/manifest.json").pipe(dest("dist/"));

export const build = series(styles, copy);
