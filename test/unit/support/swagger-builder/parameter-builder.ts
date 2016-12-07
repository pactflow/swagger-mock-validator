import {cloneDeep} from 'lodash';
import {SwaggerParameter} from '../../../../lib/swagger-pact-validator/types';
import {setValuesOn} from '../builder-utilities';
import {SchemaBuilder} from './schema-builder';

export interface ParameterBuilder {
    build: () => SwaggerParameter;
}

const createParameterBuilder = (parameter: SwaggerParameter) => {
    const builder = {
        build: () => cloneDeep(parameter),
        withArrayOfNumberInPathNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        })),
        withBooleanInPathNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'boolean'
        })),
        withIntegerInPathNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'integer'
        })),
        withNumberInPathNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'number'
        })),
        withOptionalSchemaInBody: (schemaBuilder: SchemaBuilder) => createParameterBuilder(setValuesOn(parameter, {
            in: 'body',
            name: 'body',
            required: false,
            schema: schemaBuilder.build(),
            type: undefined
        })),
        withRequiredNumberInQueryNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'query',
            name,
            required: true,
            type: 'number'
        })),
        withRequiredSchemaInBody: (schemaBuilder: SchemaBuilder) => createParameterBuilder(setValuesOn(parameter, {
            in: 'body',
            name: 'body',
            required: true,
            schema: schemaBuilder.build(),
            type: undefined
        })),
        withStringInPathNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'string'
        }))
    };

    return builder;
};

export default createParameterBuilder({
    in: 'path',
    name: 'default-name',
    required: false,
    type: 'number'
});
