"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yaml = require("js-yaml");
const VError = require("verror");
const parseJson = (pathOrUrl, rawString) => {
    try {
        return JSON.parse(rawString);
    }
    catch (error) {
        throw new VError(error, `Unable to parse "${pathOrUrl}"`);
    }
};
const parseYaml = (pathOrUrl, rawString) => {
    let parsedYaml;
    try {
        parsedYaml = yaml.safeLoad(rawString);
    }
    catch (error) {
        throw new VError(error, `Unable to parse "${pathOrUrl}"`);
    }
    if (!parsedYaml) {
        throw new VError(`Unable to parse "${pathOrUrl}"`);
    }
    return parsedYaml;
};
function transformStringToObject(rawString, pathOrUrl) {
    try {
        return parseJson(pathOrUrl, rawString);
    }
    catch (parseJsonError) {
        try {
            return parseYaml(pathOrUrl, rawString);
        }
        catch (parseYamlError) {
            throw parseJsonError;
        }
    }
}
exports.transformStringToObject = transformStringToObject;
