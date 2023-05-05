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
    // start with a default schema
    let schema = parsedSpecRequestBody.schema;
    // switch schema based on content-type
    const contentType = (_a = parsedMockInteraction.requestHeaders['content-type']) === null || _a === void 0 ? void 0 : _a.value;
    if (contentType && parsedSpecRequestBody.schemasByContentType && parsedSpecRequestBody.schemasByContentType[contentType]) {
        schema = parsedSpecRequestBody.schemasByContentType[contentType];
    }
    const validationErrors = (0, validate_json_1.validateJson)(schema, parsedMockRequestBody.value);
    return _.map(validationErrors, (error) => result_1.result.build({
        code: 'request.body.incompatible',
        message: `Request body is incompatible with the request body schema in the spec file: ${error.message}`,
        mockSegment: parsedMockRequestBody.parentInteraction.getRequestBodyPath(error.dataPath),
        source: 'spec-mock-validation',
        specSegment: parsedSpecRequestBody.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2), contentType)
    }));
};
const isOptionalRequestBodyMissing = (parsedMockInteraction, parsedSpecOperation) => parsedMockInteraction.requestBody.value === undefined &&
    !(parsedSpecOperation.requestBodyParameter && parsedSpecOperation.requestBodyParameter.required);
const specAndMockHaveNoBody = (parsedMockInteraction, parsedSpecOperation) => !parsedSpecOperation.requestBodyParameter && !parsedMockInteraction.requestBody.value;
const isNotSupportedMediaType = (parsedSpecOperation) => parsedSpecOperation.consumes.value.length > 0 &&
    !(0, content_negotiation_1.isMediaTypeSupported)('application/json', parsedSpecOperation.consumes.value);
const shouldSkipValidation = (parsedMockInteraction, parsedSpecOperation) => isNotSupportedMediaType(parsedSpecOperation) ||
    specAndMockHaveNoBody(parsedMockInteraction, parsedSpecOperation) ||
    isOptionalRequestBodyMissing(parsedMockInteraction, parsedSpecOperation);
const validateParsedMockRequestBody = (parsedMockInteraction, parsedSpecOperation) => {
    if (shouldSkipValidation(parsedMockInteraction, parsedSpecOperation)) {
        // this is temporary code to identify passing validations that should've failed
        // tslint:disable:cyclomatic-complexity
        if (process.env.DEBUG_CONTENT_TYPE_ISSUE && isNotSupportedMediaType(parsedSpecOperation)) {
            const debugValidation = (validation) => {
                var _a;
                console.error(JSON.stringify({
                    message: 'Passing validation that should\'ve failed due to unsupported media type',
                    pact_request: {
                        'content-type': (_a = parsedMockInteraction.requestHeaders['content-type']) === null || _a === void 0 ? void 0 : _a.value
                    },
                    oas_consumes: {
                        'content-type': parsedSpecOperation.consumes.value
                    },
                    validation
                }));
            };
            if (parsedSpecOperation.requestBodyParameter) {
                debugValidation(validateRequestBodyAgainstSchema(parsedMockInteraction, parsedSpecOperation));
            }
            else {
                debugValidation([
                    result_1.result.build({
                        code: 'request.body.unknown',
                        message: 'No schema found for request body',
                        mockSegment: parsedMockInteraction.requestBody,
                        source: 'spec-mock-validation',
                        specSegment: parsedSpecOperation
                    })
                ]);
            }
        }
        // tslint:enable:cyclomatic-complexity
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
