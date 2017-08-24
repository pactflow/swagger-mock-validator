import * as request from 'request';
import {HttpClient} from '../types';

const hasHttp2xxStatusCode = (response: request.RequestResponse) =>
    response.statusCode && response.statusCode >= 200 && response.statusCode <= 299;

const httpClient: HttpClient = {
    get: (url) => {
        const requestOptions = {
            timeout: 30000,
            url
        };

        return new Promise((resolve, reject) => {
            request(requestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                } else if (response.statusCode !== 200) {
                    reject(new Error(`Expected 200 but received ${response.statusCode}`));
                } else {
                    resolve(body);
                }
            });
        });
    },
    post: (url, body) => {
        const requestOptions = {
            body,
            json: true,
            method: 'POST',
            timeout: 5000,
            url
        };

        return new Promise<void>((resolve, reject) => {
            request(requestOptions, (error, response) => {
                if (error) {
                    reject(error);
                } else if (!hasHttp2xxStatusCode(response)) {
                    reject(new Error(`Expected 2xx but received ${response.statusCode}}`));
                } else {
                    resolve();
                }
            });
        });
    }
};

export default httpClient;
