import {cloneDeep} from 'lodash';
import {SwaggerItemCollectionFormat, SwaggerParameter} from '../../../../lib/swagger-pact-validator/types';
import {SchemaBuilder} from './schema-builder';

export interface ParameterBuilder {
    build: () => SwaggerParameter;
}

const createParameterBuilder = (parameter: SwaggerParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withNumberInPathNamed: (name: string) => createParameterBuilder({
            in: 'path',
            name,
            required: true,
            type: 'number'
        }),
        withOptionalNumberInHeaderNamed: (name: string) => createParameterBuilder({
            in: 'header',
            name,
            required: false,
            type: 'number'
        }),
        withOptionalSchemaInBody: (schemaBuilder: SchemaBuilder) => createParameterBuilder({
            in: 'body',
            name: 'body',
            required: false,
            schema: schemaBuilder.build()
        }),
        withRequiredArrayOfNumbersInHeaderNamed: (name: string) => createParameterBuilder({
            in: 'header',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }),
        withRequiredArrayOfNumbersInQueryNamed: (name: string, separator: SwaggerItemCollectionFormat) =>
            createParameterBuilder({
                collectionFormat: separator,
                in: 'query',
                items: {
                    type: 'number'
                },
                name,
                required: true,
                type: 'array'
            }
        ),
        withRequiredNumberInHeaderNamed: (name: string) => createParameterBuilder({
            in: 'header',
            name,
            required: true,
            type: 'number'
        }),
        withRequiredNumberInQueryNamed: (name: string) => createParameterBuilder({
            in: 'query',
            name,
            required: true,
            type: 'number'
        }),
        withRequiredSchemaInBody: (schemaBuilder: SchemaBuilder) => createParameterBuilder({
            in: 'body',
            name: 'body',
            required: true,
            schema: schemaBuilder.build(),
            type: undefined
        })
    };
};

export default createParameterBuilder({
    in: 'path',
    name: 'default-name',
    required: true,
    type: 'number'
});
