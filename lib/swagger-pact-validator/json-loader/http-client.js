'use strict';

const request = require('request');
const q = require('q');

module.exports = {
    get: (url) => {
        const deferred = q.defer();

        const requestOptions = {
            timeout: 30000,
            url
        };

        request(requestOptions, (error, response, body) => {
            if (error) {
                deferred.reject(error);
            } else if (response.statusCode !== 200) {
                deferred.reject(new Error(`Expected 200 but recieved ${response.statusCode}`));
            } else {
                deferred.resolve(body);
            }
        });

        return deferred.promise;
    }
};
