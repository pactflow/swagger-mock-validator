"use strict";
const q = require("q");
const request = require("request");
const httpClient = {
    get: (url) => {
        const deferred = q.defer();
        const requestOptions = {
            timeout: 30000,
            url
        };
        request(requestOptions, (error, response, body) => {
            if (error) {
                deferred.reject(error);
            }
            else if (response.statusCode !== 200) {
                deferred.reject(new Error(`Expected 200 but received ${response.statusCode}`));
            }
            else {
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = httpClient;
