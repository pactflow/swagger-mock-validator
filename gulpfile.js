'use strict';

const gulp = require('gulp');

const bump = require('gulp-bump');
const clean = require('gulp-clean');
const conventionalChangelog = require('gulp-conventional-changelog');
const exec = require('./gulp/exec');
const git = require('gulp-git');
const fs = require('fs');
const jasmine = require('gulp-jasmine');
const minimist = require('minimist');
const runSequence = require('run-sequence');
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');

const getVersion = () => JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;

const options = minimist(process.argv.slice(2), {strings: ['type']});

const getBumpType = () => {
    const validTypes = ['major', 'minor', 'patch', 'prerelease'];

    if (validTypes.indexOf(options.type) === -1) {
        throw new Error(
            `You must specify a release type as one of (${validTypes.join(', ')}), e.g. "--type minor"`
        );
    }

    return options.type;
};

const tsProjectBuildOutput = ts.createProject('tsconfig.json', {noEmit: false});

gulp.task('bump-version', () =>
    gulp.src(['./package.json'])
        .pipe(bump({type: getBumpType()}))
        .pipe(gulp.dest('./'))
);

gulp.task('clean-build-output', () =>
    gulp.src('build-output', {force: true, read: false}).pipe(clean())
);

gulp.task('clean-dist', () =>
    gulp.src('dist', {force: true, read: false}).pipe(clean())
);

gulp.task('changelog', () =>
    gulp.src('CHANGELOG.md', {buffer: false})
        .pipe(conventionalChangelog({preset: 'angular'}))
        .pipe(gulp.dest('./'))
);

gulp.task('commit-changes', () =>
    gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(`chore: release ${getVersion()}`))
);

gulp.task('clean-copy-and-compile-build-output', (callback) => {
    runSequence(
        'clean-build-output',
        ['copy-build-output-package-json', 'compile-build-output'],
        callback
    )
});

gulp.task('compile-build-output', () => {
    const tsResult = tsProjectBuildOutput.src().pipe(tsProjectBuildOutput());
    return tsResult.js.pipe(gulp.dest('build-output'));
});

gulp.task('compile-dist', () => {
    const tsProjectDist = ts.createProject('tsconfig.json', {noEmit: false});
    const tsResult = gulp.src('lib/**/*.ts').pipe(tsProjectDist());
    return tsResult.js.pipe(gulp.dest('dist'));
});

gulp.task('copy-build-output-package-json', () =>
    gulp.src('package.json').pipe(gulp.dest('build-output'))
);

gulp.task('create-new-tag', (callback) => {
    const version = getVersion();

    git.tag(version, `Created Tag for version: ${version}`, callback);
});

gulp.task('lint', ['lint-typescript', 'lint-commits']);

gulp.task('lint-commits', () =>
    exec('./node_modules/.bin/conventional-changelog-lint --from=HEAD~20 --preset angular')
);

gulp.task('lint-typescript', () => tsProjectBuildOutput.src()
    .pipe(tslint({formatter: "verbose"}))
    .pipe(tslint.report())
);

gulp.task('npm-publish', () => exec('npm publish'));

gulp.task('push-changes', (callback) => {
    git.push('origin', 'master', {args: '--tags'}, callback);
});

gulp.task('release', (callback) => {
    runSequence(
        'default',
        'clean-dist',
        'compile-dist',
        'bump-version',
        'changelog',
        'commit-changes',
        'create-new-tag',
        'push-changes',
        'npm-publish',
        callback
    );
});

gulp.task('test', () => gulp.src('build-output/test/**/*.spec.js').pipe(jasmine()));

gulp.task('unit-test', () => gulp.src('build-output/test/unit/**/*.spec.js').pipe(jasmine()));

gulp.task('e2e-test', () => gulp.src('build-output/test/e2e/**/*.spec.js').pipe(jasmine()));

gulp.task('watch', ['clean-copy-and-compile-build-output'], () => {
    gulp.watch(['lib/**/*.ts', 'test/**/*.ts'], ['compile-build-output']);
    gulp.watch(['build-output/lib/**/*', 'build-output/test/unit/**/*'], ['unit-test']);
});

gulp.task('watch-e2e', () => {
    gulp.watch(['build-output/lib/**/*', 'build-output/test/e2e/**/*', 'test/e2e/**/*.json'], ['e2e-test']);
});

gulp.task('default', (callback) => {
    runSequence(
        ['clean-copy-and-compile-build-output', 'lint-commits'],
        ['lint-typescript', 'test'],
        callback
    );
});
