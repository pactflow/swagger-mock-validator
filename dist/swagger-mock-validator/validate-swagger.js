"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    source: 'swagger-validation',
    specDetails: {
        location: options.specLocation,
        pathMethod: null,
        pathName: null,
        specFile: options.specPathOrUrl,
        value: null
    },
    type: options.type
});
const parseValidationResult = (validationResult, specPathOrUrl) => {
    const errors = _.get(validationResult, 'errors', [])
        .map((swaggerValidationError) => generateResult({
        code: 'sv.error',
        message: swaggerValidationError.message,
        specLocation: generateLocation(swaggerValidationError.path),
        specPathOrUrl,
        type: 'error'
    }));
    const warnings = _.get(validationResult, 'warnings', [])
        .map((swaggerValidationWarning) => generateResult({
        code: 'sv.warning',
        message: swaggerValidationWarning.message,
        specLocation: generateLocation(swaggerValidationWarning.path),
        specPathOrUrl,
        type: 'warning'
    }));
    const success = errors.length === 0;
    const reason = success ? undefined : `"${specPathOrUrl}" is not a valid swagger file`;
    return q({ errors, warnings, reason, success });
};
exports.default = (specJson, specPathOrUrl) => validate(specJson)
    .then((validationResult) => parseValidationResult(validationResult, specPathOrUrl));
