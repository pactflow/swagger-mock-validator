"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const traverse_json_schema_1 = require("../common/traverse-json-schema");
const result_1 = require("../result");
const validate_json_1 = require("./validate-json");
const removeRequiredPropertiesFromSchema = (schema) => {
    const modifiedSchema = _.cloneDeep(schema);
    traverse_json_schema_1.traverseJsonSchema(modifiedSchema, (mutableSchema) => {
        delete mutableSchema.required;
    });
    return modifiedSchema;
};
exports.validateParsedMockResponseBody = (parsedMockInteraction, parsedSpecResponse) => {
    if (!parsedMockInteraction.responseBody.value) {
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
    const responseBodyWithoutRequiredProperties = removeRequiredPropertiesFromSchema(parsedSpecResponse.schema);
    const validationErrors = validate_json_1.validateJson(responseBodyWithoutRequiredProperties, parsedMockInteraction.responseBody.value);
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
