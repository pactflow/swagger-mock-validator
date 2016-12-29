import {cloneDeep} from 'lodash';
import {SwaggerParameter} from '../../../../lib/swagger-pact-validator/types';
import {setValuesOn} from '../builder-utilities';
import {SchemaBuilder} from './schema-builder';

export interface ParameterBuilder {
    build: () => SwaggerParameter;
}

const createParameterBuilder = (parameter: SwaggerParameter) => {
    return {
        build: () => cloneDeep(parameter),
        withNumberInPathNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'path',
            name,
            required: true,
            type: 'number'
        })),
        withOptionalNumberInHeaderNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'header',
            name,
            required: false,
            type: 'number'
        })),
        withOptionalSchemaInBody: (schemaBuilder: SchemaBuilder) => createParameterBuilder(setValuesOn(parameter, {
            in: 'body',
            name: 'body',
            required: false,
            schema: schemaBuilder.build(),
            type: undefined
        })),
        withRequiredArrayOfNumbersInHeaderNamed: (name: string) => createParameterBuilder((setValuesOn(parameter, {
            in: 'header',
            items: {type: 'number'},
            name,
            required: true,
            type: 'array'
        }))),
        withRequiredNumberInHeaderNamed: (name: string) => createParameterBuilder(setValuesOn(parameter, {
            in: 'header',
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
        }))
    };
};

export default createParameterBuilder({
    in: 'path',
    name: 'default-name',
    required: true,
    type: 'number'
});
