'use strict';

const gulp = require('gulp');
const bump = require('gulp-bump');
const colors = require('ansi-colors');
const conventionalChangelog = require('gulp-conventional-changelog');
const exec = require('child_process').exec;
const git = require('gulp-git');
const fs = require('fs');
const minimist = require('minimist');

const options = minimist(process.argv.slice(2), {strings: ['type']});

const utilities = {
    exec: (command) => {
        return new Promise((resolve, reject) => {
            console.log(`Executing command '${colors.yellow(command)}'`);
            const childProcess = exec(command, {'NODE_AUTH_TOKEN': process.env.NODE_AUTH_TOKEN} , (error) => {
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

const commitChanges = () => {
    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit(`chore: release ${utilities.getPackageJsonVersion()}`));
};

const createNewTag = (callback) => {
    const version = utilities.getPackageJsonVersion();
    git.tag(version, `Created Tag for version: ${version}`, callback);
};

const pushChanges = (callback) => {
    git.push('origin', 'master', {args: '--tags'}, callback);
};

exports.release = gulp.series(
    bumpVersion,
    changelog,
    commitChanges,
    createNewTag,
    pushChanges,
);
