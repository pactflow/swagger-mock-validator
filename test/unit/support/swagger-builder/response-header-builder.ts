import {cloneDeep} from 'lodash';
import {Swagger2ResponseHeader} from '../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';

export interface ResponseHeaderBuilder {
    build: () => Swagger2ResponseHeader;
}

const createResponseHeader = (responseHeader: Swagger2ResponseHeader) => ({
    build: () => cloneDeep(responseHeader),
    withArrayOfNumber: () => createResponseHeader({
        items: {type: 'number'},
        type: 'array'
    }),
    withArrayOfNumberMaxItems: (maxItems: number) => createResponseHeader({
        items: {type: 'number'},
        maxItems,
        type: 'array'
    }),
    withArrayOfNumberMinItems: (minItems: number) => createResponseHeader({
        items: {type: 'number'},
        minItems,
        type: 'array'
    }),
    withArrayOfNumberUniqueItems: () => createResponseHeader({
        items: {type: 'number'},
        type: 'array',
        uniqueItems: true
    }),
    withInt32: () => createResponseHeader(({
        format: 'int32',
        type: 'integer'
    })),
    withNumber: () => createResponseHeader({type: 'number'}),
    withNumberExclusiveMaximum: (maximum: number) => createResponseHeader({
        exclusiveMaximum: true,
        maximum,
        type: 'number'
    }),
    withNumberExclusiveMinimum: (minimum: number) => createResponseHeader({
        exclusiveMinimum: true,
        minimum,
        type: 'number'
    }),
    withNumberMultipleOf: (multipleOf: number) => createResponseHeader({
        multipleOf,
        type: 'number'
    }),
    withString: () => createResponseHeader({type: 'string'}),
    withStringEnum: (newEnum: any[]) => createResponseHeader({
        enum: newEnum,
        type: 'string'
    }),
    withStringMaxLength: (maxLength: number) => createResponseHeader({
        maxLength,
        type: 'string'
    }),
    withStringMinLength: (minLength: number) => createResponseHeader({
        minLength,
        type: 'string'
    }),
    withStringPattern: (pattern: string) => createResponseHeader({
        pattern,
        type: 'string'
    })
});

export const responseHeaderBuilder = createResponseHeader(undefined as any).withString();
