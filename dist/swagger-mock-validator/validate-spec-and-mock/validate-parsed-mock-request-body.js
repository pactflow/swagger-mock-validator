"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedMockRequestBody = void 0;
const _ = require("lodash");
const result_1 = require("../result");
const content_negotiation_1 = require("./content-negotiation");
const validate_json_1 = require("./validate-json");
const validateRequestBodyAgainstSchema = (parsedMockInteraction, parsedSpecOperation) => {
    var _a;
    const parsedMockRequestBody = parsedMockInteraction.requestBody;
    const parsedSpecRequestBody = parsedSpecOperation.requestBodyParameter;
    const expectedMediaType = (_a = parsedMockInteraction.requestHeaders['content-type']) === null || _a === void 0 ? void 0 : _a.value;
    const schemaForMediaType = parsedSpecRequestBody.schemaByContentType(expectedMediaType);
    if (!schemaForMediaType) {
        return [
            result_1.result.build({
                code: 'request.body.unknown',
                message: 'No matching schema found for request body',
                mockSegment: parsedMockInteraction.requestBody,
                source: 'spec-mock-validation',
                specSegment: parsedSpecOperation
            })
        ];
    }
    const { schema, mediaType } = schemaForMediaType;
    const validationErrors = (0, validate_json_1.validateJson)(schemaForMediaType.schema, parsedMockRequestBody.value);
    return _.map(validationErrors, (error) => result_1.result.build({
        code: 'request.body.incompatible',
        message: `Request body is incompatible with the request body schema in the spec file: ${error.message}`,
        mockSegment: parsedMockRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'spec-mock-validation',
        specSegment: parsedSpecRequestBody.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2), schema, mediaType)
    }));
};
const isOptionalRequestBodyMissing = (parsedMockInteraction, parsedSpecOperation) => parsedMockInteraction.requestBody.value === undefined &&
    !(parsedSpecOperation.requestBodyParameter && parsedSpecOperation.requestBodyParameter.required);
const specAndMockHaveNoBody = (parsedMockInteraction, parsedSpecOperation) => !parsedSpecOperation.requestBodyParameter && !parsedMockInteraction.requestBody.value;
const isNotSupportedMediaType = (parsedSpecOperation) => parsedSpecOperation.consumes.value.length > 0 &&
    !(0, content_negotiation_1.isTypesOfJson)(parsedSpecOperation.consumes.value);
const shouldSkipValidation = (parsedMockInteraction, parsedSpecOperation) => isNotSupportedMediaType(parsedSpecOperation) ||
    specAndMockHaveNoBody(parsedMockInteraction, parsedSpecOperation) ||
    isOptionalRequestBodyMissing(parsedMockInteraction, parsedSpecOperation);
const validateParsedMockRequestBody = (parsedMockInteraction, parsedSpecOperation) => {
    if (shouldSkipValidation(parsedMockInteraction, parsedSpecOperation)) {
        return [];
    }
    if (parsedSpecOperation.requestBodyParameter) {
        return validateRequestBodyAgainstSchema(parsedMockInteraction, parsedSpecOperation);
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
exports.validateParsedMockRequestBody = validateParsedMockRequestBody;
