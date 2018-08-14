import {cloneDeep} from 'lodash';
import {Swagger2PathParameter} from '../../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';

const createPathParameterBuilder = (parameter: Swagger2PathParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withArrayOfArrayOfNumberTabAndCommaSeparatedNamed: (name: string) => createPathParameterBuilder({
            collectionFormat: 'tsv',
            in: 'path',
            items: {
                collectionFormat: 'csv',
                items: {type: 'number'},
                type: 'array'
            },
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfInt32Named: (name: string) => createPathParameterBuilder({
            in: 'path',
            items: {
                format: 'int32',
                type: 'integer'
            },
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberCommaSeparatedNamed: (name: string) => createPathParameterBuilder({
            collectionFormat: 'csv',
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberMaxItemsNamed: (name: string, maxItems: number) => createPathParameterBuilder({
            in: 'path',
            items: {type: 'number'},
            maxItems,
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberMinItemsNamed: (name: string, minItems: number) => createPathParameterBuilder({
            in: 'path',
            items: {type: 'number'},
            minItems,
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberPipeSeparatedNamed: (name: string) => createPathParameterBuilder({
            collectionFormat: 'pipes',
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberSpaceSeparatedNamed: (name: string) => createPathParameterBuilder({
            collectionFormat: 'ssv',
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberTabSeparatedNamed: (name: string) => createPathParameterBuilder({
            collectionFormat: 'tsv',
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }),
        withArrayOfNumberUniqueItemsNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array',
            uniqueItems: true
        }),
        withBinaryNamed: (name: string) => createPathParameterBuilder({
            format: 'binary',
            in: 'path',
            name,
            required: true,
            type: 'string'
        }),
        withBooleanNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            name,
            required: true,
            type: 'boolean'
        }),
        withByteNamed: (name: string) => createPathParameterBuilder({
            format: 'byte',
            in: 'path',
            name,
            required: true,
            type: 'string'
        }),
        withDateNamed: (name: string) => createPathParameterBuilder({
            format: 'date',
            in: 'path',
            name,
            required: true,
            type: 'string'
        }),
        withDateTimeNamed: (name: string) => createPathParameterBuilder({
            format: 'date-time',
            in: 'path',
            name,
            required: true,
            type: 'string'
        }),
        withDoubleNamed: (name: string) => createPathParameterBuilder({
            format: 'double',
            in: 'path',
            name,
            required: true,
            type: 'number'
        }),
        withFloatNamed: (name: string) => createPathParameterBuilder({
            format: 'float',
            in: 'path',
            name,
            required: true,
            type: 'number'
        }),
        withInt32Named: (name: string) => createPathParameterBuilder({
            format: 'int32',
            in: 'path',
            name,
            required: true,
            type: 'integer'
        }),
        withInt64Named: (name: string) => createPathParameterBuilder({
            format: 'int64',
            in: 'path',
            name,
            required: true,
            type: 'integer'
        }),
        withIntegerNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            name,
            required: true,
            type: 'integer'
        }),
        withNumberExclusiveMaximumNamed: (name: string, maximum: number) => createPathParameterBuilder({
            exclusiveMaximum: true,
            in: 'path',
            maximum,
            name,
            required: true,
            type: 'number'
        }),
        withNumberExclusiveMinimumNamed: (name: string, minimum: number) => createPathParameterBuilder({
            exclusiveMinimum: true,
            in: 'path',
            minimum,
            name,
            required: true,
            type: 'number'
        }),
        withNumberMaximumNamed: (name: string, maximum: number) => createPathParameterBuilder({
            in: 'path',
            maximum,
            name,
            required: true,
            type: 'number'
        }),
        withNumberMinimumNamed: (name: string, minimum: number) => createPathParameterBuilder({
            in: 'path',
            minimum,
            name,
            required: true,
            type: 'number'
        }),
        withNumberMultipleOfNamed: (name: string, multipleOf: number) => createPathParameterBuilder({
            in: 'path',
            multipleOf,
            name,
            required: true,
            type: 'number'
        }),
        withNumberNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            name,
            required: true,
            type: 'number'
        }),
        withPasswordNamed: (name: string) => createPathParameterBuilder({
            format: 'password',
            in: 'path',
            name,
            required: true,
            type: 'string'
        }),
        withStringEnumNamed: (name: string, enumValues: any[]) => createPathParameterBuilder({
            enum: cloneDeep(enumValues),
            in: 'path',
            name,
            required: true,
            type: 'string'
        }),
        withStringMaxLengthNamed: (name: string, maxLength: number) => createPathParameterBuilder({
            in: 'path',
            maxLength,
            name,
            required: true,
            type: 'string'
        }),
        withStringMinLengthNamed: (name: string, minLength: number) => createPathParameterBuilder({
            in: 'path',
            minLength,
            name,
            required: true,
            type: 'string'
        }),
        withStringNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            name,
            required: true,
            type: 'string'
        }),
        withStringPatternNamed: (name: string, pattern: string) => createPathParameterBuilder({
            in: 'path',
            name,
            pattern,
            required: true,
            type: 'string'
        }),
        withUnknownStringFormatNamed: (format: string, name: string) => {
            const parameterWithUnknownFormat = {
                format,
                in: 'path',
                name,
                required: true,
                type: 'string'
            };

            return createPathParameterBuilder(parameterWithUnknownFormat as Swagger2PathParameter);
        }
    };
};

export const pathParameterBuilder = createPathParameterBuilder(undefined as any).withStringNamed('default-name');
