'use strict';

const q = require('q');
const swaggerTools = require('swagger-tools');
const _ = require('lodash');

const validate = q.nbind(swaggerTools.specs.v2.validate, swaggerTools.specs.v2);

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
    const validationErrors = _.get(validationResult, 'errors', []).map((swaggerValidationError) =>
        generateResult('error', swaggerValidationError.message, generateLocation(swaggerValidationError.path))
    );

    const validationWarnings = _.get(validationResult, 'warnings', []).map((swaggerValidationWarning) =>
        generateResult('warning', swaggerValidationWarning.message, generateLocation(swaggerValidationWarning.path))
    );

    if (validationErrors.length > 0) {
        const error = new Error(`"${swaggerPathOrUrl}" is not a valid swagger file`);

        error.details = {
            errors: validationErrors,
            warnings: validationWarnings
        };

        return q.reject(error);
    }

    return q({warnings: validationWarnings});
};

module.exports = (swaggerJson, swaggerPathOrUrl) =>
    validate(swaggerJson).then((validationResult) => parseValidationResult(validationResult, swaggerPathOrUrl));
