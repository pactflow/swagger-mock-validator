import * as q from 'q';
import * as request from 'request';
import {HttpClient} from '../types';

const hasHttp2xxStatusCode = (response: request.RequestResponse) =>
    response.statusCode && response.statusCode >= 200 && response.statusCode <= 299;

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
    },
    post: (url, body) => {
        const deferred = q.defer<void>();

        const requestOptions = {
            body,
            json: true,
            method: 'POST',
            timeout: 5000,
            url
        };

        request(requestOptions, (error, response) => {
            if (error) {
                deferred.reject(error);
            } else if (!hasHttp2xxStatusCode(response)) {
                deferred.reject(new Error(`Expected 2xx but received ${response.statusCode}}`));
            } else {
                deferred.resolve();
            }
        });

        return deferred.promise;
    }
};

export default httpClient;
