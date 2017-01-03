import {cloneDeep} from 'lodash';
import {SwaggerResponseHeader} from '../../../../lib/swagger-pact-validator/types';

export interface ResponseHeaderBuilder {
    build: () => SwaggerResponseHeader;
}

const createResponseHeader = (responseHeader: SwaggerResponseHeader) => ({
    build: () => cloneDeep(responseHeader),
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
    }),
    withTypeArrayOfNumber: () => createResponseHeader({
        items: {type: 'number'},
        type: 'array'
    }),
    withTypeDate: () => createResponseHeader({
        format: 'date',
        type: 'string'
    }),
    withTypeNumber: () => createResponseHeader({type: 'number'}),
    withTypeString: () => createResponseHeader({type: 'string'})
});

export default createResponseHeader(null).withTypeString();
