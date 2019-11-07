"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const result_1 = require("../result");
const content_negotiation_1 = require("./content-negotiation");
const validate_json_1 = require("./validate-json");
const validateRequestBodyAgainstSchema = (parsedMockRequestBody, parsedSpecRequestBody) => {
    const validationErrors = validate_json_1.validateJson(parsedSpecRequestBody.schema, parsedMockRequestBody.value);
    return _.map(validationErrors, (error) => result_1.result.build({
        code: 'request.body.incompatible',
        message: `Request body is incompatible with the request body schema in the spec file: ${error.message}`,
        mockSegment: parsedMockRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'spec-mock-validation',
        specSegment: parsedSpecRequestBody.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
    }));
};
const isOptionalRequestBodyMissing = (parsedMockInteraction, parsedSpecOperation) => parsedMockInteraction.requestBody.value === undefined &&
    !(parsedSpecOperation.requestBodyParameter && parsedSpecOperation.requestBodyParameter.required);
const specAndMockHaveNoBody = (parsedMockInteraction, parsedSpecOperation) => !parsedSpecOperation.requestBodyParameter && !parsedMockInteraction.requestBody.value;
const isNotSupportedMediaType = (parsedSpecOperation) => parsedSpecOperation.consumes.value.length > 0 &&
    !content_negotiation_1.isMediaTypeSupported('application/json', parsedSpecOperation.consumes.value);
const shouldSkipValidation = (parsedMockInteraction, parsedSpecOperation) => isNotSupportedMediaType(parsedSpecOperation) ||
    specAndMockHaveNoBody(parsedMockInteraction, parsedSpecOperation) ||
    isOptionalRequestBodyMissing(parsedMockInteraction, parsedSpecOperation);
exports.validateParsedMockRequestBody = (parsedMockInteraction, parsedSpecOperation) => {
    if (shouldSkipValidation(parsedMockInteraction, parsedSpecOperation)) {
        return [];
    }
    if (parsedSpecOperation.requestBodyParameter) {
        return validateRequestBodyAgainstSchema(parsedMockInteraction.requestBody, parsedSpecOperation.requestBodyParameter);
    }
    return [
        result_1.result.build({
            code: 'request.body.unknown',
            message: 'No schema found for request body',
            mockSegment: parsedMockInteraction.requestBody,
            source: 'spec-mock-validation',
            specSegment: parsedSpecOperation
        })
    ];
};
