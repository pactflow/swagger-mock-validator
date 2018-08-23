"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const util_1 = require("util");
const result_1 = require("../result");
const validate_json_1 = require("./validate-json");
const toJsonSchema = (parsedSpecParameter) => {
    const schema = {
        definitions: parsedSpecParameter.schema.definitions,
        properties: {
            value: parsedSpecParameter.schema
        },
        type: 'object'
    };
    if (parsedSpecParameter.required) {
        schema.required = ['value'];
    }
    return schema;
};
const multiCollectionFormatSeparator = '[multi-array-separator]';
const getCollectionSeparator = (parsedSpecCollectionFormat) => {
    // tslint:disable:cyclomatic-complexity
    if (parsedSpecCollectionFormat === 'ssv') {
        return ' ';
    }
    else if (parsedSpecCollectionFormat === 'tsv') {
        return '\t';
    }
    else if (parsedSpecCollectionFormat === 'pipes') {
        return '|';
    }
    else if (parsedSpecCollectionFormat === 'multi') {
        return multiCollectionFormatSeparator;
    }
    return ',';
    // tslint:enable:cyclomatic-complexity
};
const isParsedSpecJsonSchemaCore = (schema) => util_1.isObject(schema);
const expandArrays = (parsedMockValue, parsedSpecParameterSchema, parsedSpecCollectionFormat) => {
    if (isParsedSpecJsonSchemaCore(parsedSpecParameterSchema) && parsedSpecParameterSchema.type === 'array') {
        const values = parsedMockValue.split(getCollectionSeparator(parsedSpecCollectionFormat));
        return _.map(values, (value) => expandArrays(value, parsedSpecParameterSchema.items));
    }
    else {
        return parsedMockValue;
    }
};
const toWrappedParsedMockValue = (parsedMockValue, parsedSpecParameter) => {
    if (!parsedMockValue) {
        return { value: undefined };
    }
    return {
        value: expandArrays(parsedMockValue.value, parsedSpecParameter.schema, parsedSpecParameter.collectionFormat)
    };
};
exports.validateMockValueAgainstSpec = (parsedSpecParameter, parsedMockValue, parsedMockInteraction, validationResultCode) => {
    const schema = toJsonSchema(parsedSpecParameter);
    const wrappedParsedMockValue = toWrappedParsedMockValue(parsedMockValue, parsedSpecParameter);
    const errors = validate_json_1.validateJson(schema, wrappedParsedMockValue, true);
    return {
        match: errors.length === 0,
        results: _.map(errors, (error) => result_1.result.build({
            code: validationResultCode,
            message: 'Value is incompatible with the parameter defined in the spec file: ' + error.message,
            mockSegment: parsedMockValue || parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecParameter
        }))
    };
};
