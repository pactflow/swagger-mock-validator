'use strict';

const gulp = require('gulp');
const eslint = require('gulp-eslint');

gulp.task('default', () =>
    gulp.src(['gulpfile.js', 'src/**/*.js', 'test/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);
