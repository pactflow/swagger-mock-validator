'use strict';

const q = require('q');
const result = require('./result');
const swaggerTools = require('swagger-tools');

const validate = q.nbind(swaggerTools.specs.v2.validate, swaggerTools.specs.v2);

const generateLocation = (path) => {
    if (path.length > 0) {
        return `[swaggerRoot].${path.join('.')}`;
    }

    return '[swaggerRoot]';
};

const parseValidationResult = (validationResult, context) => {
    if (validationResult) {
        const error = new Error(`"${context.getSwaggerFileName()}" is not a valid swagger file`);

        error.details = {
            errors: validationResult.errors.map((swaggerValidationError) => {
                const errorContext = context
                    .setSwaggerLocation(generateLocation(swaggerValidationError.path))
                    .setSource('swagger-validation');

                return result.error(errorContext, swaggerValidationError.message);
            })
        };

        return q.reject(error);
    }

    return q();
};

module.exports = (swaggerJson, context) =>
    validate(swaggerJson).then((validationResult) => parseValidationResult(validationResult, context));
