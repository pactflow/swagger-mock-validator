'use strict';

const q = require('q');
const VError = require('verror');

module.exports = {
    load: (pathOrUrl, fileSystem, httpClient) => {
        const getter = pathOrUrl.indexOf('http') === 0 ? httpClient.get : fileSystem.readFile;

        return getter(pathOrUrl)
            .catch((error) => q.reject(new VError(error, `Unable to read "${pathOrUrl}"`)))
            .then((result) => {
                try {
                    return JSON.parse(result);
                } catch (error) {
                    return q.reject(new VError(error, `Unable to parse "${pathOrUrl}" as json`));
                }
            });
    }
};
