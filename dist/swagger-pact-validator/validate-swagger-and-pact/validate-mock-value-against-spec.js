"use strict";
const _ = require("lodash");
const result_1 = require("../result");
const validate_json_1 = require("./validate-json");
const toJsonSchema = (parameter) => {
    const schema = {
        properties: {
            value: {
                enum: parameter.enum,
                exclusiveMaximum: parameter.exclusiveMaximum,
                exclusiveMinimum: parameter.exclusiveMinimum,
                format: parameter.format,
                items: parameter.items,
                maxItems: parameter.maxItems,
                maxLength: parameter.maxLength,
                maximum: parameter.maximum,
                minItems: parameter.minItems,
                minLength: parameter.minLength,
                minimum: parameter.minimum,
                multipleOf: parameter.multipleOf,
                pattern: parameter.pattern,
                type: parameter.type,
                uniqueItems: parameter.uniqueItems
            }
        },
        type: 'object'
    };
    if (parameter.required) {
        schema.required = ['value'];
    }
    return schema;
};
const getCollectionSeparator = (collectionFormat) => {
    if (collectionFormat === 'ssv') {
        return ' ';
    }
    else if (collectionFormat === 'tsv') {
        return '\t';
    }
    else if (collectionFormat === 'pipes') {
        return '|';
    }
    return ',';
};
const toArrayMockValue = (pactValue, swaggerValue) => {
    if (swaggerValue.type === 'array') {
        const values = pactValue.split(getCollectionSeparator(swaggerValue.collectionFormat));
        return _.map(values, (value) => toArrayMockValue(value, swaggerValue.items));
    }
    else {
        return pactValue;
    }
};
const toMockValue = (pactValue, swaggerValue) => {
    if (!pactValue) {
        return { value: undefined };
    }
    return { value: toArrayMockValue(pactValue.value.toString(), swaggerValue) };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (swaggerValue, pactValue, pactInteraction) => {
    const schema = toJsonSchema(swaggerValue);
    const mockValue = toMockValue(pactValue, swaggerValue);
    const errors = validate_json_1.default(schema, mockValue, true);
    return {
        match: errors.length === 0,
        results: _.map(errors, (error) => result_1.default.error({
            message: 'Value is incompatible with the parameter defined in the swagger file: ' +
                error.message,
            pactSegment: pactValue || pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerValue
        }))
    };
};
