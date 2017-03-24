"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const result_1 = require("../result");
const validate_json_1 = require("./validate-json");
const toJsonSchema = (parsedSpecParameter) => {
    const schema = {
        properties: {
            value: {
                enum: parsedSpecParameter.enum,
                exclusiveMaximum: parsedSpecParameter.exclusiveMaximum,
                exclusiveMinimum: parsedSpecParameter.exclusiveMinimum,
                format: parsedSpecParameter.format,
                items: parsedSpecParameter.items,
                maxItems: parsedSpecParameter.maxItems,
                maxLength: parsedSpecParameter.maxLength,
                maximum: parsedSpecParameter.maximum,
                minItems: parsedSpecParameter.minItems,
                minLength: parsedSpecParameter.minLength,
                minimum: parsedSpecParameter.minimum,
                multipleOf: parsedSpecParameter.multipleOf,
                pattern: parsedSpecParameter.pattern,
                type: parsedSpecParameter.type,
                uniqueItems: parsedSpecParameter.uniqueItems
            }
        },
        type: 'object'
    };
    if (parsedSpecParameter.required) {
        schema.required = ['value'];
    }
    return schema;
};
const multiCollectionFormatSeparator = '[multi-array-separator]';
const getCollectionSeparator = (parsedSpecItemCollectionFormat) => {
    // tslint:disable:cyclomatic-complexity
    if (parsedSpecItemCollectionFormat === 'ssv') {
        return ' ';
    }
    else if (parsedSpecItemCollectionFormat === 'tsv') {
        return '\t';
    }
    else if (parsedSpecItemCollectionFormat === 'pipes') {
        return '|';
    }
    else if (parsedSpecItemCollectionFormat === 'multi') {
        return multiCollectionFormatSeparator;
    }
    return ',';
    // tslint:enable:cyclomatic-complexity
};
const expandArrays = (parsedMockValue, parsedSpecItem) => {
    if (parsedSpecItem.type === 'array') {
        const values = parsedMockValue.split(getCollectionSeparator(parsedSpecItem.collectionFormat));
        return _.map(values, (value) => expandArrays(value, parsedSpecItem.items));
    }
    else {
        return parsedMockValue;
    }
};
const toWrappedParsedMockValue = (parsedMockValue, parsedSpecItem) => {
    if (!parsedMockValue) {
        return { value: undefined };
    }
    return { value: expandArrays(parsedMockValue.value, parsedSpecItem) };
};
exports.default = (parsedSpecParameter, parsedMockValue, parsedMockInteraction, validationResultCode) => {
    const schema = toJsonSchema(parsedSpecParameter);
    const wrappedParsedMockValue = toWrappedParsedMockValue(parsedMockValue, parsedSpecParameter);
    const errors = validate_json_1.default(schema, wrappedParsedMockValue, true);
    return {
        match: errors.length === 0,
        results: _.map(errors, (error) => result_1.default.build({
            code: validationResultCode,
            message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                error.message,
            mockSegment: parsedMockValue || parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecParameter
        }))
    };
};
