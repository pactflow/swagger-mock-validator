'use strict';

const exec = require('child_process').exec;
const gulpUtil = require('gulp-util');

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
    gulpUtil.log(`Executing command '${gulpUtil.colors.yellow(command)}'`);

    return new Promise((resolve ,reject) => {
        exec(command, (error, stdout, stderr) => {
            logBuffer(gulpUtil.colors.green('STDOUT:'), stdout);
            logBuffer(gulpUtil.colors.red('STDERR:'), stderr);
            if (error) {
                reject(new gulpUtil.PluginError('gulp/exec.js', error, {showStack: true}));
            } else {
                resolve();
            }
        });
    });
};
