'use strict';

const Ajv = require('ajv');
const result = require('../result');
const _ = require('lodash');

const validateJson = (jsonSchema, json) => {
    const ajv = new Ajv({
        allErrors: true,
        verbose: true
    });
    const isValid = ajv.validate(jsonSchema, json);

    return {
        errors: ajv.errors,
        isValid
    };
};

const validateRequestBodyAgainstSchema = (pactRequestBody, requestBodyParameter) => {
    const validationResult = validateJson(requestBodyParameter.schema, pactRequestBody.value);

    if (validationResult.isValid) {
        return [];
    }

    return _.map(validationResult.errors, (error) => result.error({
        message:
            `Request body is incompatible with the request body schema in the swagger file: ${error.message}`,
        pactSegment: pactRequestBody.parentInteraction.getRequestBodyPath(error.dataPath.substring(1)),
        source: 'swagger-pact-validation',
        swaggerSegment: requestBodyParameter.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};

module.exports = (pactInteraction, swaggerOperation) => {
    const pactRequestHasBody = Boolean(pactInteraction.requestBody.value);

    if (!swaggerOperation.requestBodyParameter) {
        if (pactRequestHasBody) {
            return [
                result.warning({
                    message: 'No schema found for request body',
                    pactSegment: pactInteraction.requestBody,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation
                })
            ];
        }

        return [];
    }

    if (!pactRequestHasBody && !swaggerOperation.requestBodyParameter.required) {
        return [];
    }

    return validateRequestBodyAgainstSchema(pactInteraction.requestBody, swaggerOperation.requestBodyParameter);
};
