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
const validateRequestBodyAgainstSchema = (pactRequestBody, requestBodyParameter) => {
    const validationErrors = validateJson(requestBodyParameter.schema, pactRequestBody.value);
    return _.map(validationErrors, (error) => result_1.default.error({
        message: `Request body is incompatible with the request body schema in the swagger file: ${error.message}`,
        pactSegment: pactRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'swagger-pact-validation',
        swaggerSegment: requestBodyParameter.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};
const isOptionalRequestBodyMissing = (pactInteraction, swaggerOperation) => !pactInteraction.requestBody.value && !swaggerOperation.requestBodyParameter.required;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (pactInteraction, swaggerOperation) => {
    const pactRequestHasBody = Boolean(pactInteraction.requestBody.value);
    if (!swaggerOperation.requestBodyParameter) {
        if (pactRequestHasBody) {
            return [
                result_1.default.warning({
                    message: 'No schema found for request body',
                    pactSegment: pactInteraction.requestBody,
                    source: 'swagger-pact-validation',
                    swaggerSegment: swaggerOperation
                })
            ];
        }
        return [];
    }
    if (isOptionalRequestBodyMissing(pactInteraction, swaggerOperation)) {
        return [];
    }
    return validateRequestBodyAgainstSchema(pactInteraction.requestBody, swaggerOperation.requestBodyParameter);
};
