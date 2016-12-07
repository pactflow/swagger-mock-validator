import * as q from 'q';
import VError = require('verror');
import {FileSystem, HttpClient, JsonLoaderFunction} from './types';

export default {
    load: (pathOrUrl: string, fileSystem: FileSystem, httpClient: HttpClient) => {
        const getter: JsonLoaderFunction = pathOrUrl.indexOf('http') === 0 ? httpClient.get : fileSystem.readFile;

        return getter(pathOrUrl)
            .catch<string>((error) => q.reject(new VError(error, `Unable to read "${pathOrUrl}"`)))
            .then((result) => {
                try {
                    return JSON.parse(result);
                } catch (error) {
                    return q.reject(new VError(error, `Unable to parse "${pathOrUrl}" as json`));
                }
            });
    }
};
