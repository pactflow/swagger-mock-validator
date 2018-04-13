"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const hasHttp2xxStatusCode = (response) => response.statusCode && response.statusCode >= 200 && response.statusCode <= 299;
exports.defaultHttpClient = {
    get: (url) => {
        const requestOptions = {
            timeout: 30000,
            url
        };
        return new Promise((resolve, reject) => {
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
    },
    post: (url, body) => {
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
};
