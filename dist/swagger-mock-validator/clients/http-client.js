"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const request = require("request");
const hasHttp2xxStatusCode = (response) => response.statusCode && response.statusCode >= 200 && response.statusCode <= 299;
class HttpClient {
    static getRequestOptions(url, auth) {
        let requestOptions = {
            timeout: 30000,
            url
        };
        if (auth) {
            requestOptions = Object.assign(Object.assign({}, requestOptions), { headers: {
                    authorization: 'Basic ' + Buffer.from(auth).toString('base64')
                } });
        }
        return requestOptions;
    }
    get(url, auth) {
        return new Promise((resolve, reject) => {
            const requestOptions = HttpClient.getRequestOptions(url, auth);
            request(requestOptions, (error, response, body) => {
                if (error) {
                    reject(error);
                }
                else if (response.statusCode !== 200) {
                    reject(new Error(`Expected 200 but received ${response.statusCode}`));
                }
                else {
                    resolve(body);
                }
            });
        });
    }
    post(url, body) {
        const requestOptions = {
            body,
            json: true,
            method: 'POST',
            timeout: 5000,
            url
        };
        return new Promise((resolve, reject) => {
            request(requestOptions, (error, response) => {
                if (error) {
                    reject(error);
                }
                else if (!hasHttp2xxStatusCode(response)) {
                    reject(new Error(`Expected 2xx but received ${response.statusCode}}`));
                }
                else {
                    resolve();
                }
            });
        });
    }
}
exports.HttpClient = HttpClient;
