import {cloneDeep} from 'lodash';
import {SwaggerItemCollectionFormat, SwaggerQueryParameter} from '../../../../../lib/swagger-pact-validator/types';

const createQueryParameterBuilder = (parameter: SwaggerQueryParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withRequiredArrayOfNumbersNamed: (name: string, separator: SwaggerItemCollectionFormat) =>
            createQueryParameterBuilder({
                collectionFormat: separator,
                in: 'query',
                items: {
                    type: 'number'
                },
                name,
                required: true,
                type: 'array'
            }),
        withRequiredNumberNamed: (name: string) => createQueryParameterBuilder({
            in: 'query',
            name,
            required: true,
            type: 'number'
        })
    };
};

export const queryParameterBuilder = createQueryParameterBuilder(undefined as any)
    .withRequiredNumberNamed('default-name');
