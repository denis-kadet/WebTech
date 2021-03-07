const { src, dest, watch, parallel, series } = require("gulp");
const rm = require("gulp-rm");
const sass = require("gulp-sass");
const sassGlob = require("gulp-sass-glob");
const concat = require("gulp-concat");
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;
const autoprefixer = require("autoprefixer");
const sourcemaps = require("gulp-sourcemaps");
const postcss = require("gulp-postcss");
const babel = require('gulp-babel');
const uglify = require('gulp-uglify-es').default;
const gcmq = require('gulp-group-css-media-queries');
const px2rem = require('gulp-smile-px2rem');
const cleanCSS = require('gulp-clean-css');
const svgo = require('gulp-svgo');
const svgSprite = require('gulp-svg-sprite');
const gulpif = require('gulp-if');

const env = process.env.NODE_ENV;

sass.compiler = require('node-sass');

function clean() {
    return src("dist/**/*", { read: false }).pipe(rm());
}

const files = [
    "node_modules/normalize.css/normalize.css",
    "./node_modules/swiper/swiper-bundle.css",
    "./node_modules/swiper/swiper-bundle.min.css",
    "./app/scss/main.scss",
]

function styles() {
    return src(files)
        .pipe(gulpif(env === "dev", sourcemaps.init()))
        .pipe(sassGlob())
        .pipe(sass( /*{outputStyle: 'compressed'}*/ ).on("error", sass.logError))
        .pipe(concat("style.min.css"))
        // .pipe(px2rem({
        //     dpr: 1,
        // }))
        .pipe(postcss([autoprefixer({ grid: "autoplace" })])) //options: https://www.npmjs.com/package/autoprefixer#prefixes
        .pipe(gulpif(env === "prod", gcmq()))
        .pipe(gulpif(env === "prod", cleanCSS()))
        .pipe(gulpif(env === "dev", sourcemaps.write()))
        .pipe(dest("./app/css"));
}

function copycss() {
    return src([
        "./app/css/style.min.css"
    ]).pipe(dest("./dist"));
}

function copyhtml() {
    return src([
        "./app/index.html"
    ]).pipe(dest("./dist"));
}

function copyfonts() {
    return src([
        "./app/fonts/**/*"
    ]).pipe(dest("./dist/fonts"));
}

function copyimg() {
    return src(["./app/images/**/*", "!app/images/icons"]).pipe(dest("./dist/images"))
}


const libs = [
    // './node_modules/jquery/dist/jquery.js'
    './node_modules/swiper/swiper-bundle.js',
    './node_modules/swiper/swiper-bundle.min.js',
    './app/js/main.js',
]

function script() {
    return src(libs)
        .pipe(gulpif(env === "dev", sourcemaps.init()))
        .pipe(concat('main.min.js'))
        .pipe(gulpif(env === "prod", babel({
            presets: ['@babel/env']
        })))
        .pipe(gulpif(env === "prod", uglify()))
        .pipe(gulpif(env === "dev", sourcemaps.write()))
        .pipe(dest('./dist'))
}

function icon() {
    return src('./app/images/icons/*.svg')
        .pipe(svgo({
            plugins: [{
                removeAttrs: {
                    attrs: '(fill|stroke|style|width|height|data.*)'
                }
            }]
        }))
        .pipe(svgSprite({
            mode: {
                symbol: {
                    sprite: '../sprite.svg'
                }
            }
        }))
        .pipe(dest('./dist/images/icons'));
}

function stream() {
    watch(["./app/**/*.scss"], series(styles, copycss, copyhtml)).on("change", browserSync.reload);
    watch(["./app/*.html"], copyhtml).on("change", browserSync.reload);
    watch(['./app/js/*.js'], script).on("change", browserSync.reload);
    watch(['./app/images/icons/*.svg'], icon).on("change", browserSync.reload);

}

function server() {
    browserSync.init({
        server: {
            baseDir: "./dist",
        },
        open: false,
    });
}


exports.copycss = copycss;
exports.copyhtml = copyhtml;
exports.styles = styles;
exports.clean = clean;
exports.stream = stream;
exports.server = server;
exports.script = script;
exports.icon = icon;
exports.copyfonts = copyfonts;
exports.copyimg = copyimg;


exports.default = series(clean, copyhtml, script, styles, copycss, copyfonts, copyimg, icon, parallel(stream, server));
exports.build = series(clean, copyhtml, script, styles, copycss, copyfonts, copyimg, icon);