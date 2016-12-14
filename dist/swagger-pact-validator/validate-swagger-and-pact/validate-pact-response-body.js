"use strict";
const Ajv = require("ajv");
const _ = require("lodash");
const result_1 = require("../result");
const validateJson = (jsonSchema, json) => {
    const ajv = new Ajv({
        allErrors: true,
        verbose: true
    });
    ajv.validate(jsonSchema, json);
    return ajv.errors;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerResponse) => {
    if (!pactInteraction.responseBody.value) {
        return [];
    }
    if (!swaggerResponse.schema) {
        return [
            result_1.default.error({
                message: 'No schema found for response body',
                pactSegment: pactInteraction.responseBody,
                source: 'swagger-pact-validation',
                swaggerSegment: swaggerResponse
            })
        ];
    }
    const validationErrors = validateJson(swaggerResponse.schema, pactInteraction.responseBody.value);
    return _.map(validationErrors, (error) => {
        const message = error.keyword === 'additionalProperties'
            ? `${error.message} - ${error.params.additionalProperty}`
            : error.message;
        return result_1.default.error({
            message: `Response body is incompatible with the response body schema in the swagger file: ${message}`,
            pactSegment: pactInteraction.getResponseBodyPath(error.dataPath),
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerResponse.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
        });
    });
};
