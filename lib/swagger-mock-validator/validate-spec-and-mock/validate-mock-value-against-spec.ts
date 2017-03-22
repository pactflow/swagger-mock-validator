import * as _ from 'lodash';
import result from '../result';
import {
    JsonSchema,
    MultiCollectionFormatSeparator,
    ParsedMockInteraction,
    ParsedMockValue,
    ParsedSpecItem,
    ParsedSpecItemCollectionFormat,
    ParsedSpecParameter, ValidationResultCode
} from '../types';
import validateJson from './validate-json';

const toJsonSchema = (parsedSpecParameter: ParsedSpecParameter): JsonSchema => {
    const schema: JsonSchema = {
        properties: {
            value: {
                enum: parsedSpecParameter.enum,
                exclusiveMaximum: parsedSpecParameter.exclusiveMaximum,
                exclusiveMinimum: parsedSpecParameter.exclusiveMinimum,
                format: parsedSpecParameter.format as any,
                items: parsedSpecParameter.items as any,
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

const multiCollectionFormatSeparator: MultiCollectionFormatSeparator = '[multi-array-separator]';

const getCollectionSeparator = (parsedSpecItemCollectionFormat?: ParsedSpecItemCollectionFormat) => {
    // tslint:disable:cyclomatic-complexity
    if (parsedSpecItemCollectionFormat === 'ssv') {
        return ' ';
    } else if (parsedSpecItemCollectionFormat === 'tsv') {
        return '\t';
    } else if (parsedSpecItemCollectionFormat === 'pipes') {
        return '|';
    } else if (parsedSpecItemCollectionFormat === 'multi') {
        return multiCollectionFormatSeparator;
    }

    return ',';
    // tslint:enable:cyclomatic-complexity
};

const expandArrays = (parsedMockValue: string, parsedSpecItem: ParsedSpecItem): any => {
    if (parsedSpecItem.type === 'array') {
        const values = parsedMockValue.split(getCollectionSeparator(parsedSpecItem.collectionFormat));
        return _.map(values, (value) => expandArrays(value, parsedSpecItem.items as ParsedSpecItem));
    } else {
        return parsedMockValue;
    }
};

const toWrappedParsedMockValue = (
    parsedMockValue: ParsedMockValue<any>,
    parsedSpecItem: ParsedSpecItem
): {value: any} => {
    if (!parsedMockValue) {
        return {value: undefined};
    }

    return {value: expandArrays(parsedMockValue.value, parsedSpecItem)};
};

export default <T>(
    parsedSpecParameter: ParsedSpecParameter,
    parsedMockValue: ParsedMockValue<T>,
    parsedMockInteraction: ParsedMockInteraction,
    validationResultCode: ValidationResultCode
) => {
    const schema = toJsonSchema(parsedSpecParameter);
    const wrappedParsedMockValue = toWrappedParsedMockValue(parsedMockValue, parsedSpecParameter);
    const errors = validateJson(schema, wrappedParsedMockValue, true);

    return {
        match: errors.length === 0,
        results: _.map(errors, (error) => result.build({
            code: validationResultCode,
            message: 'Value is incompatible with the parameter defined in the swagger file: ' +
            error.message,
            mockSegment: parsedMockValue || parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecParameter
        }))
    };
};
