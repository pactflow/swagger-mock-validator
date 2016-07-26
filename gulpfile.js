'use strict';

const gulp = require('gulp');

const exec = require('./gulp/exec');
const eslint = require('gulp-eslint');
const jasmine = require('gulp-jasmine');
const runSequence = require('run-sequence');

const paths = {
    all: ['gulpfile.js', 'lib/**/*.js', 'test/**/*.js'],
    tests: ['test/e2e/**/*.spec.js']
};

gulp.task('lint', () =>
    gulp.src(['gulpfile.js', 'lib/**/*.js', 'test/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);

gulp.task('npm-link', () =>
    exec('npm link')
);

gulp.task('test', () =>
    gulp.src('test/e2e/**/*.spec.js').pipe(jasmine())
);

gulp.task('watch', ['npm-link'], () => {
    gulp.watch(paths.all, ['test']);
});

gulp.task('default', (callback) => {
    runSequence(
        'npm-link',
        ['lint', 'test'],
        callback
    );
});
