"use strict";
const _ = require("lodash");
const q = require("q");
const SwaggerTools = require("swagger-tools");
const validate = (document) => {
    const deferred = q.defer();
    SwaggerTools.specs.v2.validate(document, (error, result) => {
        if (error) {
            deferred.reject(error);
        }
        else {
            deferred.resolve(result);
        }
    });
    return deferred.promise;
};
const generateLocation = (path) => {
    if (path.length > 0) {
        return `[swaggerRoot].${path.join('.')}`;
    }
    return '[swaggerRoot]';
};
const generateResult = (type, message, swaggerLocation) => ({
    message,
    pactDetails: {
        interactionDescription: null,
        interactionState: '[none]',
        location: '[pactRoot]',
        value: null
    },
    source: 'swagger-validation',
    swaggerDetails: {
        location: swaggerLocation,
        pathMethod: null,
        pathName: null,
        value: null
    },
    type
});
const parseValidationResult = (validationResult, swaggerPathOrUrl) => {
    const validationErrors = _.get(validationResult, 'errors', [])
        .map((swaggerValidationError) => generateResult('error', swaggerValidationError.message, generateLocation(swaggerValidationError.path)));
    const validationWarnings = _.get(validationResult, 'warnings', [])
        .map((swaggerValidationWarning) => generateResult('warning', swaggerValidationWarning.message, generateLocation(swaggerValidationWarning.path)));
    if (validationErrors.length > 0) {
        const error = new Error(`"${swaggerPathOrUrl}" is not a valid swagger file`);
        error.details = {
            errors: validationErrors,
            warnings: validationWarnings
        };
        return q.reject(error);
    }
    return q({ warnings: validationWarnings });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (swaggerJson, swaggerPathOrUrl) => validate(swaggerJson).then((validationResult) => parseValidationResult(validationResult, swaggerPathOrUrl));
