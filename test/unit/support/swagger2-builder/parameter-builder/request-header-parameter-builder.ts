import {cloneDeep} from 'lodash';
import {Swagger2RequestHeaderParameter} from '../../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';

const createRequestHeaderParameterBuilder = (parameter: Swagger2RequestHeaderParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withOptionalNumberNamed: (name: string) => createRequestHeaderParameterBuilder({
            in: 'header',
            name,
            required: false,
            type: 'number'
        }),
        withRequiredArrayOfNumbersNamed: (name: string) => createRequestHeaderParameterBuilder({
            in: 'header',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }),
        withRequiredNumberNamed: (name: string) => createRequestHeaderParameterBuilder({
            in: 'header',
            name,
            required: true,
            type: 'number'
        })
    };
};

export const requestHeaderParameterBuilder = createRequestHeaderParameterBuilder(undefined as any)
    .withRequiredNumberNamed('default-name');
