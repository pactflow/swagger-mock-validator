"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParsedMockResponseBody = void 0;
const _ = require("lodash");
const traverse_json_schema_1 = require("../common/traverse-json-schema");
const result_1 = require("../result");
const content_negotiation_1 = require("./content-negotiation");
const validate_json_1 = require("./validate-json");
const removeRequiredPropertiesFromSchema = (schema) => {
    const modifiedSchema = _.cloneDeep(schema);
    (0, traverse_json_schema_1.traverseJsonSchema)(modifiedSchema, (mutableSchema) => {
        delete mutableSchema.required;
        return modifiedSchema;
    });
    return modifiedSchema;
};
const setAdditionalPropertiesToFalseInSchema = (schema) => {
    const modifiedSchema = _.cloneDeep(schema);
    (0, traverse_json_schema_1.traverseJsonSchema)(modifiedSchema, (mutableSchema) => {
        if (typeof mutableSchema.additionalProperties === 'undefined') {
            mutableSchema.additionalProperties = false;
        }
        return modifiedSchema;
    });
    return modifiedSchema;
};
const isMockInteractionWithoutResponseBody = (parsedMockInteraction) => !parsedMockInteraction.responseBody.value;
const isNotSupportedMediaType = (parsedSpecResponse) => parsedSpecResponse.produces.value.length > 0 &&
    !(0, content_negotiation_1.isMediaTypeSupported)('application/json', parsedSpecResponse.produces.value);
const shouldSkipValidation = (parsedMockInteraction, parsedSpecResponse) => isMockInteractionWithoutResponseBody(parsedMockInteraction) ||
    isNotSupportedMediaType(parsedSpecResponse);
const validateParsedMockResponseBody = (parsedMockInteraction, parsedSpecResponse, opts) => {
    if (shouldSkipValidation(parsedMockInteraction, parsedSpecResponse)) {
        return [];
    }
    if (!parsedSpecResponse.schema) {
        return [
            result_1.result.build({
                code: 'response.body.unknown',
                message: 'No schema found for response body',
                mockSegment: parsedMockInteraction.responseBody,
                source: 'spec-mock-validation',
                specSegment: parsedSpecResponse
            })
        ];
    }
    let responseBodyToValidate = parsedSpecResponse.schema;
    // tslint:disable:cyclomatic-complexity
    if (!opts.additionalPropertiesInResponse) {
        responseBodyToValidate = setAdditionalPropertiesToFalseInSchema(parsedSpecResponse.schema);
    }
    if (!opts.requiredPropertiesInResponse) {
        responseBodyToValidate = removeRequiredPropertiesFromSchema(responseBodyToValidate);
    }
    const validationErrors = (0, validate_json_1.validateJson)(responseBodyToValidate, parsedMockInteraction.responseBody.value);
    return _.map(validationErrors, (error) => {
        const message = error.keyword === 'additionalProperties'
            ? `${error.message} - ${error.params.additionalProperty}`
            : error.message;
        return result_1.result.build({
            code: 'response.body.incompatible',
            message: `Response body is incompatible with the response body schema in the spec file: ${message}`,
            mockSegment: parsedMockInteraction.getResponseBodyPath(error.dataPath),
            source: 'spec-mock-validation',
            specSegment: parsedSpecResponse.getFromSchema(error.schemaPath.replace(/\//g, '.').substring(2))
        });
    });
};
exports.validateParsedMockResponseBody = validateParsedMockResponseBody;
