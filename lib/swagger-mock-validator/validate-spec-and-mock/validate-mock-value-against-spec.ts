import _ from 'lodash';
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
};

const isParsedSpecJsonSchemaCore = (schema?: ParsedSpecJsonSchema): schema is ParsedSpecJsonSchemaCore =>
    isObject(schema);

const expandArrays = (
    parsedMockValue: string,
    parsedSpecParameterSchema: ParsedSpecJsonSchema | undefined,
    parsedSpecCollectionFormat?: ParsedSpecCollectionFormat
): any => {
    if (isParsedSpecJsonSchemaCore(parsedSpecParameterSchema) && parsedSpecParameterSchema.type === 'array') {
        const values = parsedMockValue.split(getCollectionSeparator(parsedSpecCollectionFormat));
        return _.map(values, (value) => expandArrays(value, parsedSpecParameterSchema.items));
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

    return {
        value: expandArrays(parsedMockValue.value, parsedSpecParameter.schema, parsedSpecParameter.collectionFormat)
    };
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
            message: 'Value is incompatible with the parameter defined in the spec file: ' + error.message,
            mockSegment: parsedMockValue || parsedMockInteraction,
            source: 'spec-mock-validation',
            specSegment: parsedSpecParameter
        }))
    };
};
