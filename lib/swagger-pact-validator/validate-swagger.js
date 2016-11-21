'use strict';

const q = require('q');
const result = require('./result');
const swaggerTools = require('swagger-tools');
const _ = require('lodash');

const validate = q.nbind(swaggerTools.specs.v2.validate, swaggerTools.specs.v2);

const generateLocation = (path) => {
    if (path.length > 0) {
        return `[swaggerRoot].${path.join('.')}`;
    }

    return '[swaggerRoot]';
};

const parseValidationResult = (validationResult, context) => {
    const validationErrors = _.get(validationResult, 'errors', []).map((swaggerValidationError) => {
        const errorContext = context
            .setSwaggerLocation(generateLocation(swaggerValidationError.path))
            .setSource('swagger-validation');

        return result.legacyError(errorContext, swaggerValidationError.message);
    });

    const validationWarnings = _.get(validationResult, 'warnings', []).map((swaggerValidationWarning) => {
        const warningContext = context
            .setSwaggerLocation(generateLocation(swaggerValidationWarning.path))
            .setSource('swagger-validation');

        return result.legacyWarning(warningContext, swaggerValidationWarning.message);
    });

    if (validationErrors.length > 0) {
        const error = new Error(`"${context.getSwaggerFileName()}" is not a valid swagger file`);

        error.details = {
            errors: validationErrors,
            warnings: validationWarnings
        };

        return q.reject(error);
    }

    return q({warnings: validationWarnings});
};

module.exports = (swaggerJson, context) =>
    validate(swaggerJson).then((validationResult) => parseValidationResult(validationResult, context));
