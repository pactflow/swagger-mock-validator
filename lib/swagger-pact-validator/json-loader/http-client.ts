import * as q from 'q';
import * as request from 'request';
import {HttpClient} from '../types';

const httpClient: HttpClient = {
    get: (url) => {
        const deferred = q.defer<string>();

        const requestOptions = {
            timeout: 30000,
            url
        };

        request(requestOptions, (error, response, body) => {
            if (error) {
                deferred.reject(error);
            } else if (response.statusCode !== 200) {
                deferred.reject(new Error(`Expected 200 but received ${response.statusCode}`));
            } else {
                deferred.resolve(body);
            }
        });

        return deferred.promise;
    }
};

export default httpClient;
