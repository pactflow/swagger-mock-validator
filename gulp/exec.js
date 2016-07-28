'use strict';

const exec = require('child_process').exec;
const gulpUtil = require('gulp-util');
const q = require('q');

const logBuffer = (prefix, buffer) => {
    const bufferString = buffer.toString();

    if (bufferString.length > 0) {
        bufferString.split('\n').forEach((line) => {
            if (line.length > 0) {
                gulpUtil.log(prefix, line);
            }
        });
    }
};

module.exports = (command) => {
    const deferred = q.defer();

    gulpUtil.log(`Executing command '${gulpUtil.colors.yellow(command)}'`);
    exec(command, (error, stdout, stderr) => {
        logBuffer(gulpUtil.colors.green('STDOUT:'), stdout);
        logBuffer(gulpUtil.colors.red('STDERR:'), stderr);
        if (error) {
            deferred.reject(new gulpUtil.PluginError('gulp/exec.js', error, {showStack: true}));
        } else {
            deferred.resolve();
        }
    });

    return deferred.promise;
};
