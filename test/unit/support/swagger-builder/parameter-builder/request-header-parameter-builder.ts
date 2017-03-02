import {cloneDeep} from 'lodash';
import {SwaggerRequestHeaderParameter} from '../../../../../lib/swagger-pact-validator/types';

const createRequestHeaderParameterBuilder = (parameter: SwaggerRequestHeaderParameter) => {
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
