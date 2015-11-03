'use strict';

var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var gutil = require('gulp-util');

var browserifyConfig = {
  entries: './src/isologger.js',
  debug: true,
  standalone: 'IsoLogger'
};

gulp.task('uglified', function () {
  return browserify(browserifyConfig)
    .bundle()
    .pipe(source('isologger.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js/'));
});

gulp.task('non-uglified', function () {
  return browserify(browserifyConfig)
    .bundle()
    .pipe(source('isologger.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .on('error', gutil.log)
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./dist/js/'))
});

gulp.task('default', ['uglified', 'non-uglified']);
