import * as yaml from 'js-yaml';
import VError = require('verror');

const parseJson = <T>(pathOrUrl: string, rawString: string): T => {
    try {
        return JSON.parse(rawString);
    } catch (error) {
        throw new VError(error, `Unable to parse "${pathOrUrl}"`);
    }
};

const parseYaml = <T>(pathOrUrl: string, rawString: string): T => {
    let parsedYaml;

    try {
        parsedYaml = yaml.safeLoad(rawString);
    } catch (error) {
        throw new VError(error, `Unable to parse "${pathOrUrl}"`);
    }

    if (!parsedYaml) {
        throw new VError(`Unable to parse "${pathOrUrl}"`);
    }

    return parsedYaml;
};

export function transformStringToObject<T>(rawString: string, pathOrUrl: string): T {
    try {
        return parseJson<T>(pathOrUrl, rawString);
    } catch (parseJsonError) {
        try {
            return parseYaml<T>(pathOrUrl, rawString);
        } catch (parseYamlError) {
            throw parseJsonError;
        }
    }
}
