'use strict';

var gulp        = require('gulp'),
    tsc         = require('gulp-typescript'),
    tslint      = require('gulp-tslint'),
    sourcemaps  = require('gulp-sourcemaps'),
    del         = require('del'),
    tsProject   = tsc.createProject({}),
    browserSync = require('browser-sync'),
    superstatic = require('superstatic'),
    KarmaServer = require('karma').Server,
    concat      = require('gulp-concat'),
    uglify      = require('gulp-uglify'),
    sass        = require('gulp-sass'),
    scsslint    = require('gulp-scss-lint'),
    minifycss   = require('gulp-minify-css');

var tsdConfig = require('./tsd.json');

var OUTPUT_PATH     = './dist',
    TEMP_PATH       = './tmp',
    TS_INPUT_PATH   = './src/**/*.ts',
    SASS_INPUT_PATH = './src/**/*.scss',
    LIBRARY_PATH    = './' + tsdConfig.bundle,
    ASSETS_PATH     = './assets/**/*';

var VENDOR_SOURCES = [
];

/**
 * Lints all TypeScript sources.
 */
gulp.task('ts-lint', function() {
  return gulp.src(TS_INPUT_PATH)
      .pipe(tslint())
      .pipe(tslint.report('prose'));
});

/**
 * Compiles all TypeScript sources and concatenates.
 */
gulp.task('ts', function() {
  var sources = [
    TS_INPUT_PATH,
    LIBRARY_PATH
  ];

  return gulp.src(sources)
      .pipe(sourcemaps.init())
      .pipe(tsc(tsProject))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(TEMP_PATH));
});

/**
 * Bundles all vendor and compiled JS sources.
 */
gulp.task('js-bundle', ['ts'], function() {
  var sources = VENDOR_SOURCES.concat([TEMP_PATH + '/**/*.js']);

  gulp.src(sources)
      .pipe(sourcemaps.init({loadMaps: true}))
      .pipe(concat('app.js'))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(OUTPUT_PATH));
});

/**
 * Lints all Sass sources.
 */
gulp.task('scss-lint', function() {
  return gulp.src(SASS_INPUT_PATH)
      .pipe(scsslint());
});

/**
 * Compiles all Sass sources and concatenates.
 */
gulp.task('sass', function() {
  return gulp.src(SASS_INPUT_PATH)
      .pipe(sourcemaps.init())
      .pipe(sass().on('error', sass.logError))
      .pipe(concat('app.css'))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(OUTPUT_PATH));
});

/**
 * Minifies output JS source.
 */
gulp.task('js-minify', ['js-bundle'], function() {
  return gulp.src(OUTPUT_PATH + '/app.js')
      .pipe(uglify())
      .pipe(gulp.dest(OUTPUT_PATH));
});

/**
 * Minifies output CSS source.
 */
gulp.task('css-minify', ['sass'], function() {
  return gulp.src(OUTPUT_PATH + '/app.css')
      .pipe(minifycss())
      .pipe(gulp.dest(OUTPUT_PATH));
});

/**
 * Copies all static assets to the output directory.
 */
gulp.task('copy-assets', function() {
  return gulp.src(ASSETS_PATH)
      .pipe(gulp.dest(OUTPUT_PATH));
});

/**
 * Builds and minifies all compiled source files for production.
 */
gulp.task('build', ['js-minify', 'css-minify']);

/**
 * Removes all generated output files.
 */
gulp.task('clean', function(done) {
  del([OUTPUT_PATH + '/**/*', TEMP_PATH + '/**/*'], done);
});

/**
 * Watches and recompiles all source files on change.
 */
gulp.task('watch', ['default'], function() {
  gulp.watch(TS_INPUT_PATH, ['ts-lint', 'js-bundle']);
  gulp.watch(SASS_INPUT_PATH, ['scss-lint', 'sass']);
  gulp.watch(ASSETS_PATH, ['copy-assets']);
});

/**
 * Watches all source files for changes and launches a web server.
 */
gulp.task('serve', ['watch'], function() {
  console.log('Starting server...');

  browserSync({
    port: 3000,
    files: [OUTPUT_PATH + '/**/*'],
    logFileChanges: false,
    logLevel: 'silent',
    notify: false,
    server: {
      baseDir: OUTPUT_PATH,
      middleware: superstatic({debug: false})
    }
  });
});

/**
 * Runs tests once and exits.
 */
gulp.task('test', function(done) {
  new KarmaServer({
    configFile: './karma.conf.js',
    singleRun: true
  }, done).start();
});

gulp.task('default', [
  'ts-lint',
  'js-bundle',
  'scss-lint',
  'sass',
  'copy-assets'
]);
