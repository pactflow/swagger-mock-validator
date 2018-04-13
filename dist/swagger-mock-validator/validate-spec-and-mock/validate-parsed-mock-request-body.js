"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const result_1 = require("../result");
const validate_json_1 = require("./validate-json");
const validateRequestBodyAgainstSchema = (parsedMockRequestBody, parsedSpecRequestBody) => {
    const validationErrors = validate_json_1.validateJson(parsedSpecRequestBody.schema, parsedMockRequestBody.value);
    return _.map(validationErrors, (error) => result_1.result.build({
        code: 'spv.request.body.incompatible',
        message: `Request body is incompatible with the request body schema in the swagger file: ${error.message}`,
        mockSegment: parsedMockRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'spec-mock-validation',
        specSegment: parsedSpecRequestBody.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};
const isOptionalRequestBodyMissing = (parsedMockInteraction, parsedSpecOperation) => !parsedMockInteraction.requestBody.value && !parsedSpecOperation.requestBodyParameter.required;
exports.validateParsedMockRequestBody = (parsedMockInteraction, parsedSpecOperation) => {
    const parsedMockInteractionHasBody = Boolean(parsedMockInteraction.requestBody.value);
    if (!parsedSpecOperation.requestBodyParameter) {
        if (parsedMockInteractionHasBody) {
            return [
                result_1.result.build({
                    code: 'spv.request.body.unknown',
                    message: 'No schema found for request body',
                    mockSegment: parsedMockInteraction.requestBody,
                    source: 'spec-mock-validation',
                    specSegment: parsedSpecOperation
                })
            ];
        }
        return [];
    }
    if (isOptionalRequestBodyMissing(parsedMockInteraction, parsedSpecOperation)) {
        return [];
    }
    return validateRequestBodyAgainstSchema(parsedMockInteraction.requestBody, parsedSpecOperation.requestBodyParameter);
};
