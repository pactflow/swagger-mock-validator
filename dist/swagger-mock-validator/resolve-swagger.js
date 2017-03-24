"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const q = require("q");
const swaggerTools = require("swagger-tools");
exports.default = (document) => {
    const deferred = q.defer();
    swaggerTools.specs.v2.resolve(document, (error, parsedDocument) => {
        if (error) {
            deferred.reject(error);
        }
        else {
            deferred.resolve(parsedDocument);
        }
    });
    return deferred.promise;
};
