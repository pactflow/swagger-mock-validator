import * as yaml from 'js-yaml';
import * as q from 'q';
import VError = require('verror');
import {FileSystem, HttpClient, JsonLoaderFunction} from './types';

const parseJson = (pathOrUrl: string, rawString: string) => {
    try {
        return q(JSON.parse(rawString));
    } catch (error) {
        return q.reject(new VError(error, `Unable to parse "${pathOrUrl}"`));
    }
};

const parseYaml = (rawString: string) => {
    let parsedYaml;

    try {
        parsedYaml = yaml.safeLoad(rawString);
    } catch (error) {
        // do nothing
    }

    if (!parsedYaml) {
        return q.reject();
    }

    return q(parsedYaml);
};

export default {
    load: (pathOrUrl: string, fileSystem: FileSystem, httpClient: HttpClient) => {
        const getter: JsonLoaderFunction = pathOrUrl.indexOf('http') === 0 ? httpClient.get : fileSystem.readFile;

        return getter(pathOrUrl)
            .catch<string>((error) => q.reject(new VError(error, `Unable to read "${pathOrUrl}"`)))
            .then((result) =>
                parseJson(pathOrUrl, result)
                    .catch((error) => parseYaml(result)
                        .catch(() => q.reject(error))
                    )
            );
    }
};
