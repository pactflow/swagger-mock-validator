import {cloneDeep} from 'lodash';
import {
    Parameter,
    ParameterWithSchemaWithExampleInHeader as OpenApi3HeaderParameter,
    ParameterWithSchemaWithExampleInPath as OpenApi3PathParameter,
    ParameterWithSchemaWithExampleInQuery as OpenApi3QueryParameter
} from '../../../../lib/swagger-mock-validator/spec-parser/openapi3/openapi3';
import {setValueOn} from '../builder-utilities';
import {OpenApi3ContentBuilder} from './openapi3-content-builder';
import {OpenApi3SchemaBuilder} from './openapi3-schema-builder';

export interface OpenApi3ParameterBuilder {
    build(): Parameter;
}

type OpenApi3Parameter = OpenApi3QueryParameter | OpenApi3HeaderParameter | OpenApi3PathParameter;

const createOpenApi3ParameterBuilder = (parameter: OpenApi3Parameter) => {
    return {
        build: () => cloneDeep(parameter),
        withContent: (contentBuilder: OpenApi3ContentBuilder) => {
            const parameterWithContent = setValueOn(parameter, 'content', contentBuilder.build());
            delete (parameterWithContent as Partial<OpenApi3Parameter>).schema;
            return createOpenApi3ParameterBuilder(parameterWithContent);
        },
        withName: (name: string) =>
            createOpenApi3ParameterBuilder(setValueOn(parameter, 'name', name)),
        withRequired: () =>
            createOpenApi3ParameterBuilder(setValueOn(parameter, 'required', true)),
        withSchema: (schemaBuilder: OpenApi3SchemaBuilder) =>
            createOpenApi3ParameterBuilder(setValueOn(parameter, 'schema', schemaBuilder.build())),
        withSchemaRef: (refName: string) =>
            createOpenApi3ParameterBuilder(setValueOn(parameter, 'schema', {$ref: refName}))
    };
};

export const openApi3QueryParameterBuilder = createOpenApi3ParameterBuilder({
    in: 'query',
    name: 'default-name',
    schema: {type: 'number'}
});

export const openApi3HeaderParameterBuilder = createOpenApi3ParameterBuilder({
    in: 'header',
    name: 'default-name',
    schema: {type: 'number'}
});

export const openApi3PathParameterBuilder = createOpenApi3ParameterBuilder({
    in: 'path',
    name: 'default-name',
    required: true,
    schema: {type: 'number'}
});
