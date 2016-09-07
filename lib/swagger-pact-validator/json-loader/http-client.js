'use strict';

const request = require('request');
const q = require('q');

module.exports = {
    get: (url) => {
        const deferred = q.defer();

        const requestOptions = {
            url,
            timeout: 30000
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
