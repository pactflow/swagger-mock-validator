"use strict";
const yaml = require("js-yaml");
const q = require("q");
const VError = require("verror");
const parseJson = (pathOrUrl, rawString) => {
    try {
        return q(JSON.parse(rawString));
    }
    catch (error) {
        return q.reject(new VError(error, `Unable to parse "${pathOrUrl}"`));
    }
};
const parseYaml = (rawString) => {
    let parsedYaml;
    try {
        parsedYaml = yaml.safeLoad(rawString);
    }
    catch (error) {
    }
    if (!parsedYaml) {
        return q.reject();
    }
    return q(parsedYaml);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    load: (pathOrUrl, fileSystem, httpClient) => {
        const getter = pathOrUrl.indexOf('http') === 0 ? httpClient.get : fileSystem.readFile;
        return getter(pathOrUrl)
            .catch((error) => q.reject(new VError(error, `Unable to read "${pathOrUrl}"`)))
            .then((result) => parseJson(pathOrUrl, result)
            .catch((error) => parseYaml(result)
            .catch(() => q.reject(error))));
    }
};
