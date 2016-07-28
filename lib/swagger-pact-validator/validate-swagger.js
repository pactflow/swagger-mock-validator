'use strict';

const q = require('q');
const swaggerTools = require('swagger-tools');

const validate = q.nbind(swaggerTools.specs.v2.validate, swaggerTools.specs.v2);

const generateLocation = (path) => {
    if (path.length > 0) {
        return `[swaggerRoot].${path.join('.')}`;
    }

    return '[swaggerRoot]';
};

const parseValidationResult = (result, swaggerFileName) => {
    if (result) {
        const error = new Error(`File "${swaggerFileName}" is not a valid swagger file`);

        error.details = {
            errors: result.errors.map((swaggerValidationError) => ({
                location: generateLocation(swaggerValidationError.path),
                message: swaggerValidationError.message
            }))
        };

        return q.reject(error);
    }

    return q();
};

module.exports = (swaggerJson, swaggerFileName) =>
    validate(swaggerJson).then((result) => parseValidationResult(result, swaggerFileName));
