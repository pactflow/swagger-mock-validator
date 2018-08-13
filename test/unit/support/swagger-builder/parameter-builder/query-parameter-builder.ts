import {cloneDeep} from 'lodash';
import {
    Swagger2ItemCollectionFormat,
    Swagger2QueryParameter
} from '../../../../../lib/swagger-mock-validator/spec-parser/swagger2/swagger2';

const createQueryParameterBuilder = (parameter: Swagger2QueryParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withRequiredArrayOfNumbersNamed: (name: string, separator: Swagger2ItemCollectionFormat) =>
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
