'use strict';

const gulp = require('gulp');

const bump = require('gulp-bump');
const clean = require('gulp-clean');
const colors = require('ansi-colors');
const conventionalChangelog = require('gulp-conventional-changelog');
const exec = require('child_process').exec;
const filter = require('gulp-filter');
const git = require('gulp-git');
const fs = require('fs');
const jasmine = require('gulp-jasmine');
const minimist = require('minimist');
const ts = require('gulp-typescript');
const tslint = require('gulp-tslint');

const options = minimist(process.argv.slice(2), {strings: ['type']});
const tsProjectBuildOutput = ts.createProject('tsconfig.json', {noEmit: false});
const specHelperPath = 'build-output/test/support/spec-helper.js';
const tests = 'build-output/test/**/*.spec.js';
const unitTests = 'build-output/test/unit/**/*.spec.js';
const e2eTests = 'build-output/test/e2e/**/*.spec.js';

const utilities = {
    compileBuildOutput: () => {
        const tsResult = tsProjectBuildOutput.src().pipe(tsProjectBuildOutput());
        return tsResult.js.pipe(gulp.dest('build-output'));
    },
    exec: (command) => {
        return new Promise((resolve, reject) => {
            console.log(`Executing command '${colors.yellow(command)}'`);
            const childProcess = exec(command, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
            childProcess.stdout.pipe(process.stdout);
            childProcess.stderr.pipe(process.stderr);
        })
    },
    getBumpType: () => {
        const validTypes = ['major', 'minor', 'patch', 'prerelease'];
        if (validTypes.indexOf(options.type) === -1) {
            throw new Error(
                `You must specify a release type as one of (${validTypes.join(', ')}), e.g. "--type minor"`
            );
        }
        return options.type;
    },
    getPackageJsonVersion: () => {
        return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    }
};

const bumpVersion = () => {
    return gulp.src(['./package.json'])
        .pipe(bump({type: utilities.getBumpType()}))
        .pipe(gulp.dest('./'))
};

const changelog = () => {
    return gulp.src('CHANGELOG.md')
        .pipe(conventionalChangelog({preset: 'angular'}))
        .pipe(gulp.dest('./'));
};

const cleanBuildOutput = () => {
    return gulp.src('build-output', {force: true, read: false, allowEmpty: true}).pipe(clean());
};

const cleanDist = () => {
    return gulp.src('dist', {force: true, read: false, allowEmpty: true}).pipe(clean());
};

const commitChanges = () => {
    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(`chore: release ${utilities.getPackageJsonVersion()}`));
};

const compileAndUnitTest = () => {
    return utilities.compileBuildOutput()
        .pipe(filter([specHelperPath, unitTests]))
        .pipe(jasmine({includeStackTrace: true}));
};

const compileBuildOutput = () => utilities.compileBuildOutput();

const compileDist = () => {
    const tsProjectDist = ts.createProject('tsconfig.json', {noEmit: false});
    const tsResult = gulp.src('lib/**/*.ts').pipe(tsProjectDist());
    return tsResult.js.pipe(gulp.dest('dist'));
};

const copyBuildOutputPackageJson = () => {
    return gulp.src('package.json').pipe(gulp.dest('build-output'));
};

const createNewTag = (callback) => {
    const version = utilities.getPackageJsonVersion();
    git.tag(version, `Created Tag for version: ${version}`, callback);
};

const lintCommits = () =>
    utilities.exec('./node_modules/.bin/conventional-changelog-lint --from=HEAD~20 --preset angular');

const lintTypescript = () => {
    return tsProjectBuildOutput.src()
        .pipe(tslint({formatter: "verbose"}))
        .pipe(tslint.report())
};

const npmPublish = () => utilities.exec('npm publish');

const pushChanges = (callback) => {
    git.push('origin', 'master', {args: '--tags'}, callback);
};

const e2eTest = () => {
    return gulp.src([specHelperPath, e2eTests]).pipe(jasmine({includeStackTrace: true}))
};

const test = () => {
    return gulp.src([specHelperPath, tests]).pipe(jasmine({includeStackTrace: true}))
};

const watchAndRunE2eTests = () => {
    gulp.watch(['build-output/lib/**/*', 'build-output/test/e2e/**/*', 'test/e2e/**/*.json'], gulp.series(e2eTest));
};

const watchAndRunUnitTests = () => {
    gulp.watch(['lib/**/*.ts', 'test/**/*.ts'], gulp.series(compileAndUnitTest));
};

const cleanCopyAndCompileBuildOutput = gulp.series(
    cleanBuildOutput,
    gulp.parallel(copyBuildOutputPackageJson, compileBuildOutput)
);

exports.default = gulp.series(
    gulp.parallel(cleanCopyAndCompileBuildOutput, lintCommits),
    gulp.parallel(lintTypescript, test)
);

exports.release = gulp.series(
    exports.default,
    cleanDist,
    compileDist,
    bumpVersion,
    changelog,
    commitChanges,
    createNewTag,
    pushChanges,
    npmPublish
);

exports.watch = gulp.series(
    cleanCopyAndCompileBuildOutput,
    watchAndRunUnitTests
);

exports.watchE2e = watchAndRunE2eTests;
