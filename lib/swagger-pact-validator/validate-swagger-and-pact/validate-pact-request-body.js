'use strict';

const Ajv = require('ajv');
const getSwaggerOperation = require('./get-swagger-operation');
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

const validateRequestBodyAgainstSchema = (pactRequestBody, schema, interactionContext) => {
    const validationResult = validateJson(schema.rawValue, pactRequestBody.rawValue);

    if (validationResult.isValid) {
        return [];
    }

    return _.map(validationResult.errors, (error) => result.error({
        context: interactionContext
            .setSwaggerPathName(schema.parentOperation.parsedValue.pathName.rawValue)
            .setSwaggerPathMethod(schema.parentOperation.parsedValue.method.rawValue)
            .setSwaggerValue(
                schema.parsedValue.get(error.schemaPath.replace(/\//g, '.').substring(2)).rawValue
            ),
        message:
            `Request body is incompatible with the request body schema in the swagger file: ${error.message}`,
        pactSegment: pactRequestBody.parentInteraction.parsedValue.getRequestBodyPath(error.dataPath.substring(1)),
        source: 'swagger-pact-validation',
        swaggerSegment: schema.parsedValue.get(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};

const validateRequestBody = (pactRequestBody, swaggerOperation, interactionContext) => {
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

    return validateRequestBodyAgainstSchema(pactRequestBody, schema, interactionContext);
};

module.exports = (interactionContext, pactInteraction, swagger) => {
    const searchResult = getSwaggerOperation(interactionContext, pactInteraction, swagger);

    if (!searchResult.found) {
        return [];
    }

    return validateRequestBody(pactInteraction.parsedValue.requestBody, searchResult.value, interactionContext);
};
