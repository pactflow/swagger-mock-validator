import * as _ from 'lodash';
import {isObject} from 'util';
import {ValidationResultCode} from '../../api-types';
import {ParsedMockInteraction, ParsedMockValue} from '../mock-parser/parsed-mock';
import {result} from '../result';
import {
    ParsedSpecCollectionFormat,
    ParsedSpecJsonSchema,
    ParsedSpecJsonSchemaCore,
    ParsedSpecParameter
} from '../spec-parser/parsed-spec';
import {MultiCollectionFormatSeparator} from '../types';
import {validateJson} from './validate-json';

const toJsonSchema = (parsedSpecParameter: ParsedSpecParameter): ParsedSpecJsonSchema => {
    const schema: ParsedSpecJsonSchema = {
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

const multiCollectionFormatSeparator: MultiCollectionFormatSeparator = '[multi-array-separator]';

const getCollectionSeparator = (parsedSpecCollectionFormat?: ParsedSpecCollectionFormat) => {
    // tslint:disable:cyclomatic-complexity
    if (parsedSpecCollectionFormat === 'ssv') {
        return ' ';
    } else if (parsedSpecCollectionFormat === 'tsv') {
        return '\t';
    } else if (parsedSpecCollectionFormat === 'pipes') {
        return '|';
    } else if (parsedSpecCollectionFormat === 'multi') {
        return multiCollectionFormatSeparator;
    }

    return ',';
    // tslint:enable:cyclomatic-complexity
};

const isParsedSpecJsonSchemaCore = (schema: ParsedSpecJsonSchema): schema is ParsedSpecJsonSchemaCore =>
    isObject(schema);

const expandArrays = (parsedMockValue: string, parsedSpecParameterSchema: ParsedSpecJsonSchema): any => {
    if (isParsedSpecJsonSchemaCore(parsedSpecParameterSchema) && parsedSpecParameterSchema.type === 'array') {
        const values = parsedMockValue.split(getCollectionSeparator(parsedSpecParameterSchema.collectionFormat));
        return _.map(values, (value) =>
            expandArrays(value, parsedSpecParameterSchema.items || {}));
    } else {
        return parsedMockValue;
    }
};

const toWrappedParsedMockValue = (
    parsedMockValue: ParsedMockValue<any>,
    parsedSpecParameter: ParsedSpecParameter
): {value: any} => {
    if (!parsedMockValue) {
        return {value: undefined};
    }

    return {value: expandArrays(parsedMockValue.value, parsedSpecParameter.schema)};
};

export const validateMockValueAgainstSpec = <T>(
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
