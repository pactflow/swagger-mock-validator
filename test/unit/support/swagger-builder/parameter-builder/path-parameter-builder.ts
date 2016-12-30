import {cloneDeep} from 'lodash';
import {SwaggerPathParameter} from '../../../../../lib/swagger-pact-validator/types';

const createPathParameterBuilder = (parameter: SwaggerPathParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withArrayOfNumberNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
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
        withStringNamed: (name: string) => createPathParameterBuilder({
            in: 'path',
            name,
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

            return createPathParameterBuilder(parameterWithUnknownFormat as SwaggerPathParameter);
        }
    };
};

export const pathParameterBuilder = createPathParameterBuilder(null).withStringNamed('default-name');
