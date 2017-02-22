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
const generateResult = (options) => ({
    code: options.code,
    message: options.message,
    pactDetails: {
        interactionDescription: null,
        interactionState: null,
        location: '[pactRoot]',
        pactFile: options.pactPathOrUrl,
        value: null
    },
    source: 'swagger-validation',
    swaggerDetails: {
        location: options.swaggerLocation,
        pathMethod: null,
        pathName: null,
        swaggerFile: options.swaggerPathOrUrl,
        value: null
    },
    type: options.type
});
const parseValidationResult = (validationResult, swaggerPathOrUrl, pactPathOrUrl) => {
    const validationErrors = _.get(validationResult, 'errors', [])
        .map((swaggerValidationError) => generateResult({
        code: 'sv.error',
        message: swaggerValidationError.message,
        pactPathOrUrl,
        swaggerPathOrUrl,
        swaggerLocation: generateLocation(swaggerValidationError.path),
        type: 'error'
    }));
    const validationWarnings = _.get(validationResult, 'warnings', [])
        .map((swaggerValidationWarning) => generateResult({
        code: 'sv.warning',
        message: swaggerValidationWarning.message,
        pactPathOrUrl,
        swaggerPathOrUrl,
        swaggerLocation: generateLocation(swaggerValidationWarning.path),
        type: 'warning'
    }));
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
exports.default = (swaggerJson, swaggerPathOrUrl, pactPathOrUrl) => validate(swaggerJson)
    .then((validationResult) => parseValidationResult(validationResult, swaggerPathOrUrl, pactPathOrUrl));
