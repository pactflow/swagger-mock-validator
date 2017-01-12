import * as _ from 'lodash';
import result from '../result';
import {
    JsonSchema,
    MultiCollectionFormatSeparator,
    ParsedMockInteraction,
    ParsedMockValue,
    ParsedSpecItem,
    ParsedSpecItemCollectionFormat,
    ParsedSpecParameter
} from '../types';
import validateJson from './validate-json';

const toJsonSchema = (parameter: ParsedSpecParameter): JsonSchema => {
    const schema: JsonSchema = {
        properties: {
            value: {
                enum: parameter.enum,
                exclusiveMaximum: parameter.exclusiveMaximum,
                exclusiveMinimum: parameter.exclusiveMinimum,
                format: parameter.format as any,
                items: parameter.items as any,
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

const multiCollectionFormatSeparator: MultiCollectionFormatSeparator = '[multi-array-separator]';

const getCollectionSeparator = (collectionFormat?: ParsedSpecItemCollectionFormat) => {
    // tslint:disable:cyclomatic-complexity
    if (collectionFormat === 'ssv') {
        return ' ';
    } else if (collectionFormat === 'tsv') {
        return '\t';
    } else if (collectionFormat === 'pipes') {
        return '|';
    } else if (collectionFormat === 'multi') {
        return multiCollectionFormatSeparator;
    }

    return ',';
    // tslint:enable:cyclomatic-complexity
};

const toArrayMockValue = (pactValue: string, swaggerValue: ParsedSpecItem): any => {
    if (swaggerValue.type === 'array') {
        const values = pactValue.split(getCollectionSeparator(swaggerValue.collectionFormat));
        return _.map(values, (value) => toArrayMockValue(value, swaggerValue.items as ParsedSpecItem));
    } else {
        return pactValue;
    }
};

const toMockValue = (
    pactValue: ParsedMockValue<any>,
    swaggerValue: ParsedSpecItem
): {value: any} => {
    if (!pactValue) {
        return {value: undefined};
    }

    return {value: toArrayMockValue(pactValue.value, swaggerValue)};
};

export default <T>(
    swaggerValue: ParsedSpecParameter,
    pactValue: ParsedMockValue<T>,
    pactInteraction: ParsedMockInteraction
) => {
    const schema = toJsonSchema(swaggerValue);
    const mockValue = toMockValue(pactValue, swaggerValue);
    const errors = validateJson(schema, mockValue, true);

    return {
        match: errors.length === 0,
        results: _.map(errors, (error) => result.error({
            message: 'Value is incompatible with the parameter defined in the swagger file: ' +
            error.message,
            pactSegment: pactValue || pactInteraction,
            source: 'swagger-pact-validation',
            swaggerSegment: swaggerValue
        }))
    };
};
