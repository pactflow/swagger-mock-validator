'use strict';

const fileSystem = require('./read-file-as-json/file-system');
const q = require('q');
const VError = require('verror');

module.exports = (file) =>
    fileSystem.readFile(file)
        .catch((error) => q.reject(new VError(error, `Unable to read file "${file}"`)))
        .then((fileContent) => {
            try {
                return q(JSON.parse(fileContent));
            } catch (error) {
                return q.reject(new VError(error, `Unable to parse file "${file}" as json`));
            }
        });
