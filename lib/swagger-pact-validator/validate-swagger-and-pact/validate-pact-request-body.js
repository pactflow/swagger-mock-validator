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

const validateRequestBodyAgainstSchema = (pactRequestBody, schema) => {
    const validationResult = validateJson(schema.rawValue, pactRequestBody.rawValue);

    if (validationResult.isValid) {
        return [];
    }

    return _.map(validationResult.errors, (error) => result.error({
        message:
            `Request body is incompatible with the request body schema in the swagger file: ${error.message}`,
        pactSegment: pactRequestBody.parentInteraction.parsedValue.getRequestBodyPath(error.dataPath.substring(1)),
        source: 'swagger-pact-validation',
        swaggerSegment: schema.parsedValue.get(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};

module.exports = (pactInteraction, swaggerOperation) => {
    const pactRequestBody = pactInteraction.parsedValue.requestBody;

    const swaggerBodyParameters = _.filter(swaggerOperation.parsedValue.parameters, (parameter) =>
        parameter.parsedValue.in.rawValue === 'body'
    );

    if (swaggerBodyParameters.length !== 1) {
        if (pactRequestBody.rawValue) {
            return [
                result.warning({
                    message: 'No schema found for request body',
                    pactSegment: pactRequestBody,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation
                })
            ];
        }

        return [];
    }

    const swaggerBodyParameter = swaggerBodyParameters[0];

    if (!pactRequestBody.rawValue && !swaggerBodyParameter.parsedValue.required.rawValue) {
        return [];
    }

    const schema = swaggerBodyParameter.parsedValue.schema;

    return validateRequestBodyAgainstSchema(pactRequestBody, schema);
};
