'use strict';

const gulp = require('gulp');

const bump = require('gulp-bump');
const conventionalChangelog = require('gulp-conventional-changelog');
const exec = require('./gulp/exec');
const eslint = require('gulp-eslint');
const git = require('gulp-git');
const fs = require('fs');
const jasmine = require('gulp-jasmine');
const minimist = require('minimist');
const runSequence = require('run-sequence');

// eslint-disable-next-line no-sync
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

gulp.task('changelog', () =>
    gulp.src('CHANGELOG.md', {buffer: false})
        .pipe(conventionalChangelog({preset: 'angular'}))
        .pipe(gulp.dest('./'))
);

gulp.task('bump-version', () =>
    gulp.src(['./package.json'])
        .pipe(bump({type: getBumpType()}))
        .pipe(gulp.dest('./'))
);

gulp.task('commit-changes', () =>
    gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(`chore: release ${getVersion()}`))
);

gulp.task('create-new-tag', (callback) => {
    const version = getVersion();

    git.tag(version, `Created Tag for version: ${version}`, callback);
});

gulp.task('lint', ['lint-javascript', 'lint-commits']);

gulp.task('lint-commits', () =>
    exec('./node_modules/.bin/conventional-changelog-lint --from=HEAD~40 --preset angular')
);

gulp.task('lint-javascript', () =>
    gulp.src(['gulpfile.js', 'lib/**/*.js', 'test/**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError())
);

gulp.task('npm-link', () => exec('npm link'));

gulp.task('npm-publish', () => exec('npm publish'));

gulp.task('push-changes', (callback) => {
    git.push('origin', 'master', {args: '--tags'}, callback);
});

gulp.task('release', () => {
    runSequence(
        'default',
        'bump-version',
        'changelog',
        'commit-changes',
        'create-new-tag',
        'push-changes',
        'npm-publish'
    );
});

gulp.task('test', () => gulp.src('test/**/*.spec.js').pipe(jasmine()));

gulp.task('unit-test', () => gulp.src('test/unit/**/*.spec.js').pipe(jasmine()));

gulp.task('e2e-test', () => gulp.src('test/e2e/**/*.spec.js').pipe(jasmine()));

gulp.task('watch', () => {
    gulp.watch(['lib/**/*', 'test/unit/**/*'], ['unit-test']);
});

gulp.task('watch-e2e', ['npm-link'], () => {
    gulp.watch(['lib/**/*', 'test/e2e/**/*'], ['e2e-test']);
});

gulp.task('default', (callback) => {
    runSequence(
        'npm-link',
        ['lint', 'test'],
        callback
    );
});
